import { buildAuditRow } from './audit.js';
import { getSupabaseAdmin } from './supabase.js';

function normalizeLinks(row) {
    const configured = Array.isArray(row.action_links) ?
        row.action_links.map((link, index) => ({
            id: link && typeof link.id === 'string' && link.id.trim() ? link.id : `${row.id}-action-${index + 1}`,
            text: link && typeof link.text === 'string' ? link.text.trim() : '',
            url: link && typeof link.url === 'string' ? link.url.trim() : '',
            new_tab: Boolean(link && link.new_tab),
            enabled: !link || link.enabled !== false,
        })) : [];

    if (configured.length > 0) return configured.filter((link) => link.text || link.url);

    return [1, 2, 3].map((index) => ({
        id: `${row.id}-action-${index}`,
        text: String(row[`action_link_${index}_text`] || '').trim(),
        url: String(row[`action_link_${index}_url`] || '').trim(),
        new_tab: Boolean(row[`action_link_${index}_new_tab`]),
        enabled: row[`action_link_${index}_enabled`] !== false,
    })).filter((link) => link.text || link.url);
}

async function resolveHierarchy(supabase, row) {
    const hierarchy = { brand: row.name };
    const { data: subcategory } = await supabase
        .from('subcategories')
        .select('name, category_id')
        .eq('id', row.subcategory_id)
        .maybeSingle();
    if (!subcategory) return hierarchy;

    hierarchy.subcategory = subcategory.name;
    const { data: category } = await supabase
        .from('categories')
        .select('name, section_id')
        .eq('id', subcategory.category_id)
        .maybeSingle();
    if (!category) return hierarchy;

    hierarchy.category = category.name;
    if (category.section_id) {
        const sources = ['page_sections', 'subcategory_page_sections', 'category_page_sections'];
        for (const table of sources) {
            const { data: section } = await supabase
                .from(table)
                .select('heading, name')
                .eq('id', category.section_id)
                .maybeSingle();
            if (section) {
                hierarchy.section_heading = (section.heading || '').trim() || (section.name || '').trim() || undefined;
                if (hierarchy.section_heading) break;
            }
        }
    }
    return hierarchy;
}

export async function recordBrandActionLinkAudits(env, user, beforeRows, afterRows) {
    const supabase = getSupabaseAdmin(env);
    const beforeByBrand = new Map(beforeRows.map((row) => [row.id, row]));
    const afterByBrand = new Map(afterRows.map((row) => [row.id, row]));
    const brandIds = new Set([...beforeByBrand.keys(), ...afterByBrand.keys()]);

    for (const brandId of brandIds) {
        const beforeRow = beforeByBrand.get(brandId);
        const afterRow = afterByBrand.get(brandId);
        const beforeLinks = new Map((beforeRow ? normalizeLinks(beforeRow) : []).map((link) => [link.id, link]));
        const afterLinks = new Map((afterRow ? normalizeLinks(afterRow) : []).map((link) => [link.id, link]));
        const linkIds = new Set([...beforeLinks.keys(), ...afterLinks.keys()]);

        for (const linkId of linkIds) {
            const beforeLink = beforeLinks.get(linkId);
            const afterLink = afterLinks.get(linkId);
            const action = !beforeLink ?
                'create' :
                !afterLink ?
                'delete' :
                JSON.stringify(beforeLink) === JSON.stringify(afterLink) ?
                null :
                'update';
            const link = afterLink || beforeLink;
            const row = afterRow || beforeRow;
            if (!action || !link || !link.text || !row) continue;

            const hierarchy = await resolveHierarchy(supabase, row);
            const auditRow = buildAuditRow(user, {
                module: 'brand-action-links',
                action,
                entity_type: 'brand_action_links',
                entity_id: link.id,
                entity_name: link.text,
                hierarchy_hints: hierarchy,
                old_data: beforeLink || null,
                new_data: afterLink || null,
            });
            auditRow.hierarchy = hierarchy;

            const { error } = await supabase.from('admin_audit_logs').insert([auditRow]).select('id').single();
            if (error) {
                const detail = error.message || JSON.stringify(error);
                console.error('[AUDIT] Production Brand Action Link insert failed:', detail);
                throw new Error(`Brand Action Link audit insert failed: ${detail}`);
            }
        }
    }
}