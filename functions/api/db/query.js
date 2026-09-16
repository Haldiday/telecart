import { executeQuery } from '../../helpers/dbExecutor.js';
import { recordBrandActionLinkAudits } from '../../helpers/brandActionAudit.js';
import { jsonResponse, getBearerToken } from '../../helpers/utils.js';
import { getSupabaseUserByToken, isAdminUser } from '../../helpers/supabaseAuth.js';

export async function onRequestPost({ request, env }) {
    try {
        const spec = await request.json();
        if (!spec || !spec.table || !spec.action) {
            return jsonResponse({ data: null, error: { message: 'Invalid query spec: table and action are required' } }, 400);
        }

        const adminActions = new Set(['insert', 'update', 'delete', 'upsert']);
        let user = null;
        if (adminActions.has(spec.action)) {
            const token = getBearerToken(request);
            if (!token) {
                return jsonResponse({ data: null, error: { message: 'Authentication required', code: 'UNAUTHORIZED' } }, 401);
            }

            user = await getSupabaseUserByToken(env, token);
            if (!user || !user.id) {
                return jsonResponse({ data: null, error: { message: 'Invalid or expired token', code: 'UNAUTHORIZED' } }, 401);
            }

            const admin = await isAdminUser(env, user.id);
            if (!admin) {
                return jsonResponse({ data: null, error: { message: 'Admin access required for write operations', code: 'FORBIDDEN' } }, 403);
            }
        }

        const isBrandActionLinkWrite = adminActions.has(spec.action) && spec.table === 'subcategory_brands';
        const bodyRows = Array.isArray(spec.body) ? spec.body : spec.body ? [spec.body] : [];
        const bodyIds = bodyRows
            .map((row) => row && typeof row === 'object' ? row.id : null)
            .filter((id) => typeof id === 'string' && id.length > 0);
        const snapshotSpec = isBrandActionLinkWrite ?
            spec.action === 'insert' || spec.action === 'upsert' ?
            bodyIds.length > 0 ? { table: spec.table, action: 'select', select: '*', filters: [{ op: 'in', column: 'id', value: bodyIds }], orders: [] } :
            null : {...spec, action: 'select', select: '*', returning: false, single: false, maybeSingle: false } :
            null;
        const before = snapshotSpec ? await executeQuery(snapshotSpec, env) : null;

        const result = await executeQuery(spec, env);
        if (result.error) {
            return jsonResponse(result, 400);
        }

        if (isBrandActionLinkWrite && user) {
            const afterSpec = spec.action === 'delete' ?
                null :
                bodyIds.length > 0 ? { table: spec.table, action: 'select', select: '*', filters: [{ op: 'in', column: 'id', value: bodyIds }], orders: [] } :
                snapshotSpec;
            const after = afterSpec ? await executeQuery(afterSpec, env) : { data: [], error: null };
            if ((before && before.error) || after.error) {
                const error = (before && before.error) || after.error;
                console.error('[AUDIT] Production Brand Action Link snapshot failed:', error.message);
                return jsonResponse({ data: null, error: { message: `Brand Action Link audit snapshot failed: ${error.message}` } }, 500);
            }
            await recordBrandActionLinkAudits(
                env,
                user,
                Array.isArray(before && before.data) ? before.data : before && before.data ? [before.data] : [],
                Array.isArray(after.data) ? after.data : after.data ? [after.data] : [],
            );
        }
        return jsonResponse(result);
    } catch (error) {
        console.error('Error executing db query:', error);
        return jsonResponse({ data: null, error: { message: error instanceof Error ? error.message : 'Query execution failed' } }, 500);
    }
}