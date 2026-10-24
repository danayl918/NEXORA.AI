import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Square,
  Copy,
  Check,
  RefreshCw,
  Paperclip,
  X,
  Sparkles,
  CheckCircle2,
  ListTodo,
  FileText,
  AlertTriangle,
  ArrowRight,
  Bot,
  User,
} from 'lucide-react';
import { ChatMessage, Conversation, Task, DocumentItem } from '../types';
import { MarkdownRenderer } from '../utils/markdown';
import { NavPage } from '../components/Sidebar';

interface ChatPageProps {
  conversation: Conversation;
  onUpdateConversation: (updatedConv: Conversation) => void;
  tasks: Task[];
  onTasksUpdated: (newTasks: Task[]) => void;
  onNavigate: (page: NavPage) => void;
  activeModel: string;
}

export const ChatPage: React.FC<ChatPageProps> = ({
  conversation,
  onUpdateConversation,
  tasks,
  onTasksUpdated,
  onNavigate,
  activeModel,
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attachedDoc, setAttachedDoc] = useState<{
    name: string;
    mimeType: string;
    size: number;
    text?: string;
    base64?: string;
  } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation.messages, isLoading]);

  // Adjust textarea height automatically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 8MB)
    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage('File size exceeds 8MB limit. Please attach a smaller file.');
      return;
    }

    const reader = new FileReader();

    if (file.type === 'application/pdf') {
      reader.onload = () => {
        const resultStr = reader.result as string;
        // base64 part
        const base64 = resultStr.split(',')[1];
        setAttachedDoc({
          name: file.name,
          mimeType: 'application/pdf',
          size: file.size,
          base64,
        });
        setErrorMessage(null);
      };
      reader.readAsDataURL(file);
    } else {
      // Text formats (.txt, .md, .json, .csv, code files)
      reader.onload = () => {
        const text = reader.result as string;
        setAttachedDoc({
          name: file.name,
          mimeType: file.type || 'text/plain',
          size: file.size,
          text,
        });
        setErrorMessage(null);
      };
      reader.readAsText(file);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend || input).trim();
    if (!messageContent && !attachedDoc) return;
    if (isLoading) return;

    setErrorMessage(null);

    const userMessage: ChatMessage = {
      id: 'msg_' + Date.now().toString(36),
      role: 'user',
      content: messageContent,
      timestamp: new Date().toISOString(),
      attachedDocument: attachedDoc
        ? {
            name: attachedDoc.name,
            mimeType: attachedDoc.mimeType,
            size: attachedDoc.size,
          }
        : undefined,
    };

    const updatedMessages = [...conversation.messages, userMessage];
    const updatedConversation: Conversation = {
      ...conversation,
      messages: updatedMessages,
      title:
        conversation.messages.length <= 1
          ? messageContent.slice(0, 36) || 'New Conversation'
          : conversation.title,
      updatedAt: new Date().toISOString(),
    };

    onUpdateConversation(updatedConversation);
    setInput('');
    const currentAttachment = attachedDoc;
    setAttachedDoc(null);
    setIsLoading(true);

    // Setup abort controller for stopping generation
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortController.signal,
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          currentTasks: tasks,
          attachedDocument: currentAttachment,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with HTTP ${response.status}`);
      }

      const data = await response.json();

      // Process actions taken by tools
      if (data.actionsTaken && Array.isArray(data.actionsTaken)) {
        let updatedTaskList = [...tasks];
        for (const action of data.actionsTaken) {
          if (action.type === 'TASK_CREATED' && action.task) {
            updatedTaskList = [action.task, ...updatedTaskList];
          } else if (action.type === 'TASK_COMPLETED' && action.taskId) {
            updatedTaskList = updatedTaskList.map((t) =>
              t.id === action.taskId ? { ...t, completed: true } : t
            );
          }
        }
        onTasksUpdated(updatedTaskList);
      }

      const botMessage: ChatMessage = {
        id: 'msg_' + Date.now().toString(36) + 'b',
        role: 'model',
        content: data.text,
        timestamp: new Date().toISOString(),
        toolCall: data.toolCall,
        actionsTaken: data.actionsTaken,
      };

      onUpdateConversation({
        ...updatedConversation,
        messages: [...updatedMessages, botMessage],
        updatedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User stopped generation
        const abortMessage: ChatMessage = {
          id: 'msg_abort_' + Date.now().toString(36),
          role: 'model',
          content: '*(Response generation was stopped by user)*',
          timestamp: new Date().toISOString(),
        };
        onUpdateConversation({
          ...updatedConversation,
          messages: [...updatedMessages, abortMessage],
          updatedAt: new Date().toISOString(),
        });
      } else {
        console.error('Chat error:', err);
        setErrorMessage(err.message || 'Failed to communicate with AI agent.');
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleRetry = (msgIndex: number) => {
    // Find preceding user message
    const targetUserMsg = conversation.messages[msgIndex - 1];
    if (targetUserMsg && targetUserMsg.role === 'user') {
      // Remove this response and re-send
      const pruned = conversation.messages.slice(0, msgIndex);
      onUpdateConversation({
        ...conversation,
        messages: pruned,
      });
      handleSendMessage(targetUserMsg.content);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-[#212121] text-white">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {conversation.messages.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#10A37F]/15 border border-[#10A37F]/30 text-[#10A37F] flex items-center justify-center mx-auto shadow-sm">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white">How can NEXORA AI help you today?</h2>
              <p className="text-sm text-[#ACACAC] max-w-md mx-auto">
                Ask a technical question, attach a document for analysis, or ask me to organize your project tasks.
              </p>
            </div>
          ) : (
            conversation.messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-lg bg-[#10A37F] flex items-center justify-center text-white shrink-0 mt-0.5 shadow-sm">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`space-y-2 max-w-[88%] sm:max-w-[80%]`}>
                    {/* Attached file badge in user message */}
                    {msg.attachedDocument && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-[#2F2F2F] border border-[#424242] text-xs text-[#ACACAC] w-fit">
                        <FileText className="w-4 h-4 text-[#10A37F]" />
                        <span className="font-medium text-white truncate max-w-xs">
                          {msg.attachedDocument.name}
                        </span>
                        <span className="text-[10px] text-[#7E7E7E]">
                          ({Math.round(msg.attachedDocument.size / 1024)} KB)
                        </span>
                      </div>
                    )}

                    {/* Tool Action Card */}
                    {msg.toolCall && (
                      <div className="p-3 rounded-lg border border-[#424242] bg-[#292929] text-xs space-y-1.5 shadow-sm">
                        <div className="flex items-center justify-between text-[#10A37F] font-semibold">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Tool Executed: {msg.toolCall.name}
                          </span>
                          <span className="text-[10px] font-mono text-[#8E8E8E]">Deterministic</span>
                        </div>
                        {msg.toolCall.name === 'createTask' && (
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[#ACACAC]">
                              Created Task: <strong className="text-white">{msg.toolCall.args.title}</strong>
                            </span>
                            <button
                              onClick={() => onNavigate('tasks')}
                              className="text-[11px] text-[#10A37F] hover:underline flex items-center gap-1 font-medium cursor-pointer"
                            >
                              <span>View Task Planner</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        {msg.toolCall.name === 'listTasks' && (
                          <div className="text-[#ACACAC]">
                            Workspace tasks retrieved and reviewed.
                          </div>
                        )}
                        {msg.toolCall.name === 'completeTask' && (
                          <div className="text-[#ACACAC]">
                            Marked task completed in workspace.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div
                      className={`p-4 rounded-2xl ${
                        isUser
                          ? 'bg-[#2F2F2F] text-white rounded-tr-xs border border-[#424242]'
                          : 'bg-[#282828] text-white rounded-tl-xs border border-[#3A3A3A] shadow-sm'
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
                          {msg.content}
                        </p>
                      ) : (
                        <MarkdownRenderer content={msg.content} />
                      )}
                    </div>

                    {/* Message Controls (for model responses) */}
                    {!isUser && (
                      <div className="flex items-center gap-2 text-xs text-[#8E8E8E] pl-1">
                        <button
                          onClick={() => handleCopyMessage(msg.id, msg.content)}
                          className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                          title="Copy response"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-[#10A37F]" />
                              <span className="text-[#10A37F]">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleRetry(index)}
                          className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                          title="Retry response"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Retry</span>
                        </button>

                        <span className="text-[10px] text-[#6E6E6E] ml-auto">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-7 h-7 rounded-lg bg-[#3A3A3A] border border-[#4A4A4A] flex items-center justify-center text-white shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Typing / Loading indicator */}
          {isLoading && (
            <div className="flex gap-3.5 items-start">
              <div className="w-7 h-7 rounded-lg bg-[#10A37F] flex items-center justify-center text-white shrink-0 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3.5 rounded-2xl bg-[#282828] border border-[#3A3A3A] flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#10A37F] animate-bounce" />
                <div
                  className="w-2 h-2 rounded-full bg-[#10A37F] animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                />
                <div
                  className="w-2 h-2 rounded-full bg-[#10A37F] animate-bounce"
                  style={{ animationDelay: '0.4s' }}
                />
                <span className="text-xs text-[#ACACAC] ml-1.5 font-medium">
                  NEXORA is evaluating response & tools...
                </span>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-300">Request Error</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-red-400 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area (ChatGPT Style Centered Container) */}
      <div className="p-4 bg-[#212121] border-t border-[#303030]">
        <div className="max-w-3xl mx-auto space-y-2">
          {/* File Attachment Pill Preview */}
          {attachedDoc && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#2F2F2F] border border-[#10A37F] text-xs text-white shadow-sm">
              <FileText className="w-3.5 h-3.5 text-[#10A37F]" />
              <span className="font-medium truncate max-w-xs">{attachedDoc.name}</span>
              <span className="text-[#8E8E8E] text-[10px]">
                ({Math.round(attachedDoc.size / 1024)} KB)
              </span>
              <button
                onClick={() => setAttachedDoc(null)}
                className="text-[#ACACAC] hover:text-red-400 ml-1 p-0.5"
                title="Remove attachment"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Rounded Input Box */}
          <div className="relative flex items-end rounded-2xl bg-[#303030] border border-[#424242] focus-within:border-[#10A37F] shadow-md transition-colors">
            {/* Attachment Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".txt,.pdf,.md,.json,.csv,.js,.ts,.py,.html,.css"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-[#ACACAC] hover:text-white transition-colors cursor-pointer shrink-0"
              title="Attach TXT, PDF, MD, or Code file"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Message NEXORA AI (e.g. 'Create a task to build auth' or ask any question)..."
              rows={1}
              className="w-full max-h-40 py-3 bg-transparent text-white text-sm placeholder-[#7E7E7E] resize-none focus:outline-none leading-relaxed"
            />

            {/* Action Buttons: Stop or Send */}
            <div className="p-2 shrink-0">
              {isLoading ? (
                <button
                  onClick={handleStop}
                  className="w-8 h-8 rounded-lg bg-[#3A3A3A] hover:bg-[#4A4A4A] text-white flex items-center justify-center transition-all cursor-pointer"
                  title="Stop generating"
                >
                  <Square className="w-4 h-4 fill-white" />
                </button>
              ) : (
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!input.trim() && !attachedDoc}
                  className="w-8 h-8 rounded-lg bg-[#10A37F] hover:bg-[#1A7F64] disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all shadow-sm cursor-pointer"
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#7E7E7E] px-2">
            <span>Press Shift+Enter for new line</span>
            <span>NEXORA AI agent with Gemini {activeModel}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
