export type ChatMode = 1 | 2 | 3 | 4;

export interface ChatModeInfo {
  mode: ChatMode;
  label: string;
  icon: string;
  description: string;
}

export const CHAT_MODES: ChatModeInfo[] = [
  {
    mode: 1,
    label: 'Mặc định',
    icon: '📊',
    description: 'Thống kê & hỏi đáp về lịch trình'
  },
  {
    mode: 2,
    label: 'Tư vấn',
    icon: '💬',
    description: 'Trò chuyện tự nhiên & tư vấn'
  },
  {
    mode: 3,
    label: 'Tạo mới',
    icon: '➕',
    description: 'Hỗ trợ tạo task & event mới'
  },
  {
    mode: 4,
    label: 'Đặc biệt',
    icon: '⭐',
    description: 'Chế độ đặc biệt'
  }
];

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

export interface Mode1ChatResponse {
  structured: boolean;
  message: string;
  answerType?: string;
  summary?: {
    totalTasks: number;
    todoCount: number;
    inProgressCount: number;
    doneCount: number;
    overdueCount: number;
    eventCount: number;
  };
  tasks?: Array<{
    taskId: number | null;
    title: string;
    deadline: string;
    deadlineInfo: string;
    priority: string;
    status: string;
    isEvent?: boolean;
    reason?: string | null;
  }>;
  events?: Array<{
    taskId: number | null;
    eventId: number | null;
    title: string;
    startTime: string;
    location: string;
    isOnline: boolean;
    priority: string;
    reason?: string | null;
  }>;
  highlight?: {
    mostUrgent: string | null;
    mostImportant: string | null;
  };
  conversationId: string;
}

export interface Mode2ChatResponse {
  structured: boolean;
  message: string;
  conversationId: string;
  canApply: boolean;
  schedule?: Array<{
    taskId: number | null;
    eventId: number | null;
    type: string;
    title: string;
    startTime: string | null;
    deadline: string | null;
    category: string;
  }>;
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