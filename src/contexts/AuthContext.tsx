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
const AUTH_USER_KEY = 'auth_user';

function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function setStoredUser(user: User | null) {
  if (user) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_USER_KEY);
  }
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setStoredUser(null);
        setLoading(false);
        return;
      }

      const cachedUser = getStoredUser();
      if (cachedUser) {
        setUser(cachedUser);
      }

      try {
        const response = await authAPI.getMe();
        if (response.success && response.user) {
          setUser(response.user);
          setStoredUser(response.user);
        } else {
          const message = response.message?.toLowerCase() ?? '';
          if (
            message.includes('authentication required') ||
            message.includes('invalid') ||
            message.includes('expired')
          ) {
            localStorage.removeItem('auth_token');
            setStoredUser(null);
            setUser(null);
          }
        }
      } catch (error: any) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem('auth_token');
          setStoredUser(null);
          setUser(null);
        } else {
          console.error('Auth initialization error:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== 'auth_token') {
        return;
      }

      if (!event.newValue) {
        setStoredUser(null);
        setUser(null);
        return;
      }

      authAPI.getMe()
        .then((response) => {
          if (response.success && response.user) {
            setUser(response.user);
            setStoredUser(response.user);
          } else {
            setStoredUser(null);
            setUser(null);
          }
        })
        .catch((error) => {
          if (error.response?.status === 401 || error.response?.status === 403) {
            setStoredUser(null);
            setUser(null);
          }
        });
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('auth_token', token);
    setStoredUser(userData);
    localStorage.removeItem('msg91_session');
    setUser(userData);
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      setStoredUser(null);
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
    setUser(prev => {
      const nextUser = prev ? { ...prev, ...userData } : null;
      setStoredUser(nextUser ?? null);
      return nextUser;
    });
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
