import { ChatAIResponse, ConversationPage, Mode1ChatResponse, Mode2ChatResponse, ChatMode } from '../types/chat';

const API_URL = '/api/ai';
const RICH_API_URL = '/api/ai/rich';
const MODE1_API_URL = '/api/ai/mode/1';
const MODE2_API_URL = '/api/ai/mode/2';

export const getConversationHistory = async (
  conversationId: string,
  page = 0,
  size = 20
): Promise<ConversationPage> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/history?conversationId=${encodeURIComponent(conversationId)}&page=${page}&size=${size}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch conversation history: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching conversation history:', error);
    throw error;
  }
};

export const sendMessageMode1 = async (
  message: string,
  conversationId?: string,
  mode: ChatMode = 1
): Promise<Mode1ChatResponse> => {
  try {
    const token = localStorage.getItem('token');

    const body = new URLSearchParams();
    body.append('message', message);
    body.append('mode', String(mode));
    if (conversationId) {
      body.append('conversationId', conversationId);
    }

    const response = await fetch(MODE1_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to send message: ${response.status} ${errorText}`);
    }

    const data: Mode1ChatResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending mode 1 message:', error);
    throw error;
  }
};

export const sendMessageMode2 = async (
  message: string,
  conversationId?: string,
  mode: ChatMode = 2
): Promise<Mode2ChatResponse> => {
  try {
    const token = localStorage.getItem('token');

    const body = new URLSearchParams();
    body.append('message', message);
    body.append('mode', String(mode));
    if (conversationId) {
      body.append('conversationId', conversationId);
    }

    const response = await fetch(MODE2_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to send message: ${response.status} ${errorText}`);
    }

    const data: Mode2ChatResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending mode 2 message:', error);
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

export const getConversationId = async (mode: ChatMode = 1): Promise<string | null> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/id?mode=${mode}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      return null;
    }

    const conversationId = await response.text();
    return conversationId || null;
  } catch (error) {
    console.error('Error getting conversation ID:', error);
    return null;
  }
};