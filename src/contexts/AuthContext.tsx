import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import type { User } from '../types/auth';
import { clearStoredPendingAuthDestination } from '@/lib/authGuard';

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
    const initAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const response = await authAPI.getMe();
          if (response.success && response.user) {
            setUser(response.user);
          } else {
            localStorage.removeItem('auth_token');
          }
        } catch (error) {
          localStorage.removeItem('auth_token');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('auth_token', token);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
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
