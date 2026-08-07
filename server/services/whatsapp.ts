import axios from 'axios';
import { randomInt } from 'crypto';

const DEFAULT_API_URL = 'https://adminapis.backendprod.com/lms_campaign/api/whatsapp/template/54p9v2sbfn/process';
const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const otpStore = new Map<string, { otp: string; expiresAt: number; attempts: number }>();
const requestStore = new Map<string, number[]>();

export function normalizePhone(phone: unknown): string | null {
  const value = String(phone || '').trim().replace(/[\s()-]/g, '');
  let normalized: string;

  if (/^\d{10}$/.test(value)) {
    normalized = `+91${value}`;
  } else if (/^0\d{10}$/.test(value)) {
    normalized = `+91${value.slice(1)}`;
  } else if (/^00\d+$/.test(value)) {
    normalized = `+${value.slice(2)}`;
  } else if (value.startsWith('+')) {
    normalized = value;
  } else {
    normalized = `+${value}`;
  }

  return /^\+[1-9]\d{9,14}$/.test(normalized) ? normalized : null;
}

export class WhatsAppOtpError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'WhatsAppOtpError';
  }
}

export async function sendWhatsAppOtp(phone: string): Promise<void> {
  const now = Date.now();
  const recentRequests = (requestStore.get(phone) || []).filter((timestamp) => timestamp > now - 15 * 60 * 1000);
  if (recentRequests.length >= 3) {
    requestStore.set(phone, recentRequests);
    throw new WhatsAppOtpError('Too many OTP requests. Please try again later.', 429);
  }
  recentRequests.push(now);
  requestStore.set(phone, recentRequests);
  const apiUrl = (process.env.WHATSAPP_API_URL || DEFAULT_API_URL).trim();
  const whatsappApiKey = process.env.WHATSAPP_API_KEY?.trim();
  const authToken = process.env.WHATSAPP_AUTH_TOKEN?.trim();

  const headers: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' };
  if (whatsappApiKey) headers['api-key'] = whatsappApiKey;
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const maskedHeaders = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [
      key,
      typeof value === 'string' && /api-key|authorization/i.test(key) ? '***' : value,
    ])
  );

  const otp = String(randomInt(100000, 1000000));
  otpStore.set(phone, { otp, expiresAt: Date.now() + OTP_TTL_MS, attempts: 0 });
  const requestBody: Record<string, unknown> = { receiver: phone, values: { 1: otp } };

  try {
    console.info('[WhatsApp OTP] Sending template request', {
      requestUrl: apiUrl,
      method: 'POST',
      headers: maskedHeaders,
      body: requestBody,
    });
    const response = await axios.post(apiUrl, requestBody, { headers, timeout: 10_000 });
    const data = response.data;
    console.info('[WhatsApp OTP] Template request response', { status: response.status, body: data });

    const validResponse =
      data?.messaging_product === 'whatsapp' &&
      Array.isArray(data?.contacts) &&
      data.contacts.length > 0 &&
      Array.isArray(data?.messages) &&
      data.messages[0]?.message_status === 'accepted';

    if (!validResponse) {
      console.error('[WhatsApp OTP] Unexpected Emovur response', { responseBody: data });
      throw new WhatsAppOtpError('Unable to send WhatsApp OTP right now. Please try again.', 502);
    }

    console.info('[WhatsApp OTP] Template request accepted', { status: response.status, phoneSuffix: phone.slice(-4) });
  } catch (error: any) {
    otpStore.delete(phone);
    console.error('[WhatsApp OTP] Template request failed', {
      status: error.response?.status,
      body: error.response?.data,
      phoneSuffix: phone.slice(-4),
      error: error.message,
    });
    throw new WhatsAppOtpError(error.code === 'ECONNABORTED' ? 'WhatsApp OTP request timed out. Please try again.' : 'Unable to send WhatsApp OTP right now. Please try again.', error.code === 'ECONNABORTED' ? 503 : 502);
  }
}


export function verifyWhatsAppOtp(phone: string, otp: string): void {
  console.info('[WhatsApp OTP] Verifying OTP', { phoneSuffix: phone.slice(-4), otp });
  const entry = otpStore.get(phone);
  console.info('[WhatsApp OTP] Stored OTP entry', {
    phoneSuffix: phone.slice(-4),
    entry: entry ? { ...entry, otp: '***' } : null,
  });

  if (!entry || entry.expiresAt <= Date.now()) {
    otpStore.delete(phone);
    console.warn('[WhatsApp OTP] OTP invalid or expired', { phoneSuffix: phone.slice(-4) });
    throw new WhatsAppOtpError('Invalid or expired OTP', 400);
  }
  if (entry.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(phone);
    console.warn('[WhatsApp OTP] OTP too many attempts', { phoneSuffix: phone.slice(-4) });
    throw new WhatsAppOtpError('Too many incorrect OTP attempts. Please request a new code.', 429);
  }
  if (entry.otp !== otp) {
    entry.attempts += 1;
    console.warn('[WhatsApp OTP] OTP mismatch', { phoneSuffix: phone.slice(-4), providedOtp: otp, expectedOtp: '***', attempts: entry.attempts });
    throw new WhatsAppOtpError('Invalid or expired OTP', 400);
  }
  otpStore.delete(phone);
  console.info('[WhatsApp OTP] OTP verified successfully', { phoneSuffix: phone.slice(-4) });
}
