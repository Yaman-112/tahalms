import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { post, get, setTokens, clearTokens } from '../api/client';
import type { User, LoginResponse, Role } from '../types';

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  const isLoggedIn = !!user;

  // On mount, verify the stored token is still valid
  useEffect(() => {
    // Magic share-link: ?access_token=<jwt> drops the user into the app as
    // that user (used for per-student share links). Wipe any prior session
    // first so two share-links opened in the same browser don't bleed
    // into each other, then strip the token from the URL.
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('access_token');
    if (urlToken) {
      clearTokens();
      setTokens(urlToken, '');
      params.delete('access_token');
      const newSearch = params.toString();
      const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash;
      window.history.replaceState({}, '', newUrl);
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setIsLoading(false);
      return;
    }

    get<User>('/auth/me').then(res => {
      if (res.success) {
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      } else {
        clearTokens();
        setUser(null);
      }
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await post<LoginResponse>('/auth/login', { email, password });

    if (res.success) {
      setTokens(res.data.accessToken, res.data.refreshToken);
      setUser(res.data.user);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      return { success: true };
    }

    return { success: false, error: res.error || 'Login failed' };
  }, []);

  const logout = useCallback(() => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      post('/auth/logout', { refreshToken }).catch(() => {});
    }
    clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
