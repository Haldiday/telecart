import axios from 'axios';
import type { AuthResponse, SendOTPRequest, VerifyOTPRequest, User } from '../types/auth';

const apiBaseUrl = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: apiBaseUrl ? `${apiBaseUrl}/api` : '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  sendOTP: async (data: SendOTPRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/send-email-otp', data);
    return response.data;
  },

  verifyOTP: async (data: VerifyOTPRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/verify-email-otp', data);
    return response.data;
  },

  getMe: async (): Promise<AuthResponse> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: async (): Promise<AuthResponse> => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
};

export const userAPI = {
  getProfile: async (): Promise<AuthResponse> => {
    const response = await api.get('/user/profile');
    return response.data;
  },

  generateZohoToken: async (payload: { name?: string; companyName?: string; ttlMs?: number } = {}): Promise<AuthResponse & { token?: string; expiresAt?: number }> => {
    const response = await api.post('/forms/generate-token', payload);
    return response.data;
  },

  updateProfile: async (data: Partial<Pick<User, 'full_name' | 'company_name' | 'profile_photo'>>): Promise<AuthResponse> => {
    const response = await api.put('/user/profile', data);
    return response.data;
  },

  requestChangeEmail: async (new_email: string): Promise<AuthResponse> => {
    const response = await api.post('/user/change-email/request', { new_email });
    return response.data;
  },

  verifyChangeEmail: async (otp: string, new_email: string): Promise<AuthResponse> => {
    const response = await api.post('/user/change-email/verify', { otp, new_email });
    return response.data;
  },
};

export default api;
