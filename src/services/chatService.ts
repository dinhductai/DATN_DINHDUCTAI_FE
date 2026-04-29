import { ChatAIResponse, ConversationPage } from '../types/chat';

const API_URL = '/api/ai';
const RICH_API_URL = '/api/ai/rich';

export const getConversationHistory = async (page = 0, size = 10): Promise<ConversationPage> => {
  try {
    const token = localStorage.getItem('token');
    console.log('[API] Fetching conversation history, page:', page, 'size:', size, 'token:', token ? 'present' : 'missing');
    
    const response = await fetch(`${API_URL}/history?page=${page}&size=${size}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('[API] Conversation history response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] Conversation history error:', response.status, errorText);
      throw new Error(`Failed to fetch conversation history: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('[API] Conversation history data:', data);
    return data;
  } catch (error) {
    console.error('Error fetching conversation history:', error);
    throw error;
  }
};

export const sendMessage = async (
  message: string,
  conversationId?: string
): Promise<ChatAIResponse> => {
  try {
    const token = localStorage.getItem('token');
    console.log('[API] Sending message, conversationId:', conversationId || 'new', 'token:', token ? 'present' : 'missing');

    const body = new URLSearchParams();
    body.append('message', message);
    if (conversationId) {
      body.append('conversationId', conversationId);
    }

    const response = await fetch(RICH_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body
    });

    console.log('[API] Send message response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] Send message error:', response.status, errorText);
      throw new Error(`Failed to send message: ${response.status} ${errorText}`);
    }

    const data: ChatAIResponse = await response.json();
    console.log('[API] Send message data:', data);
    return data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const getConversationId = async (): Promise<string> => {
  try {
    const token = localStorage.getItem('token');
    console.log('[API] Getting conversation ID, token:', token ? 'present' : 'missing');
    
    const response = await fetch(`${API_URL}/id`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('[API] Get conversation ID response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] Get conversation ID error:', response.status, errorText);
      throw new Error(`Failed to get conversation ID: ${response.status} ${errorText}`);
    }

    const conversationId = await response.text();
    console.log('[API] Conversation ID:', conversationId);
    return conversationId;
  } catch (error) {
    console.error('Error getting conversation ID:', error);
    throw error;
  }
};