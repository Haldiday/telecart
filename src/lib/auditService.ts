import axios from 'axios';

export type AuditModule =
  | 'section-headings'
  | 'categories'
  | 'subcategories'
  | 'brands'
  | 'brand-action-links'
  | 'ads'
  | 'offers'
  | 'featured-cards';

export type AuditAction = 'create' | 'update' | 'delete';

export interface AuditHierarchy {
  section_heading?: string;
  category?: string;
  subcategory?: string;
  brand?: string;
}

export interface AuditLogDisplay {
  id: string;
  actor_name: string;
  actor_avatar: string | null;
  actor_id: string | null;
  module: AuditModule;
  action: AuditAction;
  entity_type: string;
  entity_id: string | null;
  entity_name: string;
  ad_slot: number | null;
  hierarchy: AuditHierarchy;
  description: string;
  hierarchy_path: string | null;
  created_at: string;
}

export interface RecordAuditRequest {
  module: AuditModule;
  action: AuditAction;
  entity_type: string;
  entity_id?: string;
  entity_name: string;
  ad_slot?: 1 | 2 | 3 | null;
  hierarchy_hints?: {
    section_id?: string | null;
    category_id?: string | null;
    subcategory_id?: string | null;
    brand_id?: string | null;
  };
  old_data?: Record<string, unknown> | null;
  new_data?: Record<string, unknown> | null;
  changes?: Record<string, unknown> | null;
}

function getApiBase() {
  const configuredUrl = typeof import.meta.env.VITE_API_URL === 'string' ? import.meta.env.VITE_API_URL.trim() : '';
  if (import.meta.env.PROD) {
    if (configuredUrl && configuredUrl.startsWith('http://localhost')) {
      return '';
    }
    return configuredUrl || '';
  }
  return configuredUrl || 'http://localhost:3001';
}

const API_BASE = getApiBase();

function getCustomAuthToken(): string | null {
  try {
    return localStorage.getItem('auth_token');
  } catch {
    return null;
  }
}

async function getSupabaseSessionToken(): Promise<string | null> {
  try {
    const mod = await import('@/integrations/supabase/client');
    const sb = (mod as any).supabase;
    if (!sb?.auth?.getSession) return null;
    const result = await sb.auth.getSession();
    return result?.data?.session?.access_token ?? null;
  } catch {
    return null;
  }
}

export async function resolveAuthToken(): Promise<string | null> {
  const custom = getCustomAuthToken();
  if (custom) return custom;
  return getSupabaseSessionToken();
}

export async function recordAudit(payload: RecordAuditRequest): Promise<void> {
  const token = await resolveAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    await axios.post(`${API_BASE}/api/audit/record`, payload, { headers });
  } catch (error) {
    console.error('[AUDIT] Failed to record audit entry:', error);
  }
}

export async function fetchAuditLogs(module: AuditModule, limit = 200): Promise<AuditLogDisplay[]> {
  const token = await resolveAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const url = `${API_BASE}/api/audit/logs?module=${encodeURIComponent(module)}${limit ? `&limit=${limit}` : ''}`;
  try {
    const response = await axios.get<{ data: AuditLogDisplay[]; error: unknown }>(url, { headers });
    return response?.data?.data ?? [];
  } catch (err: any) {
    const status = err?.response?.status;
    if (status === 401) {
      throw new Error('Sign in as admin to view audit history');
    }
    if (status === 403) {
      throw new Error('Admin access is required to view audit history');
    }
    const serverMsg = err?.response?.data?.error?.message;
    if (typeof serverMsg === 'string' && serverMsg.trim()) {
      throw new Error(serverMsg);
    }
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(typeof err === 'string' ? err : 'Failed to load audit history');
  }
}
