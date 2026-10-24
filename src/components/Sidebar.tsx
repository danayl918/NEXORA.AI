import React, { useState } from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  Code,
  CheckSquare,
  History,
  Settings,
  Info,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { Conversation } from '../types';

export type NavPage =
  | 'dashboard'
  | 'chat'
  | 'documents'
  | 'code'
  | 'tasks'
  | 'history'
  | 'settings'
  | 'about';

interface SidebarProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
  conversations: Conversation[];
  activeConvId: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string, e: React.MouseEvent) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  remainingRequests?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  conversations,
  activeConvId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  isMobileOpen,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
  remainingRequests = 100,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const navItems = [
    { id: 'dashboard' as NavPage, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'chat' as NavPage, label: 'AI Chat', icon: MessageSquare },
    { id: 'documents' as NavPage, label: 'Documents', icon: FileText },
    { id: 'code' as NavPage, label: 'Coding Assistant', icon: Code },
    { id: 'tasks' as NavPage, label: 'Task Planner', icon: CheckSquare },
    { id: 'history' as NavPage, label: 'History', icon: History },
    { id: 'settings' as NavPage, label: 'Settings', icon: Settings },
    { id: 'about' as NavPage, label: 'About NEXORA', icon: Info },
  ];

  const handleStartRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const content = (
    <div className="flex flex-col h-full bg-[#171717] text-white border-r border-[#424242]/60 select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-3.5 py-4 border-b border-[#303030]">
        {!isCollapsed && (
          <div
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-[#10A37F] flex items-center justify-center font-bold text-white text-base tracking-wider shadow-sm group-hover:bg-[#1A7F64] transition-colors">
              N
            </div>
            <div>
              <span className="font-bold tracking-tight text-white text-base">NEXORA</span>
              <span className="text-[11px] font-semibold text-[#10A37F] ml-1 px-1.5 py-0.5 rounded bg-[#10A37F]/10 border border-[#10A37F]/30">
                AI
              </span>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div
            onClick={() => onNavigate('dashboard')}
            className="w-8 h-8 mx-auto rounded-lg bg-[#10A37F] flex items-center justify-center font-bold text-white text-base cursor-pointer"
            title="NEXORA AI"
          >
            N
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="hidden md:flex p-1.5 rounded-md text-[#ACACAC] hover:text-white hover:bg-[#2F2F2F] transition-colors cursor-pointer"
          title={isCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <button
          onClick={() => {
            onNewChat();
            onNavigate('chat');
            onCloseMobile();
          }}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-[#424242] bg-[#2F2F2F] hover:bg-[#383838] hover:border-[#10A37F] text-white text-sm font-medium transition-all shadow-sm cursor-pointer ${
            isCollapsed ? 'px-0 justify-center' : ''
          }`}
          title="New Chat (Ctrl+N)"
        >
          <div className="flex items-center gap-2.5">
            <Plus className="w-4 h-4 text-[#10A37F]" />
            {!isCollapsed && <span>New Chat</span>}
          </div>
          {!isCollapsed && (
            <kbd className="px-1.5 py-0.2 rounded font-mono text-[10px] bg-[#222222] text-[#8E8E8E] border border-[#3A3A3A]">
              Ctrl+N
            </kbd>
          )}
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-2 space-y-4">
        {/* Main Tools Nav */}
        <div className="space-y-0.5">
          {!isCollapsed && (
            <p className="px-2.5 py-1 text-[11px] font-semibold text-[#8E8E8E] uppercase tracking-wider">
              Workspace
            </p>
          )}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#2F2F2F] text-white font-medium border-l-2 border-[#10A37F]'
                    : 'text-[#ACACAC] hover:text-white hover:bg-[#262626]'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
                title={item.label}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#10A37F]' : 'text-[#ACACAC]'}`}
                />
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </div>

        {/* Recent Conversations */}
        {!isCollapsed && (
          <div className="pt-2 border-t border-[#2D2D2D] space-y-1">
            <div className="flex items-center justify-between px-2.5 py-1">
              <span className="text-[11px] font-semibold text-[#8E8E8E] uppercase tracking-wider">
                Recent Chats
              </span>
              <span className="text-[10px] text-[#6E6E6E]">{conversations.length}</span>
            </div>

            <div className="space-y-0.5 max-h-48 overflow-y-auto pr-1">
              {conversations.map((conv) => {
                const isSelected = currentPage === 'chat' && activeConvId === conv.id;
                const isEditing = editingId === conv.id;

                return (
                  <div
                    key={conv.id}
                    onClick={() => {
                      onSelectConversation(conv.id);
                      onNavigate('chat');
                      onCloseMobile();
                    }}
                    className={`group relative flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#2F2F2F] text-white font-medium'
                        : 'text-[#ACACAC] hover:text-white hover:bg-[#262626]'
                    }`}
                  >
                    {isEditing ? (
                      <div
                        className="flex items-center gap-1 w-full"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full bg-[#1E1E1E] border border-[#10A37F] rounded px-1.5 py-0.5 text-xs text-white focus:outline-none"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(conv.id, e as any);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                        />
                        <button
                          onClick={(e) => handleSaveRename(conv.id, e)}
                          className="p-1 hover:text-[#10A37F]"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={handleCancelRename} className="p-1 hover:text-red-400">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 truncate pr-2">
                          <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-60" />
                          <span className="truncate">{conv.title || 'Untitled Chat'}</span>
                        </div>
                        <div className="hidden group-hover:flex items-center gap-1 shrink-0 text-[#8E8E8E]">
                          <button
                            onClick={(e) => handleStartRename(conv, e)}
                            className="p-1 hover:text-white hover:bg-[#383838] rounded"
                            title="Rename"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => onDeleteConversation(conv.id, e)}
                            className="p-1 hover:text-red-400 hover:bg-[#383838] rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer / Usage indicator */}
      <div className="p-3 border-t border-[#303030] bg-[#141414]">
        {!isCollapsed ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[#ACACAC]">
              <span className="flex items-center gap-1.5 text-white font-medium">
                <Zap className="w-3.5 h-3.5 text-[#10A37F]" />
                Gemini Flash-Lite
              </span>
              <span className="text-[11px] text-[#10A37F] font-mono">{remainingRequests} left</span>
            </div>
            <div className="w-full bg-[#2A2A2A] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#10A37F] h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(5, (remainingRequests / 100) * 100))}%` }}
              />
            </div>
            <p className="text-[10px] text-[#8E8E8E] leading-tight">
              Cost-controlled server proxy • Client keys never exposed
            </p>
          </div>
        ) : (
          <div className="flex justify-center" title={`${remainingRequests} requests remaining`}>
            <Zap className="w-4 h-4 text-[#10A37F]" />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:block transition-all duration-200 shrink-0 h-screen sticky top-0 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
