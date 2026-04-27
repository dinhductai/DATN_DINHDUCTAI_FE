'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '@/services/authService';

interface User {
  email: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to get cookies on client side
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|; )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in using cookies
    // User is logged in only if BOTH token AND userEmail exist
    const token = getCookie('token');
    const savedEmail = getCookie('userEmail');
    const savedIsAdmin = getCookie('isAdmin');
    
    if (token && savedEmail) {
      setUser({
        email: savedEmail,
        isAdmin: savedIsAdmin === 'true',
      });
    } else {
      // No valid auth cookies - clear any stale data
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authService.login({ email, password });

    if (response.authenticated) {
      // Also update client state
      const isAdmin = email.toLowerCase().includes('admin') || response.isAdmin === true;
      
      setUser({
        email: response.email || email,
        isAdmin,
      });
    } else {
      throw new Error('Invalid credentials');
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
