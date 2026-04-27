export interface ChatAIResponse {
  conversationId: string;
  chatAIResponses: string;
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