import React, { useState } from 'react';
import {
  History,
  MessageSquare,
  Search,
  Trash2,
  Download,
  Calendar,
  Clock,
  ArrowRight,
  Edit2,
  Check,
  X,
  FileDown,
} from 'lucide-react';
import { Conversation } from '../types';
import { NavPage } from '../components/Sidebar';

interface HistoryPageProps {
  conversations: Conversation[];
  activeConvId: string;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string, e: React.MouseEvent) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onClearAllConversations: () => void;
  onNavigate: (page: NavPage) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  conversations,
  activeConvId,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
  onClearAllConversations,
  onNavigate,
}) => {
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filtered = conversations.filter((c) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    return (
      c.title.toLowerCase().includes(query) ||
      c.messages.some((m) => m.content.toLowerCase().includes(query))
    );
  });

  const handleExportJson = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    const blob = new Blob([JSON.stringify(conv, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conv.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportMarkdown = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    let md = `# ${conv.title}\n*Exported from NEXORA AI on ${new Date().toLocaleString()}*\n\n---\n\n`;
    for (const msg of conv.messages) {
      md += `### ${msg.role === 'user' ? 'User' : 'NEXORA AI'} (${new Date(msg.timestamp).toLocaleTimeString()})\n\n${msg.content}\n\n---\n\n`;
    }
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conv.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

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

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#383838] pb-5">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-[#10A37F]" />
            Conversation Archive
          </h2>
          <p className="text-xs text-[#ACACAC] mt-1">
            Search, export, rename, or restore previous AI agent discussions.
          </p>
        </div>

        {conversations.length > 0 && (
          <button
            onClick={onClearAllConversations}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-950/30 text-xs font-medium transition-colors cursor-pointer w-fit"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All History</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#7E7E7E] absolute left-3.5 top-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search conversation titles or message contents..."
          className="w-full bg-[#2F2F2F] border border-[#424242] focus:border-[#10A37F] text-xs text-white rounded-xl pl-10 pr-4 py-2.5 focus:outline-none placeholder-[#7E7E7E]"
        />
      </div>

      {/* Conversations List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-12 text-center rounded-xl border border-dashed border-[#424242] bg-[#262626]/40 text-[#8E8E8E] space-y-2">
            <MessageSquare className="w-8 h-8 mx-auto text-[#7E7E7E]" />
            <p className="text-sm font-medium text-white">No conversations found</p>
            <p className="text-xs text-[#ACACAC]">
              {conversations.length === 0
                ? 'You have not started any conversations yet.'
                : 'No conversations matched your search term.'}
            </p>
          </div>
        ) : (
          filtered.map((conv) => {
            const isEditing = editingId === conv.id;
            const lastMessage = conv.messages[conv.messages.length - 1];

            return (
              <div
                key={conv.id}
                onClick={() => {
                  onSelectConversation(conv.id);
                  onNavigate('chat');
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  activeConvId === conv.id
                    ? 'border-[#10A37F] bg-[#2F2F2F]'
                    : 'border-[#424242] bg-[#2A2A2A] hover:bg-[#303030]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  {isEditing ? (
                    <div
                      className="flex items-center gap-2 flex-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="bg-[#202020] border border-[#10A37F] text-xs text-white px-2 py-1 rounded w-full max-w-sm focus:outline-none"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(conv.id, e as any);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                      />
                      <button
                        onClick={(e) => handleSaveRename(conv.id, e)}
                        className="p-1 text-[#10A37F] hover:text-white"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(null);
                        }}
                        className="p-1 text-red-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-[#10A37F] shrink-0" />
                      <h3 className="text-sm font-semibold text-white truncate">{conv.title}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#1F1F1F] text-[#8E8E8E] border border-[#383838]">
                        {conv.messages.length} messages
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 text-[#8E8E8E]">
                    <button
                      onClick={(e) => handleStartRename(conv, e)}
                      className="p-1.5 hover:text-white hover:bg-[#3A3A3A] rounded transition-colors"
                      title="Rename"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleExportMarkdown(conv, e)}
                      className="p-1.5 hover:text-[#10A37F] hover:bg-[#3A3A3A] rounded transition-colors"
                      title="Export as Markdown"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleExportJson(conv, e)}
                      className="p-1.5 hover:text-[#10A37F] hover:bg-[#3A3A3A] rounded transition-colors"
                      title="Export as JSON"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => onDeleteConversation(conv.id, e)}
                      className="p-1.5 hover:text-red-400 hover:bg-[#3A3A3A] rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {lastMessage && (
                  <p className="text-xs text-[#ACACAC] mt-2 line-clamp-1">
                    <strong className="text-white">
                      {lastMessage.role === 'user' ? 'User' : 'AI'}:
                    </strong>{' '}
                    {lastMessage.content}
                  </p>
                )}

                <div className="flex items-center justify-between text-[10px] text-[#7E7E7E] mt-3 pt-2 border-t border-[#383838]">
                  <span>
                    Created: {new Date(conv.createdAt).toLocaleDateString()} at{' '}
                    {new Date(conv.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>

                  <span className="text-[#10A37F] flex items-center gap-1 font-medium group">
                    <span>Open in Chat</span>
                    <ArrowRight className="w-3 h-3 transform group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
