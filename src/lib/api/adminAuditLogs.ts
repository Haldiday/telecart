import { supabase } from '@/integrations/supabase/client';

export interface AdminAuditLog {
  id: string;
  actor_user_id: string | null;
  actor_email: string | null;
  actor_name: string | null;
  action: 'created' | 'updated' | 'deleted';
  entity_type: string;
  entity_table: string;
  record_id: string | null;
  description: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  changes: Record<string, { old: unknown; new: unknown }> | null;
  request_id: string | null;
  created_at: string;
}

export interface AdminAuditLogFilters {
  page: number;
  pageSize: number;
  adminId?: string;
  adminEmail?: string;
  action?: string;
  entityTable?: string;
  recordId?: string;
  from?: string;
  to?: string;
}

function getApiBase() {
  const configuredUrl = typeof import.meta.env.VITE_API_URL === 'string' ? import.meta.env.VITE_API_URL.trim() : '';
  if (import.meta.env.PROD) return configuredUrl?.startsWith('http://localhost') ? '' : configuredUrl || '';
  return configuredUrl || 'http://localhost:3001';
}

export async function fetchAdminAuditLogs(filters: AdminAuditLogFilters) {
  const token = (await supabase.auth.getSession()).data.session?.access_token;
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, String(value));
  });

  const response = await fetch(`${getApiBase()}/api/admin/audit-logs?${params.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    cache: 'no-store',
  });
  const payload = await response.json() as {
    data?: AdminAuditLog[];
    pagination?: { page: number; pageSize: number; total: number; totalPages: number };
    error?: { message?: string };
  };
  if (!response.ok) throw new Error(payload.error?.message || 'Unable to load audit logs');
  return { logs: payload.data ?? [], pagination: payload.pagination ?? { page: 1, pageSize: filters.pageSize, total: 0, totalPages: 0 } };
}
