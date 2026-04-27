// Chat service for AI conversations
import { API_ENDPOINTS } from '@/lib/api';
import { ChatAIResponse, ConversationPage } from '@/types/chat';

const getHeaders = () => {
  if (typeof window === 'undefined') return { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

export const getConversationHistory = async (page = 0, size = 10): Promise<ConversationPage> => {
  const response = await fetch(`${API_ENDPOINTS.CHAT_CONVERSATIONS}?page=${page}&size=${size}`, {
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch conversation history');
  return response.json();
};

export const sendMessage = async (message: string, conversationId?: string): Promise<ChatAIResponse> => {
  const response = await fetch(API_ENDPOINTS.CHAT_AI, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ message, conversationId })
  });
  if (!response.ok) throw new Error('Failed to send message');
  return response.json();
};

export const getConversationId = async (): Promise<string | null> => {
  try {
    const history = await getConversationHistory(0, 1);
    if (history.content && history.content.length > 0) {
      return history.content[0].conversationId;
    }
  } catch (error) {
    console.error('Error getting conversation ID:', error);
  }
  return null;
};
