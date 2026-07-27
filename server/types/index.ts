import type { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
  rawBody?: string;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  is_verified: boolean;
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
