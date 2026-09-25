'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, ApiError } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'MERCHANT' | 'ADMIN';
  isActive: boolean;
  avatarUrl?: string;
  studentProfile?: {
    id: string;
    demoBalance: number;
    totalPoints: number;
    level: number;
    college: string;
    course: string;
    year: number;
  };
  merchantProfile?: {
    id: string;
    businessName: string;
    status: string;
    totalSales: number;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: Record<string, unknown>) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const data = await api.auth.me() as { user: User };
      setUser(data.user);
    } catch {
      setUser(null);
      localStorage.removeItem('pl_token');
    }
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem('pl_token');
    if (storedToken) {
      setToken(storedToken);
      refreshUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const data = await api.auth.login(email, password) as { user: User; token: string };
    localStorage.setItem('pl_token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (formData: Record<string, unknown>) => {
    const data = await api.auth.register(formData) as { user: User; token: string };
    localStorage.setItem('pl_token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    api.auth.logout().catch(() => {});
    localStorage.removeItem('pl_token');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function useRequireAuth(allowedRoles?: Array<'STUDENT' | 'MERCHANT' | 'ADMIN'>) {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/login';
    }
    if (!loading && user && allowedRoles && !allowedRoles.includes(user.role)) {
      if (user.role === 'STUDENT') window.location.href = '/student/dashboard';
      else if (user.role === 'MERCHANT') window.location.href = '/merchant/dashboard';
      else window.location.href = '/admin';
    }
  }, [user, loading, allowedRoles]);

  return { user, loading };
}
