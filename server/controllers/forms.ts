import type { Response } from 'express';
import { createZohoPrefillToken, consumeZohoPrefillToken } from '../lib/zohoPrefill.js';
import { getSupabaseAdmin } from '../lib/supabaseAdmin.js';
import type { AuthRequest } from '../types/index.js';

const DEFAULT_TTL_MS = 5 * 60 * 1000;
const MIN_TTL_MS = 2 * 60 * 1000;
const MAX_TTL_MS = 5 * 60 * 1000;

function isHttpsRequest(req: AuthRequest) {
  if (req.secure) return true;
  const forwardedProto = req.headers['x-forwarded-proto'];
  if (typeof forwardedProto === 'string') {
    return forwardedProto.toLowerCase() === 'https';
  }

  return req.hostname === 'localhost' || req.hostname === '127.0.0.1';
}

export const generateZohoPrefillToken = async (req: AuthRequest, res: Response) => {
  try {
    console.log('generateZohoPrefillToken route entered');
    console.log('headers:', JSON.stringify(req.headers));
    console.log('body:', JSON.stringify(req.body));
    console.log('user:', req.user);

    if (!req.user) {
      console.log('generateZohoPrefillToken: missing req.user');
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!isHttpsRequest(req) && process.env.NODE_ENV === 'production') {
      console.log('generateZohoPrefillToken: HTTPS required');
      return res.status(403).json({ success: false, message: 'HTTPS is required' });
    }

    const rawTtl = req.body?.ttlMs;
    const ttlMs = typeof rawTtl === 'number' && Number.isFinite(rawTtl)
      ? Math.min(MAX_TTL_MS, Math.max(MIN_TTL_MS, Math.round(rawTtl)))
      : DEFAULT_TTL_MS;

    const reqName = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const reqCompanyName = typeof req.body?.companyName === 'string' ? req.body.companyName.trim() : '';
    const reqFirstName = typeof req.body?.firstName === 'string' ? req.body.firstName.trim() : '';
    const reqLastName = typeof req.body?.lastName === 'string' ? req.body.lastName.trim() : '';

    let profile: { email?: string | null; full_name?: string | null; company_name?: string | null; phone?: string | null; first_name?: string | null; last_name?: string | null } | null = null;

    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from('users')
        .select('email, full_name, company_name, phone, first_name, last_name')
        .eq('id', req.user.id)
        .single();

      if (!error) {
        profile = data;
      }
    } catch (profileError) {
      console.warn('Unable to load user profile while generating Zoho token, continuing with request data', profileError);
    }

    const record = await createZohoPrefillToken({
      userId: req.user.id,
      name: reqName || profile?.full_name || '',
      email: profile?.email || req.user.email || '',
      companyName: reqCompanyName || profile?.company_name || '',
      phone: profile?.phone ?? null,
      firstName: reqFirstName || (profile?.first_name ?? null),
      lastName: reqLastName || (profile?.last_name ?? null),
      ttlMs,
    });

    console.log('Zoho token created:', record);

    return res.status(200).json({
      success: true,
      token: record.token,
      expiresAt: record.expiresAt,
      message: 'Zoho prefill token generated successfully',
    });
  } catch (error) {
    console.error('Error generating Zoho prefill token:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate Zoho prefill token' });
  }
};

export const prefillZohoForm = async (req: AuthRequest, res: Response) => {
  try {
    if (!isHttpsRequest(req) && process.env.NODE_ENV === 'production') {
      return res.status(403).json({ success: false, message: 'HTTPS is required' });
    }

    const tokenCandidate = req.query?.token ?? req.body?.token;
    const token = typeof tokenCandidate === 'string' ? tokenCandidate : undefined;
    console.log('Zoho prefill request received:');
    console.log('  headers:', JSON.stringify(req.headers, null, 2));
    console.log('  query:', JSON.stringify(req.query, null, 2));
    console.log('  body:', JSON.stringify(req.body, null, 2));
    console.log('  rawBody:', req.rawBody ?? '<empty>');
    console.log('  token candidate:', tokenCandidate);
    const payload = await consumeZohoPrefillToken(token);

    if (!payload) {
      console.warn('Zoho prefill failed: invalid or expired token', { token });
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    console.log('Zoho prefill payload returned:', payload);
    return res.status(200).json(payload);
  } catch (error) {
    console.error('Error pre-filling Zoho form:', error);
    return res.status(500).json({ success: false, message: 'Failed to prefill Zoho form data' });
  }
};
