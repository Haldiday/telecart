import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { getSupabaseAdmin } from '../lib/supabaseAdmin.js';

const allowedActions = new Set(['created', 'updated', 'deleted']);

export async function getAdminAuditLogs(req: AuthenticatedRequest, res: Response) {
  const page = Math.max(Number.parseInt(String(req.query.page ?? '1'), 10) || 1, 1);
  const pageSize = Math.min(Math.max(Number.parseInt(String(req.query.pageSize ?? '25'), 10) || 25, 1), 100);
  const action = typeof req.query.action === 'string' ? req.query.action : undefined;
  if (action && !allowedActions.has(action)) {
    res.status(400).json({ data: null, error: { message: 'Invalid audit action' } });
    return;
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  let query: any = getSupabaseAdmin()
    .from('admin_audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (typeof req.query.adminId === 'string' && req.query.adminId) query = query.eq('actor_user_id', req.query.adminId);
  if (typeof req.query.adminEmail === 'string' && req.query.adminEmail) query = query.ilike('actor_email', `%${req.query.adminEmail}%`);
  if (action) query = query.eq('action', action);
  if (typeof req.query.entityTable === 'string' && req.query.entityTable) query = query.eq('entity_table', req.query.entityTable);
  if (typeof req.query.recordId === 'string' && req.query.recordId) query = query.eq('record_id', req.query.recordId);
  if (typeof req.query.from === 'string' && req.query.from) query = query.gte('created_at', req.query.from);
  if (typeof req.query.to === 'string' && req.query.to) query = query.lte('created_at', req.query.to);
  query = query.not('description', 'is', null);

  const { data, error, count } = await query;
  if (error) {
    res.status(500).json({ data: null, error: { message: error.message } });
    return;
  }

  res.json({
    data: data ?? [],
    pagination: {
      page,
      pageSize,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / pageSize),
    },
    error: null,
  });
}