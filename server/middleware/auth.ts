import type { Request, Response, NextFunction } from 'express';
import { getSupabaseAdmin } from '../lib/supabaseAdmin.js';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  isAdmin?: boolean;
  actor?: {
    id: string;
    email: string | null;
    name: string | null;
  };
  requestId?: string;
}

export async function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const token = extractBearerToken(req);
  if (!token) {
    next();
    return;
  }

  try {
    const { data, error } = await getSupabaseAdmin().auth.getUser(token);
    if (error || !data.user) {
      next();
      return;
    }

    req.userId = data.user.id;
    req.isAdmin = await checkIsAdmin(data.user.id);
    req.actor = getActor(data.user);
  } catch {
    // Ignore invalid tokens for optional auth
  }

  next();
}

export async function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = extractBearerToken(req);
  if (!token) {
    res.status(401).json({ data: null, error: { message: 'Authentication required', code: 'UNAUTHORIZED' } });
    return;
  }

  const { data, error } = await getSupabaseAdmin().auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json({ data: null, error: { message: 'Invalid or expired token', code: 'UNAUTHORIZED' } });
    return;
  }

  const isAdmin = await checkIsAdmin(data.user.id);
  if (!isAdmin) {
    res.status(403).json({ data: null, error: { message: 'Admin access required', code: 'FORBIDDEN' } });
    return;
  }

  req.userId = data.user.id;
  req.isAdmin = true;
  req.actor = getActor(data.user);
  next();
}

function getActor(user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> | null }) {
  const metadata = user.user_metadata ?? {};
  const candidate = metadata.full_name ?? metadata.name ?? [metadata.first_name, metadata.last_name].filter(Boolean).join(' ');
  return {
    id: user.id,
    email: user.email ?? null,
    name: typeof candidate === 'string' && candidate.trim() ? candidate.trim() : null,
  };
}

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7);
}

async function checkIsAdmin(userId: string): Promise<boolean> {
  const { data } = await getSupabaseAdmin()
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle();

  return !!data;
}
