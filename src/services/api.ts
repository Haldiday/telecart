import axios from 'axios';
import type {
  AuthResponse,
  SendOTPRequest,
  SendWhatsAppOTPRequest,
  VerifyOTPRequest,
  VerifyWhatsAppOTPRequest,
  User,
  SignupCheckRequest,
  SignupCompleteRequest,
} from '../types/auth';

// In production, always use relative URLs for API calls.
// In development, prefer VITE_API_URL if provided, otherwise default to localhost.
const apiBaseUrl = import.meta.env.PROD ? '' : import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

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
  checkSignupUser: async (data: SignupCheckRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/signup/check-user', data);
    return response.data;
  },

  signupSendEmailOTP: async (data: SignupCheckRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/signup/send-email-otp', data);
    return response.data;
  },

  signupVerifyEmailOTP: async (data: { email: string; otp: string }): Promise<AuthResponse> => {
    const response = await api.post('/auth/signup/verify-email-otp', data);
    return response.data;
  },

  signupSendPhoneOTP: async (data: SignupCheckRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/signup/send-phone-otp', data);
    return response.data;
  },

  signupVerifyPhoneOTP: async (data: { email: string; phone: string; otp: string }): Promise<AuthResponse> => {
    const response = await api.post('/auth/signup/verify-phone-otp', data);
    return response.data;
  },

  signupComplete: async (data: SignupCompleteRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/signup/complete', data);
    return response.data;
  },

  loginSendEmailOTP: async (data: SendOTPRequest): Promise<AuthResponse> => {
    // Cloudflare Pages Functions expose `/auth/send-email-otp` rather than `/auth/login/email/send-otp`.
    const response = await api.post('/auth/send-email-otp', data);
    return response.data;
  },

  loginVerifyEmailOTP: async (data: VerifyOTPRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/login/email/verify', data);
    return response.data;
  },

  loginSendPhoneOTP: async (data: SendWhatsAppOTPRequest): Promise<AuthResponse> => {
    // Use the functions-backed endpoint
    const response = await api.post('/auth/send-whatsapp-otp', data);
    return response.data;
  },

  loginVerifyPhoneOTP: async (data: VerifyWhatsAppOTPRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/login/phone/verify', data);
    return response.data;
  },

  sendOTP: async (data: SendOTPRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/send-email-otp', data);
    return response.data;
  },

  verifyOTP: async (data: VerifyOTPRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/verify-email-otp', data);
    return response.data;
  },

  sendWhatsAppOTP: async (data: SendWhatsAppOTPRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/send-whatsapp-otp', data);
    return response.data;
  },

  verifyWhatsAppOTP: async (data: VerifyWhatsAppOTPRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/verify-whatsapp-otp', data);
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

  generateZohoToken: async (payload: { name?: string; companyName?: string; firstName?: string; lastName?: string; ttlMs?: number } = {}): Promise<AuthResponse & { token?: string; expiresAt?: number }> => {
    const response = await api.post('/forms/generate-token', payload);
    return response.data;
  },

  updateProfile: async (data: Partial<Pick<User, 'first_name' | 'last_name' | 'company_name' | 'profile_photo'>>): Promise<AuthResponse> => {
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

  requestChangePhone: async (new_phone: string): Promise<AuthResponse> => {
    const response = await api.post('/user/change-phone/request', { new_phone });
    return response.data;
  },

  verifyChangePhone: async (otp: string, new_phone: string): Promise<AuthResponse> => {
    const response = await api.post('/user/change-phone/verify', { otp, new_phone });
    return response.data;
  },
};

export default api;
