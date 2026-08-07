import { Request, Response } from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { config } from '../config/index.js';
import { getSupabaseAdmin } from '../lib/supabaseAdmin.js';
import { normalizePhone, sendWhatsAppOtp, verifyWhatsAppOtp, WhatsAppOtpError } from '../services/whatsapp.js';

export async function sendWhatsAppOTP(req: Request, res: Response) {
  const phone = normalizePhone(req.body?.phone);
  if (!phone) return res.status(400).json({ success: false, message: 'Please provide a valid mobile number.' });
  try {
    await sendWhatsAppOtp(phone);
    return res.json({ success: true, message: 'WhatsApp OTP sent successfully' });
  } catch (error) {
    if (error instanceof WhatsAppOtpError) return res.status(error.status).json({ success: false, message: error.message });
    return res.status(500).json({ success: false, message: 'Unable to send WhatsApp OTP right now. Please try again.' });
  }
}

export async function verifyWhatsAppOTP(req: Request, res: Response) {
  const phone = normalizePhone(req.body?.phone);
  const otp = typeof req.body?.otp === 'string' ? req.body.otp.trim() : '';
  if (!phone) return res.status(400).json({ success: false, message: 'Please provide a valid mobile number.' });
  if (!/^\d{6}$/.test(otp)) return res.status(400).json({ success: false, message: 'Please provide a valid 6-digit OTP.' });
  try {
    console.info('[WhatsApp OTP] Verify request', { phone, otp });
    verifyWhatsAppOtp(phone, otp);
    console.info('[WhatsApp OTP] OTP verified, querying user record', { phoneSuffix: phone.slice(-4) });
    const supabase = getSupabaseAdmin();

    const { data: existingUser, error: selectError } = await supabase.from('users').select('*').eq('phone', phone).single();
    if (selectError && selectError.code !== 'PGRST116') {
      console.error('[WhatsApp OTP] User lookup failed', { phoneSuffix: phone.slice(-4), selectError });
      if (selectError.code === '42703' && String(selectError.message).includes('users.phone does not exist')) {
        return res.status(500).json({
          success: false,
          message: 'Database schema issue: users.phone column is missing. Apply the phone-auth migration or add the phone field to the users table.',
        });
      }
      throw selectError;
    }

    let user = existingUser;
    if (!user) {
      const { data, error } = await supabase.from('users').insert({ phone, phone_verified: true, is_verified: true }).select('*').single();
      if (error) {
        console.error('[WhatsApp OTP] User insert failed', { phoneSuffix: phone.slice(-4), error });
        throw error;
      }
      user = data;
      console.info('[WhatsApp OTP] New user created', { phoneSuffix: phone.slice(-4), userId: user.id });
    } else if (!user.phone_verified || !user.is_verified) {
      const { data, error } = await supabase.from('users').update({ phone_verified: true, is_verified: true }).eq('id', user.id).select('*').single();
      if (error) {
        console.error('[WhatsApp OTP] User update failed', { phoneSuffix: phone.slice(-4), userId: user.id, error });
        throw error;
      }
      user = data;
      console.info('[WhatsApp OTP] Existing user updated', { phoneSuffix: phone.slice(-4), userId: user.id });
    }

    const token = jwt.sign({ id: user.id, email: user.email || null, phone: user.phone }, config.jwt.secret, { expiresIn: config.jwt.expiresIn } as SignOptions);
    console.info('[WhatsApp OTP] Authentication succeeded', { phoneSuffix: phone.slice(-4), existingUser: Boolean(existingUser) });
    return res.json({ success: true, token, user });
  } catch (error) {
    if (error instanceof WhatsAppOtpError) return res.status(error.status).json({ success: false, message: error.message });
    console.error('[WhatsApp OTP] Verification failed', { phoneSuffix: phone.slice(-4), error: error instanceof Error ? error.message : String(error) });
    return res.status(500).json({ success: false, message: 'Unable to verify WhatsApp OTP right now. Please try again.' });
  }
}
