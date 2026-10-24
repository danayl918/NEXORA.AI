import React from 'react';
import { Menu, Sparkles, Sun, Moon, ShieldCheck, CheckSquare, Search, Keyboard } from 'lucide-react';
import { NavPage } from './Sidebar';

interface HeaderProps {
  currentPage: NavPage;
  onOpenMobileSidebar: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onQuickNewTask?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenShortcutsHelp?: () => void;
  activeModelName?: string;
  hasApiKey?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onOpenMobileSidebar,
  theme,
  onToggleTheme,
  onQuickNewTask,
  onOpenCommandPalette,
  onOpenShortcutsHelp,
  activeModelName = 'gemini-3.1-flash-lite',
  hasApiKey = true,
}) => {
  const pageTitles: Record<NavPage, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Workspace Dashboard',
      subtitle: 'Overview of AI tools, tasks, and recent activity',
    },
    chat: {
      title: 'NEXORA Primary Agent',
      subtitle: 'Conversational assistant with tool calling',
    },
    documents: {
      title: 'Document Assistant',
      subtitle: 'Analyze, summarize, and query TXT & PDF files',
    },
    code: {
      title: 'Coding Assistant',
      subtitle: 'Explain, debug, refactor, and generate code',
    },
    tasks: {
      title: 'Task Planner',
      subtitle: 'Deterministic task management integrated with AI',
    },
    history: {
      title: 'Conversation Archive',
      subtitle: 'Search and manage previous sessions',
    },
    settings: {
      title: 'Settings & Quota',
      subtitle: 'Usage tracking, model options, and local privacy',
    },
    about: {
      title: 'About NEXORA AI',
      subtitle: 'Architecture, engineering specs, and portfolio notes',
    },
  };

  const currentInfo = pageTitles[currentPage] || { title: 'Workspace', subtitle: '' };

  return (
    <header className="h-14 border-b border-[#383838] bg-[#1E1E1E]/90 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-30 select-none">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="md:hidden p-1.5 rounded-lg text-[#ACACAC] hover:text-white hover:bg-[#2F2F2F] transition-colors"
          title="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold text-white tracking-tight">
              {currentInfo.title}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#10A37F]/15 text-[#10A37F] border border-[#10A37F]/30">
              <Sparkles className="w-2.5 h-2.5" />
              {activeModelName}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Quick Search & Command Palette Button with Ctrl+K badge */}
        {onOpenCommandPalette && (
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-[#2F2F2F] hover:bg-[#383838] border border-[#424242] text-[#ACACAC] hover:text-white rounded-lg transition-all cursor-pointer shadow-xs"
            title="Search & Commands (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-[#10A37F]" />
            <span className="hidden sm:inline">Search commands...</span>
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.2 rounded font-mono text-[10px] bg-[#222222] text-[#8E8E8E] border border-[#3A3A3A]">
              Ctrl+K
            </kbd>
          </button>
        )}

        {onQuickNewTask && (
          <button
            onClick={onQuickNewTask}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-[#2F2F2F] hover:bg-[#383838] border border-[#424242] text-white rounded-lg transition-colors cursor-pointer"
            title="Create Task"
          >
            <CheckSquare className="w-3.5 h-3.5 text-[#10A37F]" />
            <span>+ Task</span>
          </button>
        )}

        {/* Keyboard Shortcuts Help Button */}
        {onOpenShortcutsHelp && (
          <button
            onClick={onOpenShortcutsHelp}
            className="p-1.5 rounded-lg text-[#ACACAC] hover:text-white hover:bg-[#2F2F2F] transition-colors cursor-pointer"
            title="Keyboard Shortcuts (? or Ctrl+/)"
          >
            <Keyboard className="w-4 h-4" />
          </button>
        )}

        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#262626] border border-[#383838] text-[11px] text-[#ACACAC]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#10A37F]" />
          <span>Server Proxy</span>
        </div>

        <button
          onClick={onToggleTheme}
          className="p-1.5 rounded-lg text-[#ACACAC] hover:text-white hover:bg-[#2F2F2F] transition-colors cursor-pointer"
          title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
