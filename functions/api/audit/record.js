import { jsonResponse } from '../../helpers/utils.js';
import { AUDIT_MODULES, buildAuditRow, requireAdmin } from '../../helpers/audit.js';
import { getSupabaseAdmin } from '../../helpers/supabase.js';

const AUDIT_ACTIONS = new Set(['create', 'update', 'delete']);

export async function onRequestPost({ request, env }) {
    try {
        const user = await requireAdmin(request, env);
        if (!user) {
            return jsonResponse({ data: null, error: { message: 'Admin access required' } }, 403);
        }

        const payload = await request.json();
        if (!payload || !AUDIT_MODULES.has(payload.module)) {
            return jsonResponse({ data: null, error: { message: 'Invalid audit module' } }, 400);
        }
        if (!AUDIT_ACTIONS.has(payload.action)) {
            return jsonResponse({ data: null, error: { message: 'Invalid audit action' } }, 400);
        }
        if (typeof payload.entity_type !== 'string' || !payload.entity_type.trim() ||
            typeof payload.entity_name !== 'string' || !payload.entity_name.trim()) {
            return jsonResponse({ data: null, error: { message: 'entity_type and entity_name are required' } }, 400);
        }

        const { data, error } = await getSupabaseAdmin(env)
            .from('admin_audit_logs')
            .insert([buildAuditRow(user, payload)])
            .select('id')
            .single();
        if (error) {
            console.error('[AUDIT] Error inserting audit log:', error);
            return jsonResponse({ data: null, error: { message: 'Failed to record audit' } }, 500);
        }

        return jsonResponse({ data, error: null });
    } catch (error) {
        console.error('[AUDIT] Unexpected audit error:', error);
        return jsonResponse({ data: null, error: { message: 'Failed to record audit' } }, 500);
    }
}