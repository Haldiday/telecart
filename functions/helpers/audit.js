import { getSupabaseAdmin } from './supabase.js';

export const AUDIT_MODULES = new Set([
    'section-headings',
    'categories',
    'subcategories',
    'brands',
    'brand-action-links',
    'ads',
    'offers',
    'featured-cards',
]);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function uuidOrNull(value) {
    return typeof value === 'string' && UUID_RE.test(value) ? value : null;
}

function auditEntityId(value) {
    if (typeof value !== 'string' || value.length === 0 || /^legacy-\d+$/i.test(value)) return null;
    return value;
}

function actionWord(action) {
    if (action === 'create') return 'Created';
    if (action === 'delete') return 'Deleted';
    return 'Updated';
}

function subject(module, entityName, adSlot) {
    if (module === 'ads') return adSlot ? `Ad ${adSlot}` : 'Ad';
    if (module === 'section-headings') return `Section Heading "${entityName}"`;
    if (module === 'brands') return `Brand "${entityName}"`;
    if (module === 'brand-action-links') return `Brand Action Link "${entityName}"`;
    return `${module.replace(/-/g, ' ')} "${entityName}"`;
}

export async function requireAdmin(request, env) {
    const authorization = request.headers.get('authorization');
    const authMatch = authorization ? authorization.match(/^Bearer\s+(.+)$/i) : null;
    const token = authMatch ? authMatch[1] : null;
    if (!token) return null;

    const supabase = getSupabaseAdmin(env);
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data || !data.user || !data.user.id) return null;

    const { data: role } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .eq('role', 'admin')
        .maybeSingle();
    if (!role) return null;

    return data.user;
}

export function buildAuditRow(user, payload) {
    const entityTable = typeof payload.entity_type === 'string' ? payload.entity_type.trim() : '';
    const entityName = typeof payload.entity_name === 'string' ? payload.entity_name.trim() : '';
    const entityId = auditEntityId(payload.entity_id);
    const adSlot = payload.module === 'ads' && [1, 2, 3].includes(payload.ad_slot) ? payload.ad_slot : null;
    const fullName = user.user_metadata && user.user_metadata.full_name;
    const email = user.email || null;
    const actorName = typeof fullName === 'string' && fullName.trim() ?
        fullName.trim() :
        email ? email.split('@')[0] : 'Admin';

    return {
        actor_user_id: uuidOrNull(user.id),
        actor_id: uuidOrNull(user.id),
        actor_email: email,
        actor_name: actorName,
        actor_avatar: user.user_metadata && typeof user.user_metadata.avatar_url === 'string' ? user.user_metadata.avatar_url : null,
        action: payload.action,
        entity_table: entityTable,
        entity_type: entityTable,
        module: payload.module,
        record_id: uuidOrNull(entityId),
        entity_id: entityId,
        entity_name: entityName,
        description: `${actionWord(payload.action)} ${subject(payload.module, entityName, adSlot)}`,
        ad_slot: adSlot,
        hierarchy: payload.hierarchy_hints || {},
        old_data: payload.old_data || null,
        new_data: payload.new_data || null,
        changes: payload.changes || null,
        request_id: payload.correlation_id || null,
        correlation_id: payload.correlation_id || null,
    };
}