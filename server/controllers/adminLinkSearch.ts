import type { Request, Response } from 'express';
import { getSupabaseAdmin } from '../lib/supabaseAdmin.js';

export interface LinkSearchResult {
  url: string;
  heading: string | null;
  category: string | null;
  subcategory: string | null;
  brand: string | null;
  actionLinkName: string | null;
  source: string;
  recordId: string;
}

interface CategoryRow {
  id: string;
  name: string;
  section_id?: string | null;
}

interface SectionRow {
  id: string;
  heading?: string | null;
  name?: string | null;
}

interface SubcategoryRow {
  id: string;
  category_id: string;
  name: string;
  link: string | null;
  custom_link: string | null;
  schedule_link: string | null;
  schedule_link_2: string | null;
  form_link: string | null;
  button_1_link: string | null;
  button_2_link: string | null;
  button_3_link: string | null;
}

interface BrandRow {
  id: string;
  subcategory_id: string;
  name: string;
  link: string | null;
  action_link_1_url: string | null;
  action_link_1_text?: string | null;
  action_link_2_url: string | null;
  action_link_2_text?: string | null;
  action_link_3_url: string | null;
  action_link_3_text?: string | null;
  action_links: unknown;
  primary_cta_link: string | null;
  join_network_link: string | null;
  buttons: unknown;
}

interface CategoryButtonRow {
  id: string;
  subcategory_id: string;
  link: string | null;
}

const SUBCATEGORY_LINK_FIELDS = [
  'link',
  'custom_link',
  'schedule_link',
  'schedule_link_2',
  'form_link',
  'button_1_link',
  'button_2_link',
  'button_3_link',
] as const;

const BRAND_LINK_FIELDS = [
  'link',
  'primary_cta_link',
  'join_network_link',
] as const;

function addResult(
  results: LinkSearchResult[],
  value: unknown,
  source: string,
  recordId: string,
  category: string | null,
  subcategory: string | null,
  brand: string | null,
  actionLinkName: string | null,
  heading: string | null,
  query: string,
) {
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

function addJsonLinkResults(
  results: LinkSearchResult[],
  value: unknown,
  source: string,
  recordId: string,
  category: string | null,
  subcategory: string | null,
  brand: string | null,
  heading: string | null,
  query: string,
) {
  if (!Array.isArray(value)) return;

  value.forEach((item, index) => {
    if (!item || typeof item !== 'object') return;
    const link = item as Record<string, unknown>;
    const linkName = typeof link.text === 'string'
      ? link.text.trim()
      : typeof link.label === 'string'
        ? link.label.trim()
        : typeof link.name === 'string'
          ? link.name.trim()
          : null;
    addResult(results, link.url ?? link.link, `${source}[${index}].${link.url !== undefined ? 'url' : 'link'}`, recordId, category, subcategory, brand, linkName, heading, query);
  });
}

function addLegacyActionLinkResults(
  results: LinkSearchResult[],
  links: Array<{ url: string | null; name: string | null; source: string }>,
  recordId: string,
  category: string | null,
  subcategory: string | null,
  brand: string | null,
  heading: string | null,
  query: string,
) {
  links.forEach((link) => {
    addResult(results, link.url, link.source, recordId, category, subcategory, brand, link.name?.trim() || null, heading, query);
  });
}

export function buildLinkSearchResults(
  query: string,
  categories: CategoryRow[],
  subcategories: SubcategoryRow[],
  brands: BrandRow[],
  categoryButtons: CategoryButtonRow[],
  sections: SectionRow[] = [],
): LinkSearchResult[] {
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
  const sectionNames = new Map(sections.map((section) => [section.id, section.heading?.trim() || section.name?.trim() || null]));
  const subcategoryNames = new Map(subcategories.map((subcategory) => [subcategory.id, subcategory]));
  const results: LinkSearchResult[] = [];

  subcategories.forEach((subcategory) => {
    const category = categoryNames.get(subcategory.category_id) ?? null;
    const categoryRow = categories.find((candidate) => candidate.id === subcategory.category_id);
    const heading = categoryRow?.section_id ? sectionNames.get(categoryRow.section_id) ?? null : null;
    SUBCATEGORY_LINK_FIELDS.forEach((field) => {
      addResult(results, subcategory[field], `subcategory.${field}`, subcategory.id, category, subcategory.name, null, null, heading, query);
    });
  });

  brands.forEach((brand) => {
    const subcategory = subcategoryNames.get(brand.subcategory_id);
    const category = subcategory ? categoryNames.get(subcategory.category_id) ?? null : null;
    const categoryRow = categories.find((candidate) => candidate.id === subcategory?.category_id);
    const heading = categoryRow?.section_id ? sectionNames.get(categoryRow.section_id) ?? null : null;

    BRAND_LINK_FIELDS.forEach((field) => {
      addResult(results, brand[field], `brand.${field}`, brand.id, category, subcategory?.name ?? null, brand.name, null, heading, query);
    });
    addLegacyActionLinkResults(results, [
      { url: brand.action_link_1_url, name: brand.action_link_1_text, source: 'brand.action_link_1_url' },
      { url: brand.action_link_2_url, name: brand.action_link_2_text, source: 'brand.action_link_2_url' },
      { url: brand.action_link_3_url, name: brand.action_link_3_text, source: 'brand.action_link_3_url' },
    ], brand.id, category, subcategory?.name ?? null, brand.name, heading, query);
    addJsonLinkResults(results, brand.action_links, 'brand.action_links', brand.id, category, subcategory?.name ?? null, brand.name, heading, query);
    addJsonLinkResults(results, brand.buttons, 'brand.buttons', brand.id, category, subcategory?.name ?? null, brand.name, heading, query);
  });

  categoryButtons.forEach((button) => {
    const subcategory = subcategoryNames.get(button.subcategory_id);
    const category = subcategory ? categoryNames.get(subcategory.category_id) ?? null : null;
    const categoryRow = categories.find((candidate) => candidate.id === subcategory?.category_id);
    const heading = categoryRow?.section_id ? sectionNames.get(categoryRow.section_id) ?? null : null;
    addResult(results, button.link, 'category_button.link', button.id, category, subcategory?.name ?? null, null, null, heading, query);
  });

  const seenHierarchies = new Set<string>();
  return results.filter((result) => {
    const hierarchy = [result.heading, result.category, result.subcategory, result.brand, result.actionLinkName]
      .map((part) => part?.trim() || '')
      .join('\u001f');
    if (seenHierarchies.has(hierarchy)) return false;
    seenHierarchies.add(hierarchy);
    return true;
  });
}

export async function searchExternalLinks(req: Request, res: Response) {
  const query = typeof req.query.url === 'string' ? req.query.url.trim() : '';
  if (!query) {
    res.status(400).json({ error: { message: 'A URL is required' } });
    return;
  }

  const supabase = getSupabaseAdmin();
  const [categoriesResponse, subcategoriesResponse, brandsResponse, buttonsResponse, sectionsResponse] = await Promise.all([
    supabase.from('categories').select('id, name, section_id'),
    supabase.from('subcategories').select('id, category_id, name, link, custom_link, schedule_link, schedule_link_2, form_link, button_1_link, button_2_link, button_3_link'),
    supabase.from('subcategory_brands').select('id, subcategory_id, name, link, action_link_1_text, action_link_1_url, action_link_2_text, action_link_2_url, action_link_3_text, action_link_3_url, action_links, primary_cta_link, join_network_link, buttons'),
    supabase.from('category_buttons').select('id, subcategory_id, link'),
    supabase.from('page_sections').select('id, heading, name'),
  ]);

  const error = categoriesResponse.error || subcategoriesResponse.error || brandsResponse.error || buttonsResponse.error || sectionsResponse.error;
  if (error) {
    res.status(500).json({ error: { message: error.message } });
    return;
  }

  const results = buildLinkSearchResults(
    query,
    (categoriesResponse.data ?? []) as CategoryRow[],
    (subcategoriesResponse.data ?? []) as SubcategoryRow[],
    (brandsResponse.data ?? []) as BrandRow[],
    (buttonsResponse.data ?? []) as CategoryButtonRow[],
    (sectionsResponse.data ?? []) as SectionRow[],
  );

  res.json({ results, total: results.length });
}