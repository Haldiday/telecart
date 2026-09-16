import { getSupabaseAdmin } from '../../helpers/supabase.js';
import { getBearerToken, jsonResponse } from '../../helpers/utils.js';
import { getSupabaseUserByToken, isAdminUser } from '../../helpers/supabaseAuth.js';

const SUBCATEGORY_LINK_FIELDS = [
    'link',
    'custom_link',
    'schedule_link',
    'schedule_link_2',
    'form_link',
    'button_1_link',
    'button_2_link',
    'button_3_link',
];

const BRAND_LINK_FIELDS = ['link', 'primary_cta_link', 'join_network_link'];

function addResult(results, value, source, recordId, category, subcategory, brand, actionLinkName, heading, query) {
    if (typeof value !== 'string' || value.trim() !== query) return;

    results.push({
        url: value,
        heading,
        category,
        subcategory,
        brand,
        actionLinkName,
        source,
        recordId,
    });
}

function addJsonLinkResults(results, value, source, recordId, category, subcategory, brand, heading, query) {
    if (!Array.isArray(value)) return;

    value.forEach((item, index) => {
        if (!item || typeof item !== 'object') return;
        const link = item;
        const linkName = typeof link.text === 'string' ?
            link.text.trim() :
            typeof link.label === 'string' ?
            link.label.trim() :
            typeof link.name === 'string' ?
            link.name.trim() :
            null;
        addResult(
            results,
            link.url !== undefined ? link.url : link.link,
            `${source}[${index}].${link.url !== undefined ? 'url' : 'link'}`,
            recordId,
            category,
            subcategory,
            brand,
            linkName,
            heading,
            query,
        );
    });
}

function addLegacyActionLinkResults(results, links, recordId, category, subcategory, brand, heading, query) {
    links.forEach((link) => {
        addResult(results, link.url, link.source, recordId, category, subcategory, brand, link.name ? link.name.trim() : null, heading, query);
    });
}

function buildLinkSearchResults(query, categories, subcategories, brands, categoryButtons, sections) {
    const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
    const sectionNames = new Map(sections.map((section) => [section.id, section.heading ? section.heading.trim() : section.name ? section.name.trim() : null]));
    const subcategoryNames = new Map(subcategories.map((subcategory) => [subcategory.id, subcategory]));
    const results = [];

    subcategories.forEach((subcategory) => {
        const category = categoryNames.get(subcategory.category_id) !== undefined ? categoryNames.get(subcategory.category_id) : null;
        const categoryRow = categories.find((candidate) => candidate.id === subcategory.category_id);
        const heading = categoryRow && categoryRow.section_id ? (sectionNames.get(categoryRow.section_id) !== undefined ? sectionNames.get(categoryRow.section_id) : null) : null;
        SUBCATEGORY_LINK_FIELDS.forEach((field) => {
            addResult(results, subcategory[field], `subcategory.${field}`, subcategory.id, category, subcategory.name, null, null, heading, query);
        });
    });

    brands.forEach((brand) => {
        const subcategory = subcategoryNames.get(brand.subcategory_id);
        const category = subcategory ? (categoryNames.get(subcategory.category_id) !== undefined ? categoryNames.get(subcategory.category_id) : null) : null;
        const categoryRow = categories.find((candidate) => candidate.id === (subcategory ? subcategory.category_id : undefined));
        const heading = categoryRow && categoryRow.section_id ? (sectionNames.get(categoryRow.section_id) !== undefined ? sectionNames.get(categoryRow.section_id) : null) : null;

        BRAND_LINK_FIELDS.forEach((field) => {
            addResult(results, brand[field], `brand.${field}`, brand.id, category, subcategory ? subcategory.name : null, brand.name, null, heading, query);
        });
        addLegacyActionLinkResults(results, [
            { url: brand.action_link_1_url, name: brand.action_link_1_text, source: 'brand.action_link_1_url' },
            { url: brand.action_link_2_url, name: brand.action_link_2_text, source: 'brand.action_link_2_url' },
            { url: brand.action_link_3_url, name: brand.action_link_3_text, source: 'brand.action_link_3_url' },
        ], brand.id, category, subcategory ? subcategory.name : null, brand.name, heading, query);
        addJsonLinkResults(results, brand.action_links, 'brand.action_links', brand.id, category, subcategory ? subcategory.name : null, brand.name, heading, query);
        addJsonLinkResults(results, brand.buttons, 'brand.buttons', brand.id, category, subcategory ? subcategory.name : null, brand.name, heading, query);
    });

    categoryButtons.forEach((button) => {
        const subcategory = subcategoryNames.get(button.subcategory_id);
        const category = subcategory ? (categoryNames.get(subcategory.category_id) !== undefined ? categoryNames.get(subcategory.category_id) : null) : null;
        const categoryRow = categories.find((candidate) => candidate.id === (subcategory ? subcategory.category_id : undefined));
        const heading = categoryRow && categoryRow.section_id ? (sectionNames.get(categoryRow.section_id) !== undefined ? sectionNames.get(categoryRow.section_id) : null) : null;
        addResult(results, button.link, 'category_button.link', button.id, category, subcategory ? subcategory.name : null, null, null, heading, query);
    });

    const seenHierarchies = new Set();
    return results.filter((result) => {
        const hierarchy = [result.heading, result.category, result.subcategory, result.brand, result.actionLinkName]
            .map((part) => part ? part.trim() : '')
            .join('\u001f');
        if (seenHierarchies.has(hierarchy)) return false;
        seenHierarchies.add(hierarchy);
        return true;
    });
}

export async function onRequestGet({ request, env }) {
    try {
        const rawQuery = new URL(request.url).searchParams.get('url');
        const query = rawQuery ? rawQuery.trim() : '';
        if (!query) {
            return jsonResponse({ error: { message: 'A URL is required' } }, 400);
        }

        const token = getBearerToken(request);
        if (!token) {
            return jsonResponse({ data: null, error: { message: 'Authentication required', code: 'UNAUTHORIZED' } }, 401);
        }

        const user = await getSupabaseUserByToken(env, token);
        if (!user || !user.id) {
            return jsonResponse({ data: null, error: { message: 'Invalid or expired token', code: 'UNAUTHORIZED' } }, 401);
        }

        if (!await isAdminUser(env, user.id)) {
            return jsonResponse({ data: null, error: { message: 'Admin access required', code: 'FORBIDDEN' } }, 403);
        }

        const supabase = getSupabaseAdmin(env);
        const [categoriesResponse, subcategoriesResponse, brandsResponse, buttonsResponse, sectionsResponse] = await Promise.all([
            supabase.from('categories').select('id, name, section_id'),
            supabase.from('subcategories').select('id, category_id, name, link, custom_link, schedule_link, schedule_link_2, form_link, button_1_link, button_2_link, button_3_link'),
            supabase.from('subcategory_brands').select('id, subcategory_id, name, link, action_link_1_text, action_link_1_url, action_link_2_text, action_link_2_url, action_link_3_text, action_link_3_url, action_links, primary_cta_link, join_network_link, buttons'),
            supabase.from('category_buttons').select('id, subcategory_id, link'),
            supabase.from('page_sections').select('id, heading, name'),
        ]);

        const error = categoriesResponse.error || subcategoriesResponse.error || brandsResponse.error || buttonsResponse.error || sectionsResponse.error;
        if (error) {
            return jsonResponse({ error: { message: error.message } }, 500);
        }

        const results = buildLinkSearchResults(
            query,
            categoriesResponse.data || [],
            subcategoriesResponse.data || [],
            brandsResponse.data || [],
            buttonsResponse.data || [],
            sectionsResponse.data || [],
        );

        return jsonResponse({ results, total: results.length });
    } catch (error) {
        console.error('Error searching external links:', error);
        return jsonResponse({ error: { message: error instanceof Error ? error.message : 'Unable to search external links' } }, 500);
    }
}