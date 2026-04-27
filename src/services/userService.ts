// User service for handling user operations
import { API_ENDPOINTS } from '@/lib/api';

const getHeaders = () => {
  if (typeof window === 'undefined') return { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

export const userService = {
  createUser: async (request: { userName: string; password: string; email: string }): Promise<any> => {
    const response = await fetch(`${API_ENDPOINTS.ADMIN_USERS}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(request)
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create user: ${response.status} ${errorText}`);
    }
    return response.json();
  },

  getAllUsers: async (): Promise<any[]> => {
    const response = await fetch(API_ENDPOINTS.ADMIN_USERS, {
      method: 'GET',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch users');
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },

  searchUsers: async (keyword: string): Promise<any[]> => {
    const response = await fetch(`${API_ENDPOINTS.ADMIN_USERS_SEARCH}?keyword=${encodeURIComponent(keyword)}`, {
      method: 'GET',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to search users');
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },

  updateUser: async (userId: number, request: {
    userName: string;
    email: string;
    password?: string;
    profile?: string;
  }): Promise<any> => {
    const response = await fetch(`${API_ENDPOINTS.ADMIN_USERS}/${userId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(request)
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update user: ${response.status} ${errorText}`);
    }
    return response.json();
  },

  deleteUser: async (userId: number): Promise<void> => {
    const response = await fetch(`${API_ENDPOINTS.ADMIN_USERS}/${userId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete user: ${response.status} ${errorText}`);
    }
  },

  getTotalUsers: async (): Promise<number> => {
    const response = await fetch(API_ENDPOINTS.ADMIN_USERS_TOTAL, {
      method: 'GET',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch total users');
    return response.json();
  },

  getNewUsersThisWeek: async (): Promise<number> => {
    const response = await fetch(API_ENDPOINTS.ADMIN_USERS_NEW_WEEK, {
      method: 'GET',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch new users');
    return response.json();
  }
};
