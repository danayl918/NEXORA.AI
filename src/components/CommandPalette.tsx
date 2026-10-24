import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  MessageSquare,
  Plus,
  CheckSquare,
  FileText,
  Code,
  LayoutDashboard,
  History,
  Settings,
  Info,
  Sun,
  Moon,
  ArrowRight,
  Sparkles,
  X,
  Keyboard,
} from 'lucide-react';
import { NavPage } from './Sidebar';
import { Conversation, Task } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: NavPage) => void;
  onNewChat: () => void;
  onOpenNewTaskModal?: () => void;
  onToggleTheme: () => void;
  theme: 'dark' | 'light';
  conversations: Conversation[];
  tasks: Task[];
  onSelectConversation: (id: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onNewChat,
  onOpenNewTaskModal,
  onToggleTheme,
  theme,
  conversations,
  tasks,
  onSelectConversation,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Base navigation and action items
  const baseActions = [
    {
      id: 'new-chat',
      title: 'New Conversation',
      subtitle: 'Start a fresh session with the AI Agent',
      icon: Plus,
      category: 'Actions',
      shortcut: 'Ctrl+N',
      run: () => {
        onNewChat();
        onNavigate('chat');
        onClose();
      },
    },
    {
      id: 'nav-dashboard',
      title: 'Go to Dashboard',
      subtitle: 'Overview of AI tools, tasks, and usage',
      icon: LayoutDashboard,
      category: 'Navigation',
      shortcut: 'Ctrl+1',
      run: () => {
        onNavigate('dashboard');
        onClose();
      },
    },
    {
      id: 'nav-chat',
      title: 'Go to AI Chat',
      subtitle: 'Primary conversational agent with tool-calling',
      icon: MessageSquare,
      category: 'Navigation',
      shortcut: 'Ctrl+2',
      run: () => {
        onNavigate('chat');
        onClose();
      },
    },
    {
      id: 'nav-documents',
      title: 'Go to Document Assistant',
      subtitle: 'Analyze, summarize, and query PDF & TXT files',
      icon: FileText,
      category: 'Navigation',
      shortcut: 'Ctrl+3',
      run: () => {
        onNavigate('documents');
        onClose();
      },
    },
    {
      id: 'nav-code',
      title: 'Go to Coding Assistant',
      subtitle: 'Explain, debug, refactor, and generate code',
      icon: Code,
      category: 'Navigation',
      shortcut: 'Ctrl+4',
      run: () => {
        onNavigate('code');
        onClose();
      },
    },
    {
      id: 'nav-tasks',
      title: 'Go to Task Planner',
      subtitle: 'Deterministic task management integrated with AI',
      icon: CheckSquare,
      category: 'Navigation',
      shortcut: 'Ctrl+5',
      run: () => {
        onNavigate('tasks');
        onClose();
      },
    },
    {
      id: 'nav-history',
      title: 'Go to Conversation Archive',
      subtitle: 'Search and export previous chats',
      icon: History,
      category: 'Navigation',
      shortcut: 'Ctrl+6',
      run: () => {
        onNavigate('history');
        onClose();
      },
    },
    {
      id: 'nav-settings',
      title: 'Go to Settings & Quota',
      subtitle: 'Cost controls, model options, and local privacy',
      icon: Settings,
      category: 'Navigation',
      shortcut: 'Ctrl+7',
      run: () => {
        onNavigate('settings');
        onClose();
      },
    },
    {
      id: 'nav-about',
      title: 'About NEXORA AI',
      subtitle: 'Architecture, engineering specs, and portfolio notes',
      icon: Info,
      category: 'Navigation',
      shortcut: 'Ctrl+8',
      run: () => {
        onNavigate('about');
        onClose();
      },
    },
    {
      id: 'toggle-theme',
      title: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`,
      subtitle: 'Toggle interface appearance mode',
      icon: theme === 'dark' ? Sun : Moon,
      category: 'Preferences',
      shortcut: 'Ctrl+Shift+L',
      run: () => {
        onToggleTheme();
        onClose();
      },
    },
  ];

  // Dynamic conversation search results
  const convResults = conversations
    .filter(
      (c) =>
        query.trim().length > 0 &&
        (c.title.toLowerCase().includes(query.toLowerCase()) ||
          c.messages.some((m) => m.content.toLowerCase().includes(query.toLowerCase())))
    )
    .slice(0, 4)
    .map((c) => ({
      id: `conv-${c.id}`,
      title: c.title,
      subtitle: `${c.messages.length} messages • ${new Date(c.updatedAt).toLocaleDateString()}`,
      icon: MessageSquare,
      category: 'Chats',
      shortcut: '',
      run: () => {
        onSelectConversation(c.id);
        onNavigate('chat');
        onClose();
      },
    }));

  // Dynamic task search results
  const taskResults = tasks
    .filter(
      (t) =>
        query.trim().length > 0 &&
        (t.title.toLowerCase().includes(query.toLowerCase()) ||
          t.description?.toLowerCase().includes(query.toLowerCase()))
    )
    .slice(0, 4)
    .map((t) => ({
      id: `task-${t.id}`,
      title: t.title,
      subtitle: `Task: ${t.priority.toUpperCase()} priority • ${t.completed ? 'Completed' : 'Pending'}`,
      icon: CheckSquare,
      category: 'Tasks',
      shortcut: '',
      run: () => {
        onNavigate('tasks');
        onClose();
      },
    }));

  // Filter base actions if query exists
  const filteredBase = baseActions.filter(
    (a) =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.subtitle.toLowerCase().includes(query.toLowerCase()) ||
      a.category.toLowerCase().includes(query.toLowerCase())
  );

  const allItems = [...convResults, ...taskResults, ...filteredBase];

  // Handle keyboard navigation inside the modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (allItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + (allItems.length || 1)) % (allItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allItems[selectedIndex]) {
        allItems[selectedIndex].run();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-[#424242] bg-[#242424] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#383838] bg-[#2A2A2A]">
          <Search className="w-5 h-5 text-[#10A37F] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, page name, task, or search chats..."
            className="w-full bg-transparent text-sm text-white placeholder-[#7E7E7E] focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-[#1E1E1E] text-[#ACACAC] border border-[#3E3E3E]">
            ESC
          </kbd>
          <button onClick={onClose} className="text-[#8E8E8E] hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
          {allItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#8E8E8E] space-y-1">
              <Search className="w-6 h-6 mx-auto text-[#666]" />
              <p className="text-white font-medium">No results found</p>
              <p>Try searching for "chat", "task", "code", or "settings"</p>
            </div>
          ) : (
            allItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => item.run()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#10A37F] text-white shadow-sm'
                      : 'text-[#CCCCCC] hover:bg-[#2F2F2F]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-black/20 text-white'
                          : 'bg-[#303030] text-[#10A37F] border border-[#404040]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <p className={`text-xs font-semibold truncate ${isSelected ? 'text-white' : 'text-white'}`}>
                        {item.title}
                      </p>
                      <p
                        className={`text-[11px] truncate ${
                          isSelected ? 'text-white/80' : 'text-[#8E8E8E]'
                        }`}
                      >
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  {item.shortcut ? (
                    <kbd
                      className={`shrink-0 text-[10px] font-mono px-2 py-0.5 rounded border ${
                        isSelected
                          ? 'bg-black/25 text-white border-white/20'
                          : 'bg-[#1E1E1E] text-[#8E8E8E] border-[#383838]'
                      }`}
                    >
                      {item.shortcut}
                    </kbd>
                  ) : (
                    <span
                      className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded ${
                        isSelected ? 'text-white/70' : 'text-[#707070]'
                      }`}
                    >
                      {item.category}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-4 py-2.5 bg-[#1C1C1C] border-t border-[#303030] flex flex-wrap items-center justify-between text-[11px] text-[#7E7E7E]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.2 rounded bg-[#2A2A2A] text-white font-mono text-[10px] border border-[#3E3E3E]">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.2 rounded bg-[#2A2A2A] text-white font-mono text-[10px] border border-[#3E3E3E]">
                ↓
              </kbd>
              <span className="ml-1">Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.2 rounded bg-[#2A2A2A] text-white font-mono text-[10px] border border-[#3E3E3E]">
                ↵
              </kbd>
              <span className="ml-1">Select</span>
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span>Global Shortcuts:</span>
            <kbd className="px-1.5 py-0.2 rounded bg-[#2A2A2A] text-[#10A37F] font-mono text-[10px] border border-[#3E3E3E]">
              Ctrl+K
            </kbd>
            <kbd className="px-1.5 py-0.2 rounded bg-[#2A2A2A] text-[#10A37F] font-mono text-[10px] border border-[#3E3E3E]">
              Ctrl+N
            </kbd>
          </div>
        </div>
      </div>
    </div>
  );
};
