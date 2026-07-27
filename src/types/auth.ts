export interface User {
  id: string;
  email: string;
  full_name?: string;
  company_name?: string;
  profile_photo?: string;
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
