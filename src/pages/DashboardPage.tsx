import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  FileText,
  Code,
  CheckSquare,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Terminal,
  Activity,
  Layers,
  Zap,
  X,
  Lightbulb,
  Keyboard,
  HelpCircle,
} from 'lucide-react';
import { NavPage } from '../components/Sidebar';
import { Task, Conversation, ActivityLog, ServerUsage } from '../types';
import { storage } from '../utils/storage';

export interface SuggestedTask {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  sourceConvTitle: string;
  matchedKeyword: string;
}

/**
 * Helper function that analyzes chat messages across conversations to detect
 * project-related keywords and proposes actionable tasks for the user.
 */
export function detectProjectTaskSuggestions(
  conversations: Conversation[],
  existingTasks: Task[]
): SuggestedTask[] {
  const suggestions: SuggestedTask[] = [];
  const existingTitles = new Set(
    existingTasks.map((t) => t.title.toLowerCase().trim())
  );

  const projectKeywords = [
    'implement',
    'deploy',
    'refactor',
    'fix bug',
    'optimize',
    'setup auth',
    'api design',
    'database schema',
    'test suite',
    'code review',
    'dockerize',
    'ci/cd pipeline',
    'security audit',
    'architecture review',
    'concurrency control',
    'rate limiting',
    'error handling',
    'documentation',
    'build',
    'testing',
    'caching',
    'validation',
  ];

  // Helper to deduplicate and validate candidates
  const addCandidate = (
    title: string,
    convTitle: string,
    matchedKeyword: string,
    rawText: string
  ) => {
    // Clean and normalize title
    let cleanTitle = title
      .replace(/^[\s\-*•:>#]+/, '')
      .replace(/[`*_]/g, '')
      .trim();

    if (cleanTitle.length < 8 || cleanTitle.length > 90) return;
    cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1).replace(/[,.:;]+$/, '');

    const lower = cleanTitle.toLowerCase();
    if (existingTitles.has(lower)) return;
    if (suggestions.some((s) => s.title.toLowerCase() === lower)) return;

    // Infer priority
    let priority: 'low' | 'medium' | 'high' = 'medium';
    if (/bug|fix|security|vulnerability|audit|critical|urgent|race condition/i.test(cleanTitle)) {
      priority = 'high';
    } else if (/document|review|study|learn|clean up/i.test(cleanTitle)) {
      priority = 'low';
    }

    // Infer category
    let category = 'Development';
    if (/design|ui|ux|theme|frontend|style/i.test(cleanTitle)) category = 'Design';
    else if (/research|analyze|study|roadmap/i.test(cleanTitle)) category = 'Research';
    else if (/architecture|schema|database|system|concurrency/i.test(cleanTitle)) category = 'Architecture';

    suggestions.push({
      id: 'sug_' + Math.random().toString(36).substr(2, 7),
      title: cleanTitle,
      description: `Discovered from conversation "${convTitle}": ${rawText.slice(0, 120)}`,
      priority,
      category,
      sourceConvTitle: convTitle,
      matchedKeyword,
    });
  };

  // Scan conversations starting from most recent
  for (const conv of conversations) {
    for (const msg of conv.messages) {
      const content = msg.content;

      // 1. Action phrase pattern: "Need to implement...", "Should build...", "Todo: ..."
      const actionPhraseRegex =
        /(?:need to|should|must|todo:|task:|action item:|plan to|remember to|next step is to)\s+([^.!?\n]{8,90})/gi;
      let match: RegExpExecArray | null;

      while ((match = actionPhraseRegex.exec(content)) !== null) {
        const candidate = match[1].trim();
        const foundKw = projectKeywords.find((kw) =>
          candidate.toLowerCase().includes(kw)
        );
        if (foundKw) {
          addCandidate(candidate, conv.title, foundKw, match[0]);
        }
      }

      // 2. Actionable bullet points starting with verbs & containing project keywords
      const bulletRegex =
        /^[*-]\s*(?:[0-9]+\.\s*)?(?:Implement|Build|Fix|Create|Design|Refactor|Deploy|Test|Setup|Optimize|Configure|Audit|Review|Add|Verify)\s+([^.!?\n]{8,90})/gim;
      while ((match = bulletRegex.exec(content)) !== null) {
        const fullCandidate = match[0].replace(/^[*-]\s*(?:[0-9]+\.\s*)?/, '').trim();
        const foundKw = projectKeywords.find((kw) =>
          fullCandidate.toLowerCase().includes(kw)
        );
        if (foundKw) {
          addCandidate(fullCandidate, conv.title, foundKw, fullCandidate);
        }
      }

      // 3. Explicit keywords search in code and recommendations
      for (const kw of projectKeywords) {
        const keywordRegex = new RegExp(`(?:prepare|setup|implement|configure|design|debug)\\s+${kw}[^.!?\\n]{5,60}`, 'gi');
        let kwMatch: RegExpExecArray | null;
        while ((kwMatch = keywordRegex.exec(content)) !== null) {
          addCandidate(kwMatch[0], conv.title, kw, kwMatch[0]);
        }
      }
    }
  }

  // Fallback dynamic suggestion if conversations mention technical concepts
  if (suggestions.length === 0 && conversations.length > 0) {
    const hasCodeConv = conversations.some((c) =>
      c.messages.some((m) => m.content.toLowerCase().includes('concurrency') || m.content.toLowerCase().includes('api'))
    );
    if (hasCodeConv && !existingTitles.has('implement optimistic locking in api endpoints')) {
      suggestions.push({
        id: 'sug_default_1',
        title: 'Implement optimistic locking in API endpoints',
        description: 'Suggested from chat analysis on database concurrency and transaction safety.',
        priority: 'high',
        category: 'Architecture',
        sourceConvTitle: 'Coding & Architecture',
        matchedKeyword: 'concurrency',
      });
    }
  }

  return suggestions.slice(0, 3);
}

interface DashboardPageProps {
  onNavigate: (page: NavPage) => void;
  onStartPrompt: (promptText: string) => void;
  tasks: Task[];
  onToggleTask: (taskId: string) => void;
  onOpenNewTaskModal: () => void;
  onTasksUpdated?: (newTasks: Task[]) => void;
  onOpenShortcutsModal?: () => void;
  conversations: Conversation[];
  activities: ActivityLog[];
  usage: ServerUsage;
  activeModel: string;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onStartPrompt,
  tasks,
  onToggleTask,
  onOpenNewTaskModal,
  onTasksUpdated,
  onOpenShortcutsModal,
  conversations,
  activities,
  usage,
  activeModel,
}) => {
  const [quickInput, setQuickInput] = useState('');
  const [dismissedSuggestionIds, setDismissedSuggestionIds] = useState<string[]>([]);
  const [createdFeedbackId, setCreatedFeedbackId] = useState<string | null>(null);

  // Run the helper function to detect project task suggestions
  const detectedSuggestions = useMemo(() => {
    return detectProjectTaskSuggestions(conversations, tasks).filter(
      (s) => !dismissedSuggestionIds.includes(s.id)
    );
  }, [conversations, tasks, dismissedSuggestionIds]);

  const suggestedPrompts = [
    {
      title: 'Explain a difficult concept',
      prompt: 'Explain the difference between optimistic concurrency control and pessimistic locking with clear diagrams and use-cases.',
      category: 'Coding & Architecture',
    },
    {
      title: 'Analyze my uploaded document',
      prompt: 'I want to analyze a technical document or research paper. What are the key sections you look for when producing an executive summary?',
      category: 'Document Analysis',
    },
    {
      title: 'Help me plan a software project',
      prompt: 'Help me plan a scalable full-stack web application MVP. Break it down into phases: architecture, database schema, API design, and deployment.',
      category: 'Productivity & Planning',
    },
    {
      title: 'Debug this code',
      prompt: 'Why would an async JavaScript function inside a loop not execute sequentially? Provide an example bug and show how to fix it.',
      category: 'Debugging',
    },
    {
      title: 'Create a productivity plan',
      prompt: 'Create a 4-week structured learning roadmap to master system design fundamentals for junior/mid software engineers.',
      category: 'Study & Planning',
    },
  ];

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickInput.trim()) {
      onStartPrompt(quickInput.trim());
      setQuickInput('');
      onNavigate('chat');
    }
  };

  const handleCreateSuggestedTask = (suggestion: SuggestedTask) => {
    const newTask: Task = {
      id: 'task_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
      title: suggestion.title,
      description: suggestion.description,
      priority: suggestion.priority,
      category: suggestion.category,
      dueDate: 'Soon',
      completed: false,
      createdAt: new Date().toISOString(),
    };

    if (onTasksUpdated) {
      onTasksUpdated([newTask, ...tasks]);
    }

    storage.addActivity({
      type: 'task_created',
      title: `Created task: ${suggestion.title}`,
      detail: `Detected by AI chat analysis from "${suggestion.sourceConvTitle}".`,
    });

    setCreatedFeedbackId(suggestion.id);
    setTimeout(() => {
      setDismissedSuggestionIds((prev) => [...prev, suggestion.id]);
      setCreatedFeedbackId(null);
    }, 1200);
  };

  const handleDismissSuggestion = (id: string) => {
    setDismissedSuggestionIds((prev) => [...prev, id]);
  };

  const pendingTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-[#424242] bg-[#2F2F2F] p-6 sm:p-8">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium bg-[#10A37F]/15 text-[#10A37F] border border-[#10A37F]/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>NEXORA AI Workspace • v2.4</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Intelligent AI Workspace for Developers & Thinkers
          </h2>

          <p className="text-[#ACACAC] text-sm sm:text-base leading-relaxed">
            One primary AI agent with deterministic tool-routing. Analyze documents, organize tasks,
            explain and debug complex code, and brainstorm with complete data privacy and zero client-key exposure.
          </p>

          {/* Quick AI Prompt Input */}
          <form onSubmit={handleQuickSubmit} className="pt-2">
            <div className="relative flex items-center">
              <input
                type="text"
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                placeholder="Ask NEXORA anything or type 'Create a task to review PR'..."
                className="w-full bg-[#1F1F1F] text-white text-sm rounded-xl pl-4 pr-28 py-3.5 border border-[#424242] focus:border-[#10A37F] focus:outline-none placeholder-[#7E7E7E] shadow-inner transition-colors"
              />
              <button
                type="submit"
                disabled={!quickInput.trim()}
                className="absolute right-2 px-4 py-2 rounded-lg bg-[#10A37F] hover:bg-[#1A7F64] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <span>Ask AI</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* AI Task Suggestions Section (if project keywords detected during chat analysis) */}
      {detectedSuggestions.length > 0 && (
        <div className="rounded-xl border border-[#10A37F]/40 bg-[#252525] p-5 space-y-3.5 animate-in slide-in-from-top-2 duration-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-[#10A37F]" />
              <h3 className="text-sm font-semibold text-white">
                AI Detected Project Action Items
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#10A37F]/15 text-[#10A37F] border border-[#10A37F]/30 font-medium">
                {detectedSuggestions.length} suggested
              </span>
            </div>
            <span className="text-xs text-[#8E8E8E] hidden sm:inline">
              Extracted from recent chat analysis
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {detectedSuggestions.map((suggestion) => {
              const isCreated = createdFeedbackId === suggestion.id;
              return (
                <div
                  key={suggestion.id}
                  className="p-3.5 rounded-xl border border-[#3E3E3E] bg-[#2C2C2C] hover:border-[#10A37F]/60 transition-all flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono text-[#10A37F] px-1.5 py-0.5 rounded bg-[#10A37F]/10 border border-[#10A37F]/20">
                        {suggestion.category}
                      </span>
                      <button
                        onClick={() => handleDismissSuggestion(suggestion.id)}
                        className="text-[#7E7E7E] hover:text-white p-0.5"
                        title="Dismiss suggestion"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h4 className="text-xs font-semibold text-white group-hover:text-[#10A37F] transition-colors leading-snug">
                      {suggestion.title}
                    </h4>

                    <p className="text-[11px] text-[#8E8E8E] line-clamp-2 leading-relaxed">
                      {suggestion.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#383838]">
                    <span className="text-[10px] text-[#7E7E7E] truncate max-w-[120px]">
                      via {suggestion.sourceConvTitle}
                    </span>

                    {/* Small 'Create Task' action button */}
                    <button
                      onClick={() => handleCreateSuggestedTask(suggestion)}
                      disabled={isCreated}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer ${
                        isCreated
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#10A37F] hover:bg-[#1A7F64] text-white'
                      }`}
                      title="Add to Workspace Tasks"
                    >
                      {isCreated ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Added!</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Create Task</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Suggested Prompts Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#ACACAC]">
            Suggested Inquiries
          </h3>
          <span className="text-xs text-[#7E7E7E]">Click to load prompt into chat</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {suggestedPrompts.map((item, idx) => (
            <div
              key={idx}
              onClick={() => {
                onStartPrompt(item.prompt);
                onNavigate('chat');
              }}
              className="p-4 rounded-xl border border-[#424242] bg-[#2A2A2A] hover:bg-[#333333] hover:border-[#10A37F]/60 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-[#10A37F] uppercase tracking-wide">
                  {item.category}
                </span>
                <h4 className="text-sm font-semibold text-white group-hover:text-[#10A37F] transition-colors">
                  {item.title}
                </h4>
                <p className="text-xs text-[#ACACAC] line-clamp-2 leading-relaxed">
                  {item.prompt}
                </p>
              </div>
              <div className="mt-3 flex items-center justify-end text-[#7E7E7E] group-hover:text-[#10A37F] transition-colors">
                <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick-Access Tool Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#ACACAC]">
          Integrated Workspace Modules
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div
            onClick={() => onNavigate('chat')}
            className="p-4 rounded-xl border border-[#424242] bg-[#2F2F2F] hover:bg-[#353535] transition-all cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-lg bg-[#10A37F]/15 flex items-center justify-center text-[#10A37F] mb-3 group-hover:scale-105 transition-transform">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-white mb-1">AI Chat Agent</h4>
            <p className="text-xs text-[#ACACAC] leading-relaxed">
              Natural conversation with bounded context and deterministic tool-routing.
            </p>
          </div>

          <div
            onClick={() => onNavigate('documents')}
            className="p-4 rounded-xl border border-[#424242] bg-[#2F2F2F] hover:bg-[#353535] transition-all cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-lg bg-[#10A37F]/15 flex items-center justify-center text-[#10A37F] mb-3 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-white mb-1">Document Assistant</h4>
            <p className="text-xs text-[#ACACAC] leading-relaxed">
              Upload PDF and TXT files for summaries, action items, and Q&A.
            </p>
          </div>

          <div
            onClick={() => onNavigate('code')}
            className="p-4 rounded-xl border border-[#424242] bg-[#2F2F2F] hover:bg-[#353535] transition-all cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-lg bg-[#10A37F]/15 flex items-center justify-center text-[#10A37F] mb-3 group-hover:scale-105 transition-transform">
              <Code className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-white mb-1">Coding Assistant</h4>
            <p className="text-xs text-[#ACACAC] leading-relaxed">
              Explain, debug, refactor, and generate clean production code.
            </p>
          </div>

          <div
            onClick={() => onNavigate('tasks')}
            className="p-4 rounded-xl border border-[#424242] bg-[#2F2F2F] hover:bg-[#353535] transition-all cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-lg bg-[#10A37F]/15 flex items-center justify-center text-[#10A37F] mb-3 group-hover:scale-105 transition-transform">
              <CheckSquare className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-white mb-1">Task Planner</h4>
            <p className="text-xs text-[#ACACAC] leading-relaxed">
              Organize priorities, deadlines, and bidirectional AI task updates.
            </p>
          </div>
        </div>
      </div>

      {/* Two-Column Lower Section: Task Overview & Recent Real Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Overview */}
        <div className="rounded-xl border border-[#424242] bg-[#2F2F2F] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-[#10A37F]" />
              <h3 className="text-sm font-semibold text-white">Task Overview</h3>
              <span className="text-xs px-2 py-0.5 rounded bg-[#1F1F1F] text-[#ACACAC] border border-[#3D3D3D]">
                {pendingTasks.length} pending
              </span>
            </div>

            <button
              onClick={onOpenNewTaskModal}
              className="flex items-center gap-1 text-xs text-[#10A37F] hover:underline font-medium cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>
          </div>

          {tasks.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#8E8E8E] border border-dashed border-[#3D3D3D] rounded-lg">
              No tasks yet. Create one or ask NEXORA AI in Chat!
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {tasks.slice(0, 5).map((t) => (
                <div
                  key={t.id}
                  onClick={() => onToggleTask(t.id)}
                  className="flex items-start gap-3 p-2.5 rounded-lg bg-[#242424] hover:bg-[#2A2A2A] border border-[#383838] cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={t.completed}
                    onChange={() => onToggleTask(t.id)}
                    className="mt-0.5 rounded text-[#10A37F] focus:ring-0 cursor-pointer accent-[#10A37F]"
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs font-medium truncate ${
                        t.completed ? 'line-through text-[#7E7E7E]' : 'text-white'
                      }`}
                    >
                      {t.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-[#8E8E8E]">
                      <span
                        className={`capitalize px-1.5 py-0.2 rounded text-[10px] ${
                          t.priority === 'high'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                            : t.priority === 'medium'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {t.priority}
                      </span>
                      {t.dueDate && <span>Due: {t.dueDate}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 border-t border-[#383838] flex justify-between items-center text-xs">
            <span className="text-[#8E8E8E]">
              {completedTasks.length} of {tasks.length} tasks completed
            </span>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-[#10A37F] hover:underline flex items-center gap-1 font-medium cursor-pointer"
            >
              <span>View all tasks</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Real Activity & Usage Quota */}
        <div className="rounded-xl border border-[#424242] bg-[#2F2F2F] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#10A37F]" />
              <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
            </div>
            <span className="text-[11px] text-[#8E8E8E]">Real workspace events</span>
          </div>

          <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
            {activities.length === 0 ? (
              <p className="text-xs text-[#8E8E8E] text-center py-6">No recent events logged.</p>
            ) : (
              activities.slice(0, 5).map((act) => (
                <div key={act.id} className="flex items-start gap-2.5 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#10A37F] mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{act.title}</p>
                    {act.detail && <p className="text-[#8E8E8E] text-[11px] truncate">{act.detail}</p>}
                  </div>
                  <span className="text-[10px] text-[#707070] shrink-0">
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Usage Snapshot */}
          <div className="pt-3 border-t border-[#383838] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#ACACAC] flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#10A37F]" />
                Demo Quota Remaining:
              </span>
              <span className="text-white font-semibold font-mono">
                {Math.max(0, usage.demoLimit - usage.totalRequests)} / {usage.demoLimit}
              </span>
            </div>
            <div className="w-full bg-[#242424] h-2 rounded-full overflow-hidden border border-[#383838]">
              <div
                className="bg-[#10A37F] h-full rounded-full transition-all"
                style={{
                  width: `${Math.max(
                    5,
                    ((usage.demoLimit - usage.totalRequests) / usage.demoLimit) * 100
                  )}%`,
                }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-[#8E8E8E]">
              <span>Model: {activeModel}</span>
              <button
                onClick={() => onNavigate('settings')}
                className="text-[#10A37F] hover:underline cursor-pointer"
              >
                Quota details
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Visible Keyboard Shortcuts Footer Reminder */}
      <div className="rounded-xl border border-[#3A3A3A] bg-[#262626] p-4 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-2 text-white font-medium">
          <Keyboard className="w-4 h-4 text-[#10A37F]" />
          <span>Quick Keyboard Shortcuts:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 text-[#ACACAC]">
          <div className="flex items-center gap-1.5">
            <kbd className="px-2 py-0.5 rounded bg-[#1C1C1C] text-white font-mono text-[11px] border border-[#3E3E3E] shadow-xs">
              Ctrl + K
            </kbd>
            <span className="text-[11px]">Command Search</span>
          </div>

          <div className="flex items-center gap-1.5">
            <kbd className="px-2 py-0.5 rounded bg-[#1C1C1C] text-white font-mono text-[11px] border border-[#3E3E3E] shadow-xs">
              Ctrl + N
            </kbd>
            <span className="text-[11px]">New Chat</span>
          </div>

          <div className="flex items-center gap-1.5">
            <kbd className="px-2 py-0.5 rounded bg-[#1C1C1C] text-white font-mono text-[11px] border border-[#3E3E3E] shadow-xs">
              Ctrl + B
            </kbd>
            <span className="text-[11px]">Toggle Sidebar</span>
          </div>

          <div className="flex items-center gap-1.5">
            <kbd className="px-2 py-0.5 rounded bg-[#1C1C1C] text-white font-mono text-[11px] border border-[#3E3E3E] shadow-xs">
              Ctrl + 1..8
            </kbd>
            <span className="text-[11px]">Direct Nav</span>
          </div>
        </div>

        {onOpenShortcutsModal && (
          <button
            onClick={onOpenShortcutsModal}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#10A37F] hover:underline cursor-pointer"
          >
            <span>All Shortcuts (?)</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Floating 'Help' / Shortcuts Button */}
      {onOpenShortcutsModal && (
        <button
          onClick={onOpenShortcutsModal}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-[#1A1A1A] hover:bg-[#282828] border border-[#424242] hover:border-[#10A37F] text-white shadow-2xl hover:shadow-[0_8px_25px_rgba(16,163,127,0.2)] transition-all duration-200 cursor-pointer group"
          title="Keyboard Shortcuts & Help (? or Ctrl+/)"
        >
          <Keyboard className="w-4 h-4 text-[#10A37F] group-hover:scale-110 transition-transform" />
          <span className="text-xs font-medium">Help</span>
          <kbd className="px-1.5 py-0.2 rounded font-mono text-[10px] bg-[#2E2E2E] text-[#ACACAC] border border-[#3E3E3E]">
            ?
          </kbd>
        </button>
      )}
    </div>
  );
};
