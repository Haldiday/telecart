import { Request, Response } from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { config } from '../config/index.js';
import { MSG91Service } from '../services/msg91.js';
import { EmailValidationService, EmailValidationServiceError } from '../services/emailValidation.js';
import { getSupabaseAdmin } from '../lib/supabaseAdmin.js';
import { validateEmail, validateOTP } from '../utils/index.js';
import type { AuthRequest, User } from '../types/index.js';

const msg91Service = new MSG91Service();
const emailValidationService = new EmailValidationService();

export const sendEmailOTP = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim() : '';

    if (!validateEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.',
      });
    }

    const validationResult = await emailValidationService.validateEmail(normalizedEmail);

    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid business email address.',
      });
    }

    if (validationResult.isDisposable) {
      console.warn('[OTP Request Blocked]', {
        email: normalizedEmail,
        reason: 'disposable_or_invalid_email',
        validation: validationResult,
      });
      return res.status(400).json({
        success: false,
        message: 'Temporary or disposable email addresses are not allowed.',
      });
    }

    console.info('[OTP Request Allowed]', {
      email: normalizedEmail,
      reason: 'passed_email_validation',
      validation: validationResult,
    });

    await msg91Service.sendOTP(normalizedEmail);

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
    });
  } catch (error) {
    console.error('Error sending email OTP:', error);
    if (error instanceof EmailValidationServiceError) {
      return res.status(503).json({
        success: false,
        message: error.message,
      });
    }

    const message = error instanceof Error ? error.message : 'Failed to send OTP';
    return res.status(500).json({
      success: false,
      message,
    });
  }
};

export const verifyEmailOTP = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    if (!validateOTP(otp)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid OTP',
      });
    }

    await msg91Service.verifyOTP(email, otp);

    const supabase = getSupabaseAdmin();

    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    let user: User;

    if (!existingUser) {
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          email: email,
          is_verified: true,
        })
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      user = newUser!;
    } else {
      if (!existingUser.is_verified) {
        const { data: updatedUser } = await supabase
          .from('users')
          .update({ is_verified: true })
          .eq('id', existingUser.id)
          .select('*')
          .single();

        user = updatedUser!;
      } else {
        user = existingUser;
      }
    }

    const signOptions = {
      expiresIn: config.jwt.expiresIn,
    } as SignOptions;

    const token = jwt.sign(
      { id: user.id, email: user.email },
      config.jwt.secret,
      signOptions
    );

    return res.status(200).json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    console.error('Error verifying email OTP:', error);
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired OTP',
    });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const supabase = getSupabaseAdmin();

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
    });
  }
};

export const logout = async (_req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};
