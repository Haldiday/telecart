import { Request, Response } from 'express';
import { getSupabaseAdmin } from '../lib/supabaseAdmin.js';
import { MSG91Service } from '../services/msg91.js';
import { validateEmail } from '../utils/index.js';
import type { AuthRequest, User } from '../types/index.js';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { config } from '../config/index.js';

const msg91Service = new MSG91Service();

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

    const { full_name, company_name, profile_photo } = req.body;

    // Validate inputs
    if (full_name !== undefined && (typeof full_name !== 'string' || full_name.length < 2 || full_name.length > 60)) {
      return res.status(400).json({ success: false, message: 'Full name must be between 2 and 60 characters' });
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
      .update({ full_name, company_name, profile_photo })
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

    if (!validateEmail(new_email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    // Check if new email is already registered
    const supabase = getSupabaseAdmin();
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', new_email)
      .single();

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'This email is already registered' });
    }

    // Get current user's email
    const { data: currentUser } = await supabase
      .from('users')
      .select('email')
      .eq('id', req.user.id)
      .single();

    if (!currentUser) throw new Error('User not found');

    // Send OTP to CURRENT email, NOT new email!
    await msg91Service.sendOTP(currentUser.email);

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

    if (!validateEmail(new_email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    // Get current user's email
    const supabase = getSupabaseAdmin();
    const { data: currentUser } = await supabase
      .from('users')
      .select('email')
      .eq('id', req.user.id)
      .single();

    if (!currentUser) throw new Error('User not found');

    // Verify OTP with current email
    await msg91Service.verifyOTP(currentUser.email, otp);

    // Check if new email is already registered again (just in case)
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', new_email)
      .single();

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'This email is already registered' });
    }

    // Update user's email
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({ email: new_email })
      .eq('id', req.user.id)
      .select('*')
      .single();

    if (error) throw error;

    // Generate new JWT token with updated email
    const signOptions = { expiresIn: config.jwt.expiresIn } as SignOptions;
    const newToken = jwt.sign(
      { id: updatedUser.id, email: updatedUser.email },
      config.jwt.secret,
      signOptions
    );

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
