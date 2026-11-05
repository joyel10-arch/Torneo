import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { type User } from '../types';
import { authApi } from '../lib/api';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isOrganizer: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('torneo_token');
    const storedUser = localStorage.getItem('torneo_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('torneo_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    localStorage.setItem('torneo_token', data.access_token);
    localStorage.setItem('torneo_user', JSON.stringify(data.user));
    setToken(data.access_token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('torneo_token');
    localStorage.removeItem('torneo_user');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  }, []);

  const isAuthenticated = !!token && !!user;
  const isAdmin = user?.role === 'admin';
  const isOrganizer = user?.role === 'admin' || user?.role === 'organizer';

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, isAuthenticated, isAdmin, isOrganizer }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
