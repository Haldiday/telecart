import { Request, Response } from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { config } from '../config/index.js';
import { MSG91Service } from '../services/msg91.js';
import { EmailValidationService, EmailValidationServiceError } from '../services/emailValidation.js';
import { getSupabaseAdmin } from '../lib/supabaseAdmin.js';
import { normalizePhone, sendWhatsAppOtp, verifyWhatsAppOtp, WhatsAppOtpError } from '../services/whatsapp.js';
import { validateEmail, validateOTP, validatePhone } from '../utils/index.js';
import type { AuthRequest, User } from '../types/index.js';

const msg91Service = new MSG91Service();
const emailValidationService = new EmailValidationService();
const pendingSignupStates = new Map<string, {
  first_name: string;
  last_name: string;
  company_name: string;
  email: string;
  phone: string;
  email_verified: boolean;
  phone_verified: boolean;
}>();

function normalizeSignupStateEmail(email: string) {
  return String(email || '').trim().toLowerCase();
}

const pendingSignupStateKey = {
  email: (email: string) => `email:${email}`,
  phone: (phone: string) => `phone:${phone}`,
};

function findPendingSignupStateByEmail(email: string) {
  const normalizedEmail = normalizeSignupStateEmail(email);
  return normalizedEmail ? pendingSignupStates.get(pendingSignupStateKey.email(normalizedEmail)) : null;
}

function findPendingSignupStateByPhone(phone: string) {
  const normalizedPhone = normalizePhone(phone);
  return normalizedPhone ? pendingSignupStates.get(pendingSignupStateKey.phone(normalizedPhone)) : null;
}

function savePendingSignupState(state: {
  first_name: string;
  last_name: string;
  company_name: string;
  email: string;
  phone: string;
  email_verified: boolean;
  phone_verified: boolean;
}) {
  const emailKey = state.email ? pendingSignupStateKey.email(state.email) : null;
  const phoneKey = state.phone ? pendingSignupStateKey.phone(state.phone) : null;

  if (emailKey) {
    pendingSignupStates.set(emailKey, state);
  }
  if (phoneKey) {
    pendingSignupStates.set(phoneKey, state);
  }

  return state;
}

function mergePendingSignupState(payload: { email?: string; phone?: string } & Partial<{
  first_name: string;
  last_name: string;
  company_name: string;
  email_verified: boolean;
  phone_verified: boolean;
}>) {
  const normalizedEmail = normalizeSignupStateEmail(payload.email || '');
  const normalizedPhone = normalizePhone(payload.phone || '');
  const emailKey = normalizedEmail ? pendingSignupStateKey.email(normalizedEmail) : null;
  const phoneKey = normalizedPhone ? pendingSignupStateKey.phone(normalizedPhone) : null;

  const emailState = emailKey ? pendingSignupStates.get(emailKey) : null;
  const phoneState = phoneKey ? pendingSignupStates.get(phoneKey) : null;

  const baseState = emailState || phoneState || {
    first_name: '',
    last_name: '',
    company_name: '',
    email: normalizedEmail || '',
    phone: normalizedPhone || '',
    email_verified: false,
    phone_verified: false,
  };

  const mergedState = {
    ...baseState,
    ...payload,
    email: normalizedEmail || baseState.email,
    phone: normalizedPhone || baseState.phone,
  };

  if (emailState && phoneState && emailState !== phoneState) {
    if (emailKey) pendingSignupStates.delete(emailKey);
    if (phoneKey) pendingSignupStates.delete(phoneKey);
  }

  return savePendingSignupState(mergedState);
}

function createAuthToken(user: User) {
  const signOptions = {
    expiresIn: config.jwt.expiresIn,
  } as SignOptions;

  return jwt.sign(
    { id: user.id, email: user.email || null, phone: user.phone || null },
    config.jwt.secret,
    signOptions
  );
}

async function getUserByEmail(email: string): Promise<User | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data as User | null;
}

async function getUserByPhone(phone: string): Promise<User | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('phone', phone)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data as User | null;
}

function validateSignupPayload(body: Record<string, unknown>) {
  const first_name = String(body.first_name || '').trim();
  const last_name = String(body.last_name || '').trim();
  const company_name = String(body.company_name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const phone = normalizePhone(body.phone);

  if (!first_name || first_name.length < 2) {
    return { error: 'Please enter a valid first name.' };
  }

  if (!last_name || last_name.length < 2) {
    return { error: 'Please enter a valid last name.' };
  }

  if (!company_name || company_name.length < 2) {
    return { error: 'Please enter a valid company name.' };
  }

  if (!validateEmail(email)) {
    return { error: 'Please provide a valid email address.' };
  }

  if (!phone || !validatePhone(phone)) {
    return { error: 'Please provide a valid phone number.' };
  }

  return { first_name, last_name, company_name, email, phone };
}

function validateEmailOnlyPayload(body: Record<string, unknown>) {
  const email = String(body.email || '').trim().toLowerCase();

  if (!validateEmail(email)) {
    return { error: 'Please provide a valid email address.' };
  }

  return { email };
}

function validatePhoneOnlyPayload(body: Record<string, unknown>) {
  const phone = normalizePhone(body.phone);

  if (!phone || !validatePhone(phone)) {
    return { error: 'Please provide a valid phone number.' };
  }

  return { phone };
}

export const signupCheckUser = async (req: Request, res: Response) => {
  try {
    const payload = validateSignupPayload(req.body);
    if ('error' in payload) {
      return res.status(400).json({ success: false, message: payload.error });
    }

    const existingEmailUser = await getUserByEmail(payload.email);
    if (existingEmailUser) {
      return res.status(409).json({
        success: false,
        message: 'This email is already registered. Please login.',
        flow: 'login',
      });
    }

    const existingPhoneUser = await getUserByPhone(payload.phone);
    if (existingPhoneUser) {
      return res.status(409).json({
        success: false,
        message: 'This phone number is already registered. Please login.',
        flow: 'login',
      });
    }

    pendingSignupStates.set(payload.email, {
      first_name: payload.first_name,
      last_name: payload.last_name,
      company_name: payload.company_name,
      email: payload.email,
      phone: payload.phone,
      email_verified: false,
      phone_verified: false,
    });

    return res.status(200).json({
      success: true,
      message: 'User profile is ready for verification.',
    });
  } catch (error) {
    console.error('Error checking signup user:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to validate your account details right now. Please try again.',
    });
  }
};

export const signupSendEmailOTP = async (req: Request, res: Response) => {
  try {
    const payload = validateEmailOnlyPayload(req.body);
    if ('error' in payload) {
      return res.status(400).json({ success: false, message: payload.error });
    }

    const existingEmailUser = await getUserByEmail(payload.email);
    if (existingEmailUser) {
      return res.status(409).json({
        success: false,
        message: 'This email is already registered. Please login.',
        flow: 'login',
      });
    }

    const phone = normalizePhone(req.body.phone);
    const state = mergePendingSignupState({ email: payload.email, phone, email_verified: false });

    const validationResult = await emailValidationService.validateEmail(payload.email);
    if (validationResult.isDisposable) {
      return res.status(400).json({
        success: false,
        message: 'Please enter valid email.',
      });
    }

    await msg91Service.sendOTP(payload.email);
    return res.status(200).json({ success: true, message: 'Email OTP sent successfully.' });
  } catch (error) {
    console.error('Error sending signup email OTP:', error);
    if (error instanceof EmailValidationServiceError) {
      return res.status(503).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'Unable to send email OTP right now. Please try again.' });
  }
};

export const signupVerifyEmailOTP = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = normalizeSignupStateEmail(email);

    if (!validateEmail(normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }
    if (!validateOTP(String(otp || ''))) {
      return res.status(400).json({ success: false, message: 'Please provide a valid OTP.' });
    }

    await msg91Service.verifyOTP(normalizedEmail, String(otp));

    const state = findPendingSignupStateByEmail(normalizedEmail);
    if (!state) {
      return res.status(400).json({ success: false, message: 'Signup session is missing. Please start from the beginning.' });
    }

    state.email_verified = true;
    savePendingSignupState(state);

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully.',
      email: normalizedEmail,
    });
  } catch (error) {
    console.error('Error verifying signup email OTP:', error);
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Invalid or expired OTP.' });
  }
};

export const signupSendPhoneOTP = async (req: Request, res: Response) => {
  try {
    const payload = validatePhoneOnlyPayload(req.body);
    if ('error' in payload) {
      return res.status(400).json({ success: false, message: payload.error });
    }

    const existingPhoneUser = await getUserByPhone(payload.phone);
    if (existingPhoneUser) {
      return res.status(409).json({
        success: false,
        message: 'This phone number is already registered. Please login.',
        flow: 'login',
      });
    }

    const email = String(req.body.email || '').trim().toLowerCase();
    mergePendingSignupState({ email, phone: payload.phone, phone_verified: false });

    await sendWhatsAppOtp(payload.phone);
    return res.status(200).json({ success: true, message: 'Phone OTP sent successfully.' });
  } catch (error) {
    console.error('Error sending signup phone OTP:', error);
    if (error instanceof WhatsAppOtpError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'Unable to send phone OTP right now. Please try again.' });
  }
};

export const signupVerifyPhoneOTP = async (req: Request, res: Response) => {
  try {
    const { phone, otp } = req.body;
    const normalizedPhone = normalizePhone(phone);

    if (!normalizedPhone || !validateOTP(String(otp || ''))) {
      return res.status(400).json({ success: false, message: 'Please provide a valid phone number and OTP.' });
    }

    verifyWhatsAppOtp(normalizedPhone, String(otp));

    const state = findPendingSignupStateByPhone(normalizedPhone);
    if (!state) {
      return res.status(400).json({ success: false, message: 'Signup session is missing. Please start from the beginning.' });
    }

    state.phone = normalizedPhone;
    state.phone_verified = true;
    savePendingSignupState(state);

    return res.status(200).json({ success: true, message: 'Phone verified successfully.' });
  } catch (error) {
    console.error('Error verifying signup phone OTP:', error);
    if (error instanceof WhatsAppOtpError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Invalid or expired OTP.' });
  }
};

export const signupComplete = async (req: Request, res: Response) => {
  try {
    const payload = validateSignupPayload(req.body);
    if ('error' in payload) {
      return res.status(400).json({ success: false, message: payload.error });
    }

    const state = findPendingSignupStateByEmail(payload.email) || findPendingSignupStateByPhone(payload.phone);
    if (!state || !state.email_verified || !state.phone_verified) {
      return res.status(400).json({ success: false, message: 'Please complete both email and phone OTP verification before creating your account.' });
    }

    const supabase = getSupabaseAdmin();
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', payload.email)
      .maybeSingle();

    if (existingUser) {
      return res.status(409).json({ success: false, message: 'This email is already registered. Please login.' });
    }

    const { data: createdUser, error } = await supabase
      .from('users')
      .insert({
        first_name: payload.first_name,
        last_name: payload.last_name,
        company_name: payload.company_name,
        email: payload.email,
        phone: payload.phone,
        email_verified: true,
        phone_verified: true,
        is_verified: true,
      })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    if (payload.email) {
      pendingSignupStates.delete(pendingSignupStateKey.email(payload.email));
    }
    if (payload.phone) {
      pendingSignupStates.delete(pendingSignupStateKey.phone(payload.phone));
    }

    const token = createAuthToken(createdUser as User);
    return res.status(201).json({
      success: true,
      token,
      user: createdUser,
      message: 'Account created successfully.',
    });
  } catch (error) {
    console.error('Error completing signup:', error);
    return res.status(500).json({ success: false, message: 'Unable to create your account right now. Please try again.' });
  }
};

export const sendEmailOTP = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!validateEmail(normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    const existingUser = await getUserByEmail(normalizedEmail);
    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'This email is not registered. Please create an account first.' });
    }

    const validationResult = await emailValidationService.validateEmail(normalizedEmail);
    if (validationResult.isDisposable) {
      return res.status(400).json({ success: false, message: 'Please enter valid email.' });
    }

    await msg91Service.sendOTP(normalizedEmail);
    return res.status(200).json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending email OTP:', error);
    if (error instanceof EmailValidationServiceError) {
      return res.status(503).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Failed to send OTP' });
  }
};

export const verifyEmailOTP = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!validateEmail(normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    if (!validateOTP(String(otp || ''))) {
      return res.status(400).json({ success: false, message: 'Please provide a valid OTP.' });
    }

    await msg91Service.verifyOTP(normalizedEmail, String(otp));
    const existingUser = await getUserByEmail(normalizedEmail);

    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'This email is not registered. Please create an account first.' });
    }

    const token = createAuthToken(existingUser);
    return res.status(200).json({ success: true, token, user: existingUser });
  } catch (error) {
    console.error('Error verifying email OTP:', error);
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Invalid or expired OTP' });
  }
};

export const sendPhoneOTP = async (req: Request, res: Response) => {
  try {
    const phone = normalizePhone(req.body?.phone);
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Please provide a valid mobile number.' });
    }

    const existingUser = await getUserByPhone(phone);
    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'This phone number is not registered. Please create an account first.' });
    }

    await sendWhatsAppOtp(phone);
    return res.status(200).json({ success: true, message: 'Phone OTP sent successfully.' });
  } catch (error) {
    console.error('Error sending phone OTP:', error);
    if (error instanceof WhatsAppOtpError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'Unable to send phone OTP right now. Please try again.' });
  }
};

export const verifyPhoneOTP = async (req: Request, res: Response) => {
  try {
    const phone = normalizePhone(req.body?.phone);
    const otp = String(req.body?.otp || '');
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Please provide a valid mobile number.' });
    }
    if (!validateOTP(otp)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid OTP.' });
    }

    verifyWhatsAppOtp(phone, otp);
    const existingUser = await getUserByPhone(phone);
    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'This phone number is not registered. Please create an account first.' });
    }

    const token = createAuthToken(existingUser);
    return res.status(200).json({ success: true, token, user: existingUser });
  } catch (error) {
    console.error('Error verifying phone OTP:', error);
    if (error instanceof WhatsAppOtpError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Invalid or expired OTP.' });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
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

    if (error) {
      throw error;
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
};

export const logout = async (_req: Request, res: Response) => {
  return res.status(200).json({ success: true, message: 'Logged out successfully' });
};
