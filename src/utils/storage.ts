import { Task, Conversation, DocumentItem, ActivityLog } from '../types';

const TASKS_KEY = 'nexora_tasks';
const CONVERSATIONS_KEY = 'nexora_conversations';
const ACTIVE_CONV_ID_KEY = 'nexora_active_conv_id';
const DOCUMENTS_KEY = 'nexora_documents';
const ACTIVITIES_KEY = 'nexora_activities';
const THEME_KEY = 'nexora_theme';

const INITIAL_TASKS: Task[] = [
  {
    id: 't-1',
    title: 'Audit API cost & request limits for Gemini Flash Lite',
    description: 'Ensure bounding is configured to 10 context messages and per-session limit is visible.',
    priority: 'high',
    dueDate: 'Today',
    category: 'Development',
    completed: true,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 't-2',
    title: 'Review system architecture and tool-routing pipeline',
    description: 'Verify deterministic task creation, listing, completion, and document analysis tools.',
    priority: 'medium',
    dueDate: 'Tomorrow',
    category: 'Architecture',
    completed: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 't-3',
    title: 'Upload project specification PDF for executive summary',
    description: 'Test PDF native ingestion through the Documents assistant module.',
    priority: 'low',
    dueDate: 'This Week',
    category: 'Research',
    completed: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

const INITIAL_CONVERSATION: Conversation = {
  id: 'conv-init-1',
  title: 'Welcome to NEXORA AI',
  createdAt: new Date(Date.now() - 7200000).toISOString(),
  updatedAt: new Date(Date.now() - 7200000).toISOString(),
  messages: [
    {
      id: 'm-1',
      role: 'model',
      content: `### Welcome to **NEXORA AI** — Intelligent AI Workspace

I am your primary AI agent powered by Google Gemini Flash Lite. I am equipped with integrated tools to help you build, research, plan, and analyze:

1. **Integrated Task Planner**: Ask me to create, list, or complete tasks (e.g. *"Create a high priority task to review PR #12"*).
2. **Document Assistant**: Attach TXT or PDF documents to summarize, extract action items, or answer targeted questions.
3. **Coding Assistant**: Ask me to explain difficult algorithms, debug code snippets, or review system designs.
4. **Research & Writing**: Produce structured summaries, study plans, or project roadmaps.

What would you like to work on today?`,
      timestamp: new Date(Date.now() - 7200000).toISOString(),
    },
  ],
};

const INITIAL_ACTIVITIES: ActivityLog[] = [
  {
    id: 'act-1',
    type: 'chat',
    title: 'Initialized NEXORA AI Workspace',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    detail: 'Session started with Gemini Flash-Lite agent.',
  },
  {
    id: 'act-2',
    type: 'task_completed',
    title: 'Completed task: Audit API cost & request limits',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    detail: 'Verified bounding logic.',
  },
];

export const storage = {
  getTasks(): Task[] {
    try {
      const data = localStorage.getItem(TASKS_KEY);
      if (!data) {
        localStorage.setItem(TASKS_KEY, JSON.stringify(INITIAL_TASKS));
        return INITIAL_TASKS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_TASKS;
    }
  },

  saveTasks(tasks: Task[]): void {
    try {
      localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to save tasks to localStorage:', e);
    }
  },

  getConversations(): Conversation[] {
    try {
      const data = localStorage.getItem(CONVERSATIONS_KEY);
      if (!data) {
        localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify([INITIAL_CONVERSATION]));
        return [INITIAL_CONVERSATION];
      }
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : [INITIAL_CONVERSATION];
    } catch {
      return [INITIAL_CONVERSATION];
    }
  },

  saveConversations(conversations: Conversation[]): void {
    try {
      localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
    } catch (e) {
      console.error('Failed to save conversations:', e);
    }
  },

  getActiveConvId(): string {
    return localStorage.getItem(ACTIVE_CONV_ID_KEY) || INITIAL_CONVERSATION.id;
  },

  setActiveConvId(id: string): void {
    localStorage.setItem(ACTIVE_CONV_ID_KEY, id);
  },

  getDocuments(): DocumentItem[] {
    try {
      const data = localStorage.getItem(DOCUMENTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveDocuments(docs: DocumentItem[]): void {
    try {
      localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(docs));
    } catch (e) {
      console.error('Failed to save documents:', e);
    }
  },

  getActivities(): ActivityLog[] {
    try {
      const data = localStorage.getItem(ACTIVITIES_KEY);
      if (!data) {
        localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(INITIAL_ACTIVITIES));
        return INITIAL_ACTIVITIES;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_ACTIVITIES;
    }
  },

  addActivity(activity: Omit<ActivityLog, 'id' | 'timestamp'>): void {
    try {
      const current = this.getActivities();
      const newAct: ActivityLog = {
        ...activity,
        id: 'act_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 3),
        timestamp: new Date().toISOString(),
      };
      const updated = [newAct, ...current].slice(0, 50); // keep recent 50
      localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to log activity:', e);
    }
  },

  getTheme(): 'dark' | 'light' {
    return (localStorage.getItem(THEME_KEY) as 'dark' | 'light') || 'dark';
  },

  setTheme(theme: 'dark' | 'light'): void {
    localStorage.setItem(THEME_KEY, theme);
    document.documentElement.setAttribute('data-theme', theme);
  },

  clearAllData(): void {
    localStorage.removeItem(TASKS_KEY);
    localStorage.removeItem(CONVERSATIONS_KEY);
    localStorage.removeItem(ACTIVE_CONV_ID_KEY);
    localStorage.removeItem(DOCUMENTS_KEY);
    localStorage.removeItem(ACTIVITIES_KEY);
  },
};
