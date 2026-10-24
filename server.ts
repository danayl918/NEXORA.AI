import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Body parser with 25MB limit for document handling
app.use(express.json({ limit: '25mb' }));

// Default cost-efficient model as requested
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';

// Simple server-side session usage tracking
const usageStats = {
  totalRequests: 0,
  chatRequests: 0,
  docRequests: 0,
  codeRequests: 0,
  approxTokens: 0,
  startTime: new Date().toISOString(),
  demoLimit: 100, // per-session demo budget
};

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Function Declarations for the Primary Agent's Tools
const createTaskTool: FunctionDeclaration = {
  name: 'createTask',
  description: 'Create a new task in the user\'s task planner when the user explicitly or implicitly requests a task, todo item, or action item.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: 'Short, clear title of the task.',
      },
      description: {
        type: Type.STRING,
        description: 'Detailed description or steps for the task.',
      },
      priority: {
        type: Type.STRING,
        description: 'Priority level: "low", "medium", or "high". Defaults to "medium".',
      },
      dueDate: {
        type: Type.STRING,
        description: 'Optional due date or timeframe (e.g. "Today", "Tomorrow", "2026-10-30").',
      },
      category: {
        type: Type.STRING,
        description: 'Category such as "Development", "Design", "Research", "General".',
      },
    },
    required: ['title'],
  },
};

const listTasksTool: FunctionDeclaration = {
  name: 'listTasks',
  description: 'List current tasks in the user\'s workspace to answer questions about pending or completed todos.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      status: {
        type: Type.STRING,
        description: 'Filter by "all", "pending", or "completed". Defaults to "pending".',
      },
    },
  },
};

const completeTaskTool: FunctionDeclaration = {
  name: 'completeTask',
  description: 'Mark an existing task as completed by task ID or title match.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      taskIdentifier: {
        type: Type.STRING,
        description: 'The task ID or task title to mark as completed.',
      },
    },
    required: ['taskIdentifier'],
  },
};

const analyzeDocumentSnippetTool: FunctionDeclaration = {
  name: 'analyzeDocumentSnippet',
  description: 'Analyze an attached document or text excerpt for key insights, summaries, or specific queries.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: 'Specific question or instruction regarding the document.',
      },
      focusArea: {
        type: Type.STRING,
        description: 'Focus area e.g. "Summary", "Action Items", "Code Review", "Key Findings".',
      },
    },
    required: ['query'],
  },
};

// --- API Routes ---

// 1. Health & Configuration check
app.get('/api/health', (req: Request, res: Response) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 5);
  res.json({
    status: 'ok',
    hasApiKey: hasKey,
    activeModel: DEFAULT_MODEL,
    usage: usageStats,
  });
});

// 2. Primary Agent Chat with tool-calling & bounded execution loop
app.post('/api/chat', async (req: Request, res: Response) => {
  const { messages, currentTasks = [], attachedDocument = null, model: requestedModel } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array is required and must not be empty.' });
  }

  const ai = getGeminiClient();
  if (!ai) {
    return res.status(503).json({
      error: 'Gemini API key is not configured on the server. Please configure GEMINI_API_KEY in the environment or Settings panel.',
    });
  }

  // Cost and usage check
  if (usageStats.totalRequests >= usageStats.demoLimit) {
    return res.status(429).json({
      error: `Session demo limit of ${usageStats.demoLimit} requests reached. You can reset usage in Settings or upgrade your quota.`,
    });
  }

  const activeModel = requestedModel || DEFAULT_MODEL;

  try {
    usageStats.totalRequests++;
    usageStats.chatRequests++;

    // Format bounded conversation history (cost control: keep last 10 messages)
    const boundedMessages = messages.slice(-10);

    // Prepare contents
    const contents: any[] = [];

    // System instruction
    const systemInstruction = `You are NEXORA AI, an intelligent workspace AI agent.
Your interface is dark, refined, and minimalist.
You are professional, concise, capable, and honest.
- Answer user questions directly with clean Markdown, bullet points, and syntax-highlighted code blocks where appropriate.
- When asked to organize tasks or todos, use the createTask or completeTask tools.
- When user asks about their tasks, use listTasks.
- When referencing attached documents, clearly distinguish information found in the document from general knowledge.
- Never pretend to have executed code or accessed live internet databases if you did not.
- Keep responses readable, well-structured, and helpful.`;

    // Process prior messages into Gemini contents
    for (let i = 0; i < boundedMessages.length; i++) {
      const msg = boundedMessages[i];
      const role = msg.role === 'user' ? 'user' : 'model';

      // For the last user message, check if there's an attached document
      if (i === boundedMessages.length - 1 && msg.role === 'user' && attachedDocument) {
        const parts: any[] = [];

        // If PDF or base64 data
        if (attachedDocument.base64 && attachedDocument.mimeType) {
          parts.push({
            inlineData: {
              data: attachedDocument.base64,
              mimeType: attachedDocument.mimeType,
            },
          });
          parts.push({
            text: `[Attached Document: "${attachedDocument.name || 'Document'}" (${attachedDocument.mimeType})] \n\n${msg.content}`,
          });
        } else if (attachedDocument.text) {
          parts.push({
            text: `[Attached Document Content from "${attachedDocument.name || 'Document'}"]:\n\`\`\`\n${attachedDocument.text.slice(0, 15000)}\n\`\`\`\n\nUser Question:\n${msg.content}`,
          });
        } else {
          parts.push({ text: msg.content });
        }
        contents.push({ role: 'user', parts });
      } else {
        contents.push({
          role,
          parts: [{ text: msg.content }],
        });
      }
    }

    // Step 1: Initial model call with tools enabled
    const tools = [
      {
        functionDeclarations: [
          createTaskTool,
          listTasksTool,
          completeTaskTool,
          analyzeDocumentSnippetTool,
        ],
      },
    ];

    const response = await ai.models.generateContent({
      model: activeModel,
      contents,
      config: {
        systemInstruction,
        tools,
        temperature: 0.7,
      },
    });

    const functionCalls = response.functionCalls;
    const actionsTaken: any[] = [];

    // Check if tools were called
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      let toolResult: any = null;

      if (call.name === 'createTask') {
        const args = (call.args || {}) as any;
        const newTask = {
          id: 'task_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
          title: args.title || 'New Task',
          description: args.description || '',
          priority: args.priority || 'medium',
          dueDate: args.dueDate || 'Soon',
          category: args.category || 'General',
          completed: false,
          createdAt: new Date().toISOString(),
        };
        actionsTaken.push({ type: 'TASK_CREATED', task: newTask });
        toolResult = { success: true, createdTask: newTask, message: `Task "${newTask.title}" created successfully.` };
      } else if (call.name === 'listTasks') {
        const args = (call.args || {}) as any;
        const filter = args.status || 'pending';
        let filtered = currentTasks;
        if (filter === 'pending') filtered = currentTasks.filter((t: any) => !t.completed);
        else if (filter === 'completed') filtered = currentTasks.filter((t: any) => t.completed);
        toolResult = {
          totalTasks: currentTasks.length,
          filterApplied: filter,
          tasks: filtered,
        };
      } else if (call.name === 'completeTask') {
        const args = (call.args || {}) as any;
        const ident = (args.taskIdentifier || '').toLowerCase();
        const matched = currentTasks.find(
          (t: any) => t.id === ident || t.title.toLowerCase().includes(ident)
        );
        if (matched) {
          actionsTaken.push({ type: 'TASK_COMPLETED', taskId: matched.id, taskTitle: matched.title });
          toolResult = { success: true, completedTaskId: matched.id, taskTitle: matched.title };
        } else {
          toolResult = { success: false, error: `No task found matching "${args.taskIdentifier}".` };
        }
      } else if (call.name === 'analyzeDocumentSnippet') {
        toolResult = {
          documentStatus: attachedDocument ? 'Document available' : 'No document attached in current request',
          note: 'Direct document extraction completed.',
        };
      }

      // Step 2: Feed function call result back to Gemini to synthesize natural response (bounded loop max 1 return)
      const followUpContents = [
        ...contents,
        response.candidates?.[0]?.content || {
          role: 'model',
          parts: [{ text: 'Calling tool: ' + call.name }],
        },
        {
          role: 'user',
          parts: [
            {
              functionResponse: {
                name: call.name,
                response: toolResult,
              },
            },
          ],
        },
      ];

      const followUpResponse = await ai.models.generateContent({
        model: activeModel,
        contents: followUpContents,
        config: {
          systemInstruction,
        },
      });

      const finalText = followUpResponse.text || `Executed ${call.name} successfully.`;
      usageStats.approxTokens += Math.ceil((finalText.length + 200) / 4);

      return res.json({
        text: finalText,
        toolCall: {
          name: call.name,
          args: call.args,
          result: toolResult,
        },
        actionsTaken,
        modelUsed: activeModel,
      });
    }

    // Direct response without tool calls
    const text = response.text || 'I have processed your request.';
    usageStats.approxTokens += Math.ceil((text.length + 150) / 4);

    return res.json({
      text,
      toolCall: null,
      actionsTaken: [],
      modelUsed: activeModel,
    });
  } catch (error: any) {
    console.error('Gemini Chat Error:', error);
    const errorMessage = error?.message || 'Failed to generate response.';
    const isRateLimit = errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED');

    return res.status(isRateLimit ? 429 : 500).json({
      error: isRateLimit
        ? 'Gemini API rate limit reached or quota exhausted. Please wait a moment before trying again.'
        : `AI Service Error: ${errorMessage}`,
    });
  }
});

// 3. Dedicated Document Analysis
app.post('/api/analyze-document', async (req: Request, res: Response) => {
  const { document, analysisType = 'summary', query } = req.body;

  if (!document) {
    return res.status(400).json({ error: 'No document data provided.' });
  }

  const ai = getGeminiClient();
  if (!ai) {
    return res.status(503).json({ error: 'Gemini API key is not configured on the server.' });
  }

  try {
    usageStats.totalRequests++;
    usageStats.docRequests++;

    const parts: any[] = [];

    if (document.base64 && document.mimeType === 'application/pdf') {
      parts.push({
        inlineData: {
          data: document.base64,
          mimeType: 'application/pdf',
        },
      });
    } else if (document.text) {
      parts.push({
        text: `DOCUMENT CONTENT ("${document.name || 'Document'}"):\n\n${document.text.slice(0, 30000)}`,
      });
    } else {
      return res.status(400).json({ error: 'Document must contain either text content or a PDF base64 payload.' });
    }

    let instruction = 'Analyze this document comprehensively.';
    if (analysisType === 'summary') {
      instruction = 'Provide: 1) Executive Summary (2-3 paragraphs), 2) Key Points/Takeaways (bulleted), 3) Actionable Insights, 4) Document Structure Overview.';
    } else if (analysisType === 'qa' && query) {
      instruction = `Answer the user question strictly based on the provided document: "${query}". Clearly report if the document does not contain sufficient information to answer.`;
    } else if (analysisType === 'action_items') {
      instruction = 'Extract all implicit and explicit action items, deadlines, responsibilities, and next steps mentioned in this document.';
    } else if (analysisType === 'critique') {
      instruction = 'Provide a critical review of this document: clarity, logical consistency, strengths, weaknesses, and recommendations for improvement.';
    }

    parts.push({ text: instruction });

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: { parts },
      config: {
        systemInstruction: 'You are NEXORA Document Assistant. You analyze documents thoroughly, accurately, and clearly. Distinguish direct document citations from general inferences.',
        temperature: 0.3,
      },
    });

    const result = response.text || 'Document analysis completed.';
    usageStats.approxTokens += Math.ceil(result.length / 4);

    return res.json({ result, modelUsed: DEFAULT_MODEL });
  } catch (error: any) {
    console.error('Document analysis error:', error);
    return res.status(500).json({ error: error.message || 'Failed to analyze document.' });
  }
});

// 4. Dedicated Coding Assistant
app.post('/api/code-assist', async (req: Request, res: Response) => {
  const { code, language = 'javascript', mode = 'explain', prompt = '' } = req.body;

  if (!code && mode !== 'generate') {
    return res.status(400).json({ error: 'Code snippet is required for this action.' });
  }

  const ai = getGeminiClient();
  if (!ai) {
    return res.status(503).json({ error: 'Gemini API key is not configured on the server.' });
  }

  try {
    usageStats.totalRequests++;
    usageStats.codeRequests++;

    let modePrompt = '';
    if (mode === 'explain') {
      modePrompt = `Explain this ${language} code in clear, beginner-friendly terms. Break it down section by section, explaining what each part does and why.`;
    } else if (mode === 'debug') {
      modePrompt = `Review this ${language} code for bugs, logic flaws, edge cases, and performance issues. Provide: 1) Diagnosed Issues, 2) Corrected Code snippet, 3) Explanation of the fixes.`;
    } else if (mode === 'refactor') {
      modePrompt = `Refactor this ${language} code for better readability, idiomatic modern practices, error handling, and performance. Show before/after explanation.`;
    } else if (mode === 'generate') {
      modePrompt = `Generate clean, production-ready, well-commented ${language} code for: "${prompt}". Explain how it works and how to use it.`;
    } else if (mode === 'review') {
      modePrompt = `Perform a comprehensive Code Quality Review on this ${language} code: Code cleanliness, Architecture & Best Practices, Security & Vulnerabilities, Time/Space Complexity.`;
    }

    const fullPrompt = `${modePrompt}\n\nAdditional user notes: ${prompt || 'None'}\n\nCode snippet (${language}):\n\`\`\`${language}\n${code || ''}\n\`\`\``;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: fullPrompt,
      config: {
        systemInstruction: 'You are NEXORA Coding Assistant. You are an expert senior software engineer. Provide clean, secure, idiomatically written code with thorough explanations. Never claim code was executed in a sandbox if it was only statically analyzed.',
        temperature: 0.4,
      },
    });

    const result = response.text || 'Code analysis completed.';
    usageStats.approxTokens += Math.ceil(result.length / 4);

    return res.json({ result, modelUsed: DEFAULT_MODEL });
  } catch (error: any) {
    console.error('Code assistant error:', error);
    return res.status(500).json({ error: error.message || 'Failed to process code request.' });
  }
});

// 5. Reset demo usage route
app.post('/api/usage/reset', (req: Request, res: Response) => {
  usageStats.totalRequests = 0;
  usageStats.chatRequests = 0;
  usageStats.docRequests = 0;
  usageStats.codeRequests = 0;
  usageStats.approxTokens = 0;
  res.json({ success: true, message: 'Usage counter reset.', usage: usageStats });
});

// Vite or Static file serving
async function setupViteOrStatic() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`NEXORA AI server running at http://localhost:${port}`);
  });
}

setupViteOrStatic();
