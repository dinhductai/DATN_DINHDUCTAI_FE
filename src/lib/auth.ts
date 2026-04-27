// JWT token management utilities
const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';

export const tokenStorage = {
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  
  setToken: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
  },
  
  removeToken: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
  },
  
  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  
  setRefreshToken: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },
  
  removeRefreshToken: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
  
  clearAll: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem('userEmail');
    localStorage.removeItem('isAdmin');
  },
};

export const authStorage = {
  getUserEmail: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('userEmail');
  },
  
  setUserEmail: (email: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('userEmail', email);
  },
  
  getIsAdmin: (): boolean => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('isAdmin') === 'true';
  },
  
  setIsAdmin: (isAdmin: boolean): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('isAdmin', String(isAdmin));
  },
};
