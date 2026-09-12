import { supabase } from '@/integrations/supabase/client';

export interface AdminLinkSearchResult {
  url: string;
  heading: string | null;
  category: string | null;
  subcategory: string | null;
  brand: string | null;
  actionLinkName: string | null;
  source: string;
  recordId: string;
}

interface AdminLinkSearchResponse {
  results: AdminLinkSearchResult[];
  total: number;
}

function getApiBase() {
  const configuredUrl = typeof import.meta.env.VITE_API_URL === 'string' ? import.meta.env.VITE_API_URL.trim() : '';

  if (import.meta.env.PROD) {
    if (configuredUrl && configuredUrl.startsWith('http://localhost')) return '';
    return configuredUrl || '';
  }

  return configuredUrl || 'http://localhost:3001';
}

export async function searchAdminExternalLinks(url: string): Promise<AdminLinkSearchResponse> {
  const sessionResponse = await supabase.auth.getSession();
  const token = sessionResponse.data.session?.access_token;
  const query = encodeURIComponent(url.trim());
  const response = await fetch(`${getApiBase()}/api/admin/link-search?url=${query}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    cache: 'no-store',
  });

  const payload = await response.json() as AdminLinkSearchResponse & { error?: { message?: string } };
  if (!response.ok) {
    throw new Error(payload.error?.message || 'Unable to search external links');
  }

  return payload;
}