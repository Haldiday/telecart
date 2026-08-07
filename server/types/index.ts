import type { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string | null;
    phone?: string | null;
  };
  rawBody?: string;
}

export interface User {
  id: string;
  email?: string | null;
  phone?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  company_name?: string | null;
  full_name?: string | null;
  email_verified?: boolean;
  phone_verified?: boolean;
  is_verified?: boolean;
  profile_photo?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
}

export interface SendOTPRequest {
  email: string;
}

export interface VerifyOTPRequest {
  email: string;
  otp: string;
}

export interface SignupCheckRequest {
  first_name: string;
  last_name: string;
  company_name: string;
  email: string;
  phone: string;
}

export interface SignupCompleteRequest {
  first_name: string;
  last_name: string;
  company_name: string;
  email: string;
  phone: string;
}
