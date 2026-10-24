/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, NavPage } from './components/Sidebar';
import { Header } from './components/Header';
import { CommandPalette } from './components/CommandPalette';
import { ShortcutsModal } from './components/ShortcutsModal';
import { DashboardPage } from './pages/DashboardPage';
import { ChatPage } from './pages/ChatPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { CodingAssistantPage } from './pages/CodingAssistantPage';
import { TaskPlannerPage } from './pages/TaskPlannerPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { AboutPage } from './pages/AboutPage';
import { storage } from './utils/storage';
import { Task, Conversation, DocumentItem, ActivityLog, ServerUsage } from './types';

export default function App() {
  const [currentPage, setCurrentPage] = useState<NavPage>('dashboard');
  const [conversations, setConversations] = useState<Conversation[]>(() =>
    storage.getConversations()
  );
  const [activeConvId, setActiveConvId] = useState<string>(() =>
    storage.getActiveConvId()
  );
  const [tasks, setTasks] = useState<Task[]>(() => storage.getTasks());
  const [documents, setDocuments] = useState<DocumentItem[]>(() =>
    storage.getDocuments()
  );
  const [activities, setActivities] = useState<ActivityLog[]>(() =>
    storage.getActivities()
  );
  const [theme, setTheme] = useState<'dark' | 'light'>(() => storage.getTheme());
  const [activeModel, setActiveModel] = useState<string>('gemini-3.1-flash-lite');
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);

  // Layout & Modal states
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);

  // Server usage state
  const [usage, setUsage] = useState<ServerUsage>({
    totalRequests: 0,
    chatRequests: 0,
    docRequests: 0,
    codeRequests: 0,
    approxTokens: 0,
    demoLimit: 100,
  });

  // Fetch health and server status on mount
  useEffect(() => {
    storage.setTheme(theme);

    const fetchServerStatus = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const data = await res.json();
          if (data.activeModel) setActiveModel(data.activeModel);
          if (data.hasApiKey !== undefined) setHasApiKey(data.hasApiKey);
          if (data.usage) setUsage(data.usage);
        }
      } catch (e) {
        console.warn('Could not connect to health endpoint yet:', e);
      }
    };

    fetchServerStatus();
  }, []);

  const refreshUsage = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        if (data.usage) setUsage(data.usage);
      }
    } catch (e) {
      console.warn('Failed to refresh usage:', e);
    }
  };

  const handleToggleTheme = useCallback(() => {
    setTheme((prevTheme) => {
      const next = prevTheme === 'dark' ? 'light' : 'dark';
      storage.setTheme(next);
      return next;
    });
  }, []);

  const handleNewChat = useCallback(() => {
    const newConv: Conversation = {
      id: 'conv_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 3),
      title: 'New Chat',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    setConversations((prev) => {
      const updatedList = [newConv, ...prev];
      storage.saveConversations(updatedList);
      return updatedList;
    });
    setActiveConvId(newConv.id);
    storage.setActiveConvId(newConv.id);
    setCurrentPage('chat');
    storage.addActivity({
      type: 'chat',
      title: 'Started New Conversation',
      detail: 'Triggered new conversation session.',
    });
    setActivities(storage.getActivities());
  }, []);

  // GLOBAL KEYBOARD SHORTCUTS HANDLER
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement;
      const isTyping =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      // 1. Command Palette / Search: Ctrl+K or Cmd+K
      if (isCmdOrCtrl && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        setIsShortcutsModalOpen(false);
        return;
      }

      // 2. New Conversation: Ctrl+N or Cmd+N
      if (isCmdOrCtrl && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        handleNewChat();
        setIsCommandPaletteOpen(false);
        return;
      }

      // 3. Toggle Sidebar Collapse: Ctrl+B or Cmd+B
      if (isCmdOrCtrl && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        setIsSidebarCollapsed((prev) => !prev);
        return;
      }

      // 4. Toggle Theme: Ctrl+Shift+L
      if (isCmdOrCtrl && e.shiftKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        handleToggleTheme();
        return;
      }

      // 5. Open Shortcuts Help: Ctrl+/
      if (isCmdOrCtrl && e.key === '/') {
        e.preventDefault();
        setIsShortcutsModalOpen((prev) => !prev);
        setIsCommandPaletteOpen(false);
        return;
      }

      // 6. Direct Page Navigation: Ctrl+1 to Ctrl+8
      if (isCmdOrCtrl && !e.shiftKey && !e.altKey) {
        const pageMap: Record<string, NavPage> = {
          '1': 'dashboard',
          '2': 'chat',
          '3': 'documents',
          '4': 'code',
          '5': 'tasks',
          '6': 'history',
          '7': 'settings',
          '8': 'about',
        };
        if (pageMap[e.key]) {
          e.preventDefault();
          setCurrentPage(pageMap[e.key]);
          setIsCommandPaletteOpen(false);
          return;
        }
      }

      // 7. '?' key to open cheat sheet (when user is NOT typing in an input/textarea)
      if (!isTyping && e.key === '?') {
        e.preventDefault();
        setIsShortcutsModalOpen(true);
        return;
      }

      // 8. Escape key closes active modals
      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
        setIsShortcutsModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNewChat, handleToggleTheme]);

  const activeConversation =
    conversations.find((c) => c.id === activeConvId) || conversations[0] || {
      id: 'default',
      title: 'New Conversation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };

  const handleUpdateConversation = (updated: Conversation) => {
    const updatedList = conversations.map((c) =>
      c.id === updated.id ? updated : c
    );
    const exists = conversations.some((c) => c.id === updated.id);
    const finalList = exists ? updatedList : [updated, ...conversations];
    setConversations(finalList);
    storage.saveConversations(finalList);
    refreshUsage();
  };

  const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = conversations.filter((c) => c.id !== id);
    setConversations(updated);
    storage.saveConversations(updated);
    if (activeConvId === id) {
      const nextId = updated[0]?.id || '';
      setActiveConvId(nextId);
      storage.setActiveConvId(nextId);
    }
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    const updated = conversations.map((c) =>
      c.id === id ? { ...c, title: newTitle, updatedAt: new Date().toISOString() } : c
    );
    setConversations(updated);
    storage.saveConversations(updated);
  };

  const handleClearAllConversations = () => {
    const freshConv: Conversation = {
      id: 'conv_' + Date.now().toString(36),
      title: 'Welcome to NEXORA AI',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    setConversations([freshConv]);
    storage.saveConversations([freshConv]);
    setActiveConvId(freshConv.id);
    storage.setActiveConvId(freshConv.id);
    logActivity('Cleared Conversation Archive', 'History wiped.');
  };

  const handleTasksUpdated = (newTasks: Task[]) => {
    setTasks(newTasks);
    storage.saveTasks(newTasks);
  };

  const handleToggleTask = (taskId: string) => {
    const target = tasks.find((t) => t.id === taskId);
    const updated = tasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    handleTasksUpdated(updated);
    if (target && !target.completed) {
      logActivity('Completed Task', target.title);
    }
  };

  const handleSaveDocuments = (newDocs: DocumentItem[]) => {
    setDocuments(newDocs);
    storage.saveDocuments(newDocs);
    refreshUsage();
  };

  const handleSendDocToChat = (doc: DocumentItem) => {
    setCurrentPage('chat');
    handleNewChat();
  };

  const logActivity = (title: string, detail?: string) => {
    storage.addActivity({
      type: 'chat',
      title,
      detail,
    });
    setActivities(storage.getActivities());
  };

  const handleStartPrompt = (promptText: string) => {
    const newConv: Conversation = {
      id: 'conv_' + Date.now().toString(36),
      title: promptText.slice(0, 36) || 'New Conversation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: 'msg_prompt_' + Date.now().toString(36),
          role: 'user',
          content: promptText,
          timestamp: new Date().toISOString(),
        },
      ],
    };
    const updatedList = [newConv, ...conversations];
    setConversations(updatedList);
    storage.saveConversations(updatedList);
    setActiveConvId(newConv.id);
    storage.setActiveConvId(newConv.id);
    setCurrentPage('chat');

    (async () => {
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: promptText }],
            currentTasks: tasks,
          }),
        });
        if (response.ok) {
          const data = await response.json();
          const botMessage = {
            id: 'msg_bot_' + Date.now().toString(36),
            role: 'model' as const,
            content: data.text,
            timestamp: new Date().toISOString(),
            toolCall: data.toolCall,
            actionsTaken: data.actionsTaken,
          };
          const convWithBot = {
            ...newConv,
            messages: [...newConv.messages, botMessage],
            updatedAt: new Date().toISOString(),
          };
          handleUpdateConversation(convWithBot);
        }
      } catch (err) {
        console.error('Failed auto-prompt response:', err);
      }
    })();
  };

  const handleClearAllWorkspaceData = () => {
    if (window.confirm('Are you sure you want to clear all tasks, conversations, and document data?')) {
      storage.clearAllData();
      setTasks(storage.getTasks());
      setConversations(storage.getConversations());
      setDocuments(storage.getDocuments());
      setActivities(storage.getActivities());
      setActiveConvId(storage.getActiveConvId());
    }
  };

  const handleExportAllWorkspaceData = () => {
    const backup = {
      appName: 'NEXORA AI Workspace',
      exportedAt: new Date().toISOString(),
      tasks,
      conversations,
      documents: documents.map((d) => ({
        id: d.id,
        name: d.name,
        mimeType: d.mimeType,
        size: d.size,
        uploadedAt: d.uploadedAt,
      })),
      activities,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexora_workspace_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-screen bg-[#212121] text-white">
      {/* Global Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={setCurrentPage}
        onNewChat={handleNewChat}
        onOpenNewTaskModal={() => setCurrentPage('tasks')}
        onToggleTheme={handleToggleTheme}
        theme={theme}
        conversations={conversations}
        tasks={tasks}
        onSelectConversation={(id) => {
          setActiveConvId(id);
          storage.setActiveConvId(id);
        }}
      />

      {/* Global Keyboard Shortcuts Modal (? or Ctrl+/) */}
      <ShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />

      {/* Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        conversations={conversations}
        activeConvId={activeConvId}
        onSelectConversation={(id) => {
          setActiveConvId(id);
          storage.setActiveConvId(id);
        }}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        remainingRequests={Math.max(0, usage.demoLimit - usage.totalRequests)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <Header
          currentPage={currentPage}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onQuickNewTask={() => setCurrentPage('tasks')}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenShortcutsHelp={() => setIsShortcutsModalOpen(true)}
          activeModelName={activeModel}
          hasApiKey={hasApiKey}
        />

        <main className="flex-1 bg-[#212121]">
          {currentPage === 'dashboard' && (
            <DashboardPage
              onNavigate={setCurrentPage}
              onStartPrompt={handleStartPrompt}
              tasks={tasks}
              onToggleTask={handleToggleTask}
              onOpenNewTaskModal={() => setCurrentPage('tasks')}
              onTasksUpdated={handleTasksUpdated}
              onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
              conversations={conversations}
              activities={activities}
              usage={usage}
              activeModel={activeModel}
            />
          )}

          {currentPage === 'chat' && (
            <ChatPage
              conversation={activeConversation}
              onUpdateConversation={handleUpdateConversation}
              tasks={tasks}
              onTasksUpdated={handleTasksUpdated}
              onNavigate={setCurrentPage}
              activeModel={activeModel}
            />
          )}

          {currentPage === 'documents' && (
            <DocumentsPage
              documents={documents}
              onSaveDocuments={handleSaveDocuments}
              onSendToChat={handleSendDocToChat}
              onNavigate={setCurrentPage}
              onLogActivity={(t, d) => logActivity(t, d)}
            />
          )}

          {currentPage === 'code' && (
            <CodingAssistantPage onLogActivity={(t, d) => logActivity(t, d)} />
          )}

          {currentPage === 'tasks' && (
            <TaskPlannerPage
              tasks={tasks}
              onTasksUpdated={handleTasksUpdated}
              onLogActivity={(t, d) => logActivity(t, d)}
            />
          )}

          {currentPage === 'history' && (
            <HistoryPage
              conversations={conversations}
              activeConvId={activeConvId}
              onSelectConversation={(id) => {
                setActiveConvId(id);
                storage.setActiveConvId(id);
              }}
              onDeleteConversation={handleDeleteConversation}
              onRenameConversation={handleRenameConversation}
              onClearAllConversations={handleClearAllConversations}
              onNavigate={setCurrentPage}
            />
          )}

          {currentPage === 'settings' && (
            <SettingsPage
              usage={usage}
              onRefreshUsage={refreshUsage}
              activeModel={activeModel}
              onChangeModel={setActiveModel}
              theme={theme}
              onToggleTheme={handleToggleTheme}
              onClearAllWorkspaceData={handleClearAllWorkspaceData}
              onExportAllWorkspaceData={handleExportAllWorkspaceData}
            />
          )}

          {currentPage === 'about' && <AboutPage />}
        </main>
      </div>
    </div>
  );
}
