import { randomUUID } from 'crypto';
import { getSupabaseAdmin } from './supabaseAdmin.js';

interface ZohoPrefillTokenRecord {
  token: string;
  user_id: string;
  name: string | null;
  email: string | null;
  company_name: string | null;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
  expires_at: number;
  used: boolean;
}

interface FallbackTokenRecord {
  token: string;
  userId: string;
  expiresAt: number;
  used: boolean;
  payload: ZohoPrefillPayload;
}

const fallbackTokenStore = new Map<string, FallbackTokenRecord>();

function shouldUseFallback(error: unknown) {
  if (!error) {
    return false;
  }

  const message = typeof error === 'string'
    ? error
    : error instanceof Error
      ? error.message
      : typeof (error as { message?: unknown }).message === 'string'
        ? (error as { message: string }).message
        : String(error);

  const code = typeof error === 'object' && error !== null && 'code' in error ? (error as any).code : undefined;
  const details = typeof error === 'object' && error !== null && 'details' in error ? (error as any).details : undefined;

  return message.includes('Invalid API key')
    || message.includes('Missing SUPABASE_URL')
    || message.includes('Missing SUPABASE_SERVICE_ROLE_KEY')
    || message.includes('fetch failed')
    || message.includes('Failed to fetch')
    || code === '23503'
    || String(details).includes('violates foreign key constraint');
}

export interface CreateZohoPrefillTokenInput {
  userId: string;
  name: string;
  email: string;
  companyName: string;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  ttlMs?: number;
}

export interface ZohoPrefillPayload {
  name: string | null;
  email: string | null;
  companyName: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
}

export async function createZohoPrefillToken(input: CreateZohoPrefillTokenInput) {
  const token = randomUUID();
  const ttlMs = input.ttlMs ?? 5 * 60 * 1000;
  const expiresAt = Date.now() + Math.max(1, ttlMs);
  const record = {
    token,
    user_id: input.userId,
    name: input.name ?? null,
    email: input.email ?? null,
    company_name: input.companyName ?? null,
    phone: input.phone ?? null,
    first_name: input.firstName ?? null,
    last_name: input.lastName ?? null,
    expires_at: expiresAt,
    used: false,
  };

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('zoho_prefill_tokens').insert(record);
    if (error) {
      throw error;
    }
  } catch (error) {
    const canFallback = shouldUseFallback(error);
    console.warn('[zohoPrefill] insert error, fallback?', canFallback, error);

    if (!canFallback) {
      throw error;
    }

    fallbackTokenStore.set(token, {
      token,
      userId: input.userId,
      expiresAt,
      used: false,
      payload: {
        name: input.name ?? null,
        email: input.email ?? null,
        companyName: input.companyName ?? null,
        phone: input.phone ?? null,
        firstName: input.firstName ?? null,
        lastName: input.lastName ?? null,
      },
    });
  }

  return { token, expiresAt };
}

export async function consumeZohoPrefillToken(token: string | undefined): Promise<ZohoPrefillPayload | null> {
  if (!token) {
    return null;
  }

  const fallbackRecord = fallbackTokenStore.get(token);
  if (fallbackRecord) {
    if (fallbackRecord.used || fallbackRecord.expiresAt <= Date.now()) {
      fallbackRecord.used = true;
      fallbackTokenStore.delete(token);
      return null;
    }

    fallbackRecord.used = true;
    fallbackTokenStore.delete(token);
    return fallbackRecord.payload;
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('zoho_prefill_tokens')
      .select('token, user_id, expires_at, used')
      .eq('token', token)
      .maybeSingle();

    if (error || !data || data.used) {
      return null;
    }

    const expiresAt = typeof data.expires_at === 'string'
      ? Number(data.expires_at)
      : data.expires_at;

    if (!expiresAt || expiresAt <= Date.now()) {
      await supabase.from('zoho_prefill_tokens').update({ used: true }).eq('token', token);
      return null;
    }

    const { error: updateError } = await supabase
      .from('zoho_prefill_tokens')
      .update({ used: true })
      .eq('token', token);

    if (updateError) {
      throw updateError;
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('email, full_name, company_name, phone, first_name, last_name')
      .eq('id', data.user_id)
      .single();

    if (profileError || !profile) {
      throw profileError || new Error('Unable to load user profile from Supabase');
    }

    return {
      name: profile.full_name ?? null,
      email: profile.email ?? null,
      companyName: profile.company_name ?? null,
      phone: profile.phone ?? null,
      firstName: profile.first_name ?? null,
      lastName: profile.last_name ?? null,
    };
  } catch (error) {
    if (!shouldUseFallback(error)) {
      throw error;
    }

    return null;
  }
}

export async function clearZohoPrefillTokens() {
  fallbackTokenStore.clear();

  try {
    await getSupabaseAdmin().from('zoho_prefill_tokens').delete().neq('token', '');
  } catch {
    // Ignore Supabase cleanup errors in local fallback mode.
  }
}

export async function seedExpiredZohoPrefillToken(token: string, record: Omit<ZohoPrefillTokenRecord, 'token'>) {
  try {
    await getSupabaseAdmin().from('zoho_prefill_tokens').insert({ ...record, token });
  } catch (error) {
    if (!shouldUseFallback(error)) {
      throw error;
    }

    fallbackTokenStore.set(token, {
      token,
      userId: record.user_id,
      expiresAt: record.expires_at,
      used: false,
      payload: {
        name: record.name ?? null,
        email: record.email ?? null,
        companyName: record.company_name ?? null,
        phone: record.phone ?? null,
        firstName: record.first_name ?? null,
        lastName: record.last_name ?? null,
      },
    });
  }
}
