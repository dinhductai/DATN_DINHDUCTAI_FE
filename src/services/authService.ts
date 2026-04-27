// Auth service for handling authentication
import { API_ENDPOINTS } from '@/lib/api';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  refreshToken?: string;
  authenticated: boolean;
  isAdmin?: boolean;
  email?: string;
}

// Store token in cookie for middleware access
function setCookie(name: string, value: string, days: number = 7) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  // Determine if we're in production (https) or development (http)
  const isSecure = window.location.protocol === 'https:';
  const sameSite = isSecure ? 'SameSite=Strict' : 'SameSite=Lax';
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; ${sameSite}${isSecure ? '; secure' : ''}`;
}

// Clear cookie helper
function clearCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      console.log('Calling login API with:', credentials);
      
      const response = await fetch(API_ENDPOINTS.AUTH_LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      console.log('API Response status:', response.status);

      const data = await response.json();
      console.log('API Response data:', data);

      // If HTTP status is not ok, throw error
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Login failed');
      }
      
      // Check if we have a token in the response
      // If not, the backend might be using a different response format
      if (!data.token) {
        console.warn('No token in response:', data);
        // Try to use the response as-is (backend might return different format)
        if (data.authenticated === false) {
          throw new Error(data.message || data.error || 'Invalid credentials');
        }
        // If no error and no token, might be a session-based auth
        // Continue with the response
      }
      
      // Store data in localStorage and cookies
      if (typeof window !== 'undefined' && data.token) {
        localStorage.setItem('token', data.token);
      }
      
      // Store token in cookie for middleware access
      if (data.token) {
        setCookie('token', data.token, 7);
      }
      
      if (data.refreshToken) {
        setCookie('refreshToken', data.refreshToken, 7);
      }
      if (data.email) {
        setCookie('userEmail', data.email, 7);
      }
      if (data.isAdmin !== undefined) {
        setCookie('isAdmin', String(data.isAdmin), 7);
      } else if (data.role === 'ADMIN') {
        setCookie('isAdmin', 'true', 7);
      }
      
      console.log('Login successful, cookies set');
      
      // Return the data for AuthContext to use
      return {
        token: data.token || '',
        authenticated: true,
        email: data.email,
        isAdmin: data.isAdmin || data.role === 'ADMIN',
        ...data,
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  logout: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('isAdmin');
    }
    // Clear cookies using helper
    clearCookie('token');
    clearCookie('refreshToken');
    clearCookie('userEmail');
    clearCookie('isAdmin');
    // Redirect to login
    window.location.href = '/login';
  },

  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  },

  isAuthenticated: (): boolean => {
    return this.getToken() !== null && this.getToken() !== '';
  },
};
