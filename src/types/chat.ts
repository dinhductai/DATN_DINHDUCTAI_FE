export interface ChatAIResponse {
  structured: boolean;
  message: string;
  summary?: {
    totalTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    completedToday: number;
    completionRate: number;
  };
  tasks?: Array<{
    emoji: string;
    taskId: number | null;
    title: string;
    description: string | null;
    deadline: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    status: 'TODO' | 'IN_PROGRESS' | 'DONE';
    reason: string | null;
  }>;
  recommendations?: Array<{
    taskId: number | null;
    taskTitle: string;
    reason: string | null;
    order: number;
  }>;
  motivation: string | null;
  followUp: string | null;
  conversationId: string;
}

export interface ConversationMessage {
  chatId: number;
  conversationId: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createAt: string;
  userId: number;
}

export interface ConversationPage {
  content: ConversationMessage[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
}