export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  category?: string;
  completed: boolean;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  toolCall?: {
    name: string;
    args: any;
    result: any;
  } | null;
  actionsTaken?: Array<{
    type: string;
    task?: Task;
    taskId?: string;
    taskTitle?: string;
  }>;
  attachedDocument?: {
    name: string;
    mimeType: string;
    size: number;
  };
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  text?: string;
  base64?: string;
  uploadedAt: string;
  lastAnalysis?: string;
  analysisType?: string;
}

export interface ActivityLog {
  id: string;
  type: 'chat' | 'task_created' | 'task_completed' | 'doc_analyzed' | 'code_review';
  title: string;
  timestamp: string;
  detail?: string;
}

export interface ServerUsage {
  totalRequests: number;
  chatRequests: number;
  docRequests: number;
  codeRequests: number;
  approxTokens: number;
  demoLimit: number;
}
