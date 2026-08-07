import { Request, Response } from 'express';
import { getSupabaseAdmin } from '../lib/supabaseAdmin.js';
import { MSG91Service } from '../services/msg91.js';
import { normalizePhone, sendWhatsAppOtp, verifyWhatsAppOtp, WhatsAppOtpError } from '../services/whatsapp.js';
import { validateEmail, validateOTP, validatePhone } from '../utils/index.js';
import type { AuthRequest, User } from '../types/index.js';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { config } from '../config/index.js';

const msg91Service = new MSG91Service();

function createAuthToken(user: User) {
  const signOptions = { expiresIn: config.jwt.expiresIn } as SignOptions;
  return jwt.sign({ id: user.id, email: user.email || null, phone: user.phone || null }, config.jwt.secret, signOptions);
}

// GET /api/user/profile
export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const supabase = getSupabaseAdmin();
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
};

// PUT /api/user/profile
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const { first_name, last_name, company_name, profile_photo } = req.body;

    if (first_name !== undefined && (typeof first_name !== 'string' || first_name.length < 2 || first_name.length > 60)) {
      return res.status(400).json({ success: false, message: 'First name must be between 2 and 60 characters' });
    }

    if (last_name !== undefined && (typeof last_name !== 'string' || last_name.length < 2 || last_name.length > 60)) {
      return res.status(400).json({ success: false, message: 'Last name must be between 2 and 60 characters' });
    }

    if (company_name !== undefined && typeof company_name !== 'string') {
      return res.status(400).json({ success: false, message: 'Company name must be a string' });
    }

    if (company_name !== undefined && company_name.length > 120) {
      return res.status(400).json({ success: false, message: 'Company name must be less than or equal to 120 characters' });
    }

    const supabase = getSupabaseAdmin();
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({ first_name, last_name, company_name, profile_photo, updated_at: new Date().toISOString() })
      .eq('id', req.user.id)
      .select('*')
      .single();

    if (error) throw error;

    return res.status(200).json({ success: true, user: updatedUser, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

// POST /api/user/change-email/request
export const requestChangeEmail = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const { new_email } = req.body;
    if (!validateEmail(String(new_email || ''))) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    const supabase = getSupabaseAdmin();
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', String(new_email).trim().toLowerCase())
      .maybeSingle();

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'This email is already registered' });
    }

    const { data: currentUser } = await supabase
      .from('users')
      .select('email')
      .eq('id', req.user.id)
      .single();

    if (!currentUser) throw new Error('User not found');

    await msg91Service.sendOTP(currentUser.email!);
    return res.status(200).json({ success: true, message: 'OTP sent to your current email address' });
  } catch (error) {
    console.error('Error requesting email change:', error);
    const message = error instanceof Error ? error.message : 'Failed to send OTP';
    return res.status(500).json({ success: false, message });
  }
};

// POST /api/user/change-email/verify
export const verifyChangeEmail = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const { otp, new_email } = req.body;
    const normalizedNewEmail = String(new_email || '').trim().toLowerCase();

    if (!validateEmail(normalizedNewEmail)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }
    if (!validateOTP(String(otp || ''))) {
      return res.status(400).json({ success: false, message: 'Please provide a valid OTP' });
    }

    const supabase = getSupabaseAdmin();
    const { data: currentUser } = await supabase
      .from('users')
      .select('email')
      .eq('id', req.user.id)
      .single();

    if (!currentUser) throw new Error('User not found');

    await msg91Service.verifyOTP(currentUser.email!, String(otp));

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', normalizedNewEmail)
      .maybeSingle();

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'This email is already registered' });
    }

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({ email: normalizedNewEmail, email_verified: true, updated_at: new Date().toISOString() })
      .eq('id', req.user.id)
      .select('*')
      .single();

    if (error) throw error;

    const newToken = createAuthToken(updatedUser as User);
    return res.status(200).json({
      success: true,
      user: updatedUser,
      token: newToken,
      message: 'Email updated successfully',
    });
  } catch (error) {
    console.error('Error verifying email change:', error);
    const message = error instanceof Error ? error.message : 'Invalid or expired OTP';
    return res.status(400).json({ success: false, message });
  }
};

// POST /api/user/change-phone/request
export const requestChangePhone = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const { new_phone } = req.body;
    const normalizedPhone = normalizePhone(new_phone);

    if (!normalizedPhone || !validatePhone(normalizedPhone)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid phone number' });
    }

    const supabase = getSupabaseAdmin();
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('phone', normalizedPhone)
      .maybeSingle();

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'This phone number is already registered' });
    }

    const { data: currentUser } = await supabase
      .from('users')
      .select('phone')
      .eq('id', req.user.id)
      .single();

    if (!currentUser) throw new Error('User not found');

    await sendWhatsAppOtp(currentUser.phone!);
    return res.status(200).json({ success: true, message: 'OTP sent to your current phone number' });
  } catch (error) {
    console.error('Error requesting phone change:', error);
    if (error instanceof WhatsAppOtpError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Failed to send OTP' });
  }
};

// POST /api/user/change-phone/verify
export const verifyChangePhone = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const { otp, new_phone } = req.body;
    const normalizedPhone = normalizePhone(new_phone);
    if (!normalizedPhone || !validatePhone(normalizedPhone)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid phone number' });
    }
    if (!validateOTP(String(otp || ''))) {
      return res.status(400).json({ success: false, message: 'Please provide a valid OTP' });
    }

    const supabase = getSupabaseAdmin();
    const { data: currentUser } = await supabase
      .from('users')
      .select('phone')
      .eq('id', req.user.id)
      .single();

    if (!currentUser) throw new Error('User not found');

    verifyWhatsAppOtp(currentUser.phone!, String(otp));

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('phone', normalizedPhone)
      .maybeSingle();

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'This phone number is already registered' });
    }

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({ phone: normalizedPhone, phone_verified: true, updated_at: new Date().toISOString() })
      .eq('id', req.user.id)
      .select('*')
      .single();

    if (error) throw error;

    const newToken = createAuthToken(updatedUser as User);
    return res.status(200).json({
      success: true,
      user: updatedUser,
      token: newToken,
      message: 'Phone updated successfully',
    });
  } catch (error) {
    console.error('Error verifying phone change:', error);
    if (error instanceof WhatsAppOtpError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Invalid or expired OTP' });
  }
};
