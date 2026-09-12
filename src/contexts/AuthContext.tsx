import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import type { User } from '../types/auth';
import { clearStoredPendingAuthDestination } from '@/lib/authGuard';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User> & { token?: string }) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    /* AUTHENTICATION TEMPORARILY DISABLED - LOGIN/SIGNUP WILL BE ENABLED LATER
    DO NOT DELETE - WILL BE RE-ENABLED LATER
    const initAuth = async () => {
      const token = localStorage.getItem('auth_token');

      if (token) {
        try {
          const response = await authAPI.getMe();
          if (response.success && response.user) {
            setUser(response.user);
            setLoading(false);
            return;
          }

          if (response.message?.toLowerCase().includes('invalid') || response.message?.toLowerCase().includes('expired')) {
            localStorage.removeItem('auth_token');
          } else {
            console.warn('Auth initialization returned no user; keeping existing token for retry.', response);
          }
        } catch (error: any) {
          if (error.response?.status === 401 || error.response?.status === 403) {
            localStorage.removeItem('auth_token');
          } else {
            console.error('Auth initialization error:', error);
          }
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          created_at: session.user.created_at || new Date().toISOString(),
          updated_at: session.user.updated_at || new Date().toISOString(),
        } as User);
      }

      setLoading(false);
    };

    initAuth();
    */

    // Public visitors do not need an auth/session request during normal browsing.
    setLoading(false);
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('auth_token', token);
    localStorage.removeItem('msg91_session');
    setUser(userData);
  };

  const logout = async () => {
    const hasCustomToken = Boolean(localStorage.getItem('auth_token'));

    try {
      if (hasCustomToken) {
        await authAPI.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      if (hasCustomToken) {
        localStorage.removeItem('auth_token');
      }
      localStorage.removeItem('msg91_session');
      clearStoredPendingAuthDestination();
      setUser(null);
      navigate('/');
    }
  };

  const updateUser = (userData: Partial<User> & { token?: string }) => {
    if (userData.token) {
      localStorage.setItem('auth_token', userData.token);
    }
    setUser(prev => prev ? { ...prev, ...userData } : null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
