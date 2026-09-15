import { jsonResponse } from '../../helpers/utils.js';
import { AUDIT_MODULES, requireAdmin } from '../../helpers/audit.js';
import { getSupabaseAdmin } from '../../helpers/supabase.js';

export async function onRequestGet({ request, env }) {
    try {
        const user = await requireAdmin(request, env);
        if (!user) {
            return jsonResponse({ data: null, error: { message: 'Admin access required' } }, 403);
        }

        const url = new URL(request.url);
        const module = url.searchParams.get('module');
        const rawLimit = Number(url.searchParams.get('limit') || '200');
        const limit = Number.isFinite(rawLimit) && rawLimit > 0 && rawLimit <= 500 ? rawLimit : 200;
        if (!AUDIT_MODULES.has(module)) {
            return jsonResponse({ data: null, error: { message: 'Invalid audit module' } }, 400);
        }

        const { data, error } = await getSupabaseAdmin(env)
            .from('admin_audit_logs')
            .select('id, actor_name, actor_avatar, actor_id, actor_user_id, module, action, entity_type, entity_table, entity_id, entity_name, ad_slot, hierarchy, created_at')
            .eq('module', module)
            .order('created_at', { ascending: false })
            .limit(limit);
        if (error) {
            console.error('[AUDIT] Error fetching audit logs:', error);
            return jsonResponse({ data: null, error: { message: 'Failed to load audit history' } }, 500);
        }

        return jsonResponse({ data: data || [], error: null });
    } catch (error) {
        console.error('[AUDIT] Unexpected audit read error:', error);
        return jsonResponse({ data: null, error: { message: 'Failed to load audit history' } }, 500);
    }
}