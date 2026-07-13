export type SearchHierarchyResultType = 'category' | 'subcategory' | 'brand' | 'brand_action_link' | 'section';

export interface SearchHierarchyResult {
  id: string;
  type: SearchHierarchyResultType;
  name: string;
  categoryId?: string;
  subcategoryId?: string;
  subcategoryName?: string;
  brandName?: string;
  link?: string | null;
  custom_link?: string | null;
  custom_link_type?: 'link' | 'iframe' | 'embed_code' | null;
  action_links?: Array<{
    id?: string;
    text?: string | null;
    url?: string | null;
    new_tab?: boolean;
    enabled?: boolean;
  }>;
  action_link_1_text?: string | null;
  action_link_1_url?: string | null;
  action_link_1_new_tab?: boolean;
  action_link_1_enabled?: boolean;
  action_link_2_text?: string | null;
  action_link_2_url?: string | null;
  action_link_2_new_tab?: boolean;
  action_link_2_enabled?: boolean;
  action_link_3_text?: string | null;
  action_link_3_url?: string | null;
  action_link_3_new_tab?: boolean;
  action_link_3_enabled?: boolean;
}

interface BuildHierarchicalSearchResultsInput {
  query: string;
  categories: Array<{ id: string; name: string }>;
  subcategories: Array<{
    id: string;
    category_id: string | null;
    name: string;
    custom_link?: string | null;
    custom_link_type?: 'link' | 'iframe' | 'embed_code' | null;
    subcategory_brands?: Array<{ id: string; name: string }>;
  }>;
  brands: Array<{
    id: string;
    name: string;
    subcategory_id?: string | null;
    link?: string | null;
    subcategories?: {
      id?: string | null;
      name?: string | null;
      category_id?: string | null;
      custom_link?: string | null;
      custom_link_type?: 'link' | 'iframe' | 'embed_code' | null;
    } | null;
    action_links?: Array<{
      id?: string;
      text?: string | null;
      url?: string | null;
      new_tab?: boolean;
      enabled?: boolean;
    }>;
    action_link_1_text?: string | null;
    action_link_1_url?: string | null;
    action_link_1_new_tab?: boolean;
    action_link_1_enabled?: boolean;
    action_link_2_text?: string | null;
    action_link_2_url?: string | null;
    action_link_2_new_tab?: boolean;
    action_link_2_enabled?: boolean;
    action_link_3_text?: string | null;
    action_link_3_url?: string | null;
    action_link_3_new_tab?: boolean;
    action_link_3_enabled?: boolean;
  }>;
  sections?: Array<{ id: string; heading?: string | null; name?: string | null }>;
}

function toDisplayName(name: string, parentName?: string | null) {
  if (!parentName) return name;
  return `${name} (${parentName})`;
}

function getLinkText(link: { text?: string | null; url?: string | null; enabled?: boolean } | undefined) {
  if (!link) return '';
  return `${link.text ?? ''}`.trim();
}

function getNormalizedActionLinks(brand: BuildHierarchicalSearchResultsInput['brands'][number]) {
  const configuredLinks = (brand.action_links || [])
    .map((link) => ({
      text: `${link?.text ?? ''}`.trim(),
      url: `${link?.url ?? ''}`.trim(),
      enabled: link?.enabled ?? true,
    }))
    .filter((link) => Boolean(link.text || link.url || link.enabled !== undefined));

  if (configuredLinks.length > 0) {
    return configuredLinks;
  }

  return [
    {
      text: `${brand.action_link_1_text ?? ''}`.trim(),
      url: `${brand.action_link_1_url ?? ''}`.trim(),
      enabled: brand.action_link_1_enabled ?? true,
    },
    {
      text: `${brand.action_link_2_text ?? ''}`.trim(),
      url: `${brand.action_link_2_url ?? ''}`.trim(),
      enabled: brand.action_link_2_enabled ?? true,
    },
    {
      text: `${brand.action_link_3_text ?? ''}`.trim(),
      url: `${brand.action_link_3_url ?? ''}`.trim(),
      enabled: brand.action_link_3_enabled ?? true,
    },
  ].filter((link) => Boolean(link.text || link.url || link.enabled !== undefined));
}

export function buildHierarchicalSearchResults({
  query,
  categories,
  subcategories,
  brands,
  sections = [],
}: BuildHierarchicalSearchResultsInput): SearchHierarchyResult[] {
  const normalizedQuery = query.trim().toLowerCase();
  const results: SearchHierarchyResult[] = [];
  const seen = new Set<string>();

  const addUniqueResult = (result: SearchHierarchyResult) => {
    const key = `${result.type}:${result.id}:${result.name}`;
    if (!seen.has(key)) {
      seen.add(key);
      results.push(result);
    }
  };

  const categoryMatches = (categories || []).filter((category) => {
    const name = category.name?.toLowerCase() ?? '';
    return name.includes(normalizedQuery);
  });

  const subcategoryMatches = (subcategories || []).filter((subcategory) => {
    const name = subcategory.name?.toLowerCase() ?? '';
    return name.includes(normalizedQuery);
  });

  const brandMatches = (brands || []).filter((brand) => {
    const name = brand.name?.toLowerCase() ?? '';
    return name.includes(normalizedQuery);
  });

  categoryMatches.forEach((category) => {
    addUniqueResult({
      id: category.id,
      type: 'category',
      name: category.name,
    });

    const categorySubcategories = (subcategories || []).filter((subcategory) => subcategory.category_id === category.id);
    categorySubcategories.forEach((subcategory) => {
      addUniqueResult({
        id: subcategory.id,
        type: 'subcategory',
        name: toDisplayName(category.name, subcategory.name),
        categoryId: subcategory.category_id ?? undefined,
        custom_link: subcategory.custom_link,
        custom_link_type: subcategory.custom_link_type,
      });
    });
  });

  subcategoryMatches.forEach((subcategory) => {
    const isAlreadyShown = results.some((result) => result.type === 'subcategory' && result.id === subcategory.id);
    if (!isAlreadyShown) {
      addUniqueResult({
        id: subcategory.id,
        type: 'subcategory',
        name: subcategory.name,
        categoryId: subcategory.category_id ?? undefined,
        custom_link: subcategory.custom_link,
        custom_link_type: subcategory.custom_link_type,
      });
    }

    const brandResults = (subcategory.subcategory_brands || []).map((brand) => ({
      id: brand.id,
      type: 'brand' as const,
      name: `${subcategory.name} (${brand.name})`,
      categoryId: subcategory.category_id ?? undefined,
      subcategoryId: subcategory.id,
      brandName: brand.name,
      link: brand.link ?? null,
      custom_link: subcategory.custom_link,
      custom_link_type: subcategory.custom_link_type,
    }));

    brandResults.forEach(addUniqueResult);
  });

  brandMatches.forEach((brand) => {
    addUniqueResult({
      id: brand.id,
      type: 'brand',
      name: brand.name,
      subcategoryId: brand.subcategory_id ?? undefined,
      categoryId: brand.subcategories?.category_id ?? undefined,
      subcategoryName: brand.subcategories?.name ?? undefined,
      link: brand.link,
      action_links: brand.action_links,
      action_link_1_text: brand.action_link_1_text,
      action_link_1_url: brand.action_link_1_url,
      action_link_1_new_tab: brand.action_link_1_new_tab,
      action_link_1_enabled: brand.action_link_1_enabled,
      action_link_2_text: brand.action_link_2_text,
      action_link_2_url: brand.action_link_2_url,
      action_link_2_new_tab: brand.action_link_2_new_tab,
      action_link_2_enabled: brand.action_link_2_enabled,
      action_link_3_text: brand.action_link_3_text,
      action_link_3_url: brand.action_link_3_url,
      action_link_3_new_tab: brand.action_link_3_new_tab,
      action_link_3_enabled: brand.action_link_3_enabled,
    });

    const actionLinks = getNormalizedActionLinks(brand).filter((link) => Boolean(link.text || link.url));

    actionLinks.forEach((link, index) => {
      addUniqueResult({
        id: `${brand.id}-action-${index}`,
        type: 'brand_action_link',
        name: `${brand.name} (${link.text})`,
        categoryId: brand.subcategories?.category_id ?? undefined,
        subcategoryId: brand.subcategory_id ?? undefined,
        subcategoryName: brand.subcategories?.name ?? undefined,
        link: link.url ?? null,
      });
    });
  });

  sections.forEach((section) => {
    addUniqueResult({
      id: section.id,
      type: 'section',
      name: section.heading || section.name || 'Section',
    });
  });

  return results.sort((a, b) => {
    const priority = {
      category: 0,
      subcategory: 1,
      brand: 2,
      brand_action_link: 3,
      section: 4,
    };

    const priorityDiff = priority[a.type] - priority[b.type];
    if (priorityDiff !== 0) return priorityDiff;

    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();
    return nameA.localeCompare(nameB);
  });
}
