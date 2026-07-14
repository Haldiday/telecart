export interface SearchHierarchyCategory {
  id: string;
  name: string;
}

export interface SearchHierarchySubcategory {
  id: string;
  category_id?: string | null;
  name: string;
  custom_link?: string | null;
  custom_link_type?: 'link' | 'iframe' | 'embed_code' | null;
  subcategory_brands?: Array<{
    id: string;
    name: string;
    link?: string | null;
  }>;
}

export interface SearchHierarchyBrand {
  id: string;
  name: string;
  subcategory_id?: string | null;
  link?: string | null;
  subcategories?: {
    id?: string;
    name?: string;
    category_id?: string | null;
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
}

export interface SearchHierarchySection {
  id: string;
  heading?: string | null;
  name?: string | null;
}

interface BuildHierarchicalSearchResultsParams {
  query: string;
  categories: SearchHierarchyCategory[];
  subcategories: SearchHierarchySubcategory[];
  brands: SearchHierarchyBrand[];
  sections: SearchHierarchySection[];
}

export interface HierarchicalSearchResult {
  id: string;
  type: 'category' | 'subcategory' | 'brand' | 'brand_action_link' | 'section';
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

const normalizeQuery = (value: string) => value.trim().toLowerCase();

const highlightLabel = (label: string, query: string) => {
  if (!query) return label;

  return label;
};

export const buildHierarchicalSearchResults = ({
  query,
  categories,
  subcategories,
  brands,
  sections,
}: BuildHierarchicalSearchResultsParams): HierarchicalSearchResult[] => {
  const normalizedQuery = normalizeQuery(query);
  const results: HierarchicalSearchResult[] = [];

  categories.forEach((category) => {
    results.push({
      id: category.id,
      type: 'category',
      name: highlightLabel(category.name, query),
      categoryId: category.id,
    });
  });

  subcategories.forEach((subcategory) => {
    results.push({
      id: subcategory.id,
      type: 'subcategory',
      name: highlightLabel(subcategory.name, query),
      categoryId: subcategory.category_id ?? undefined,
      custom_link: subcategory.custom_link ?? null,
      custom_link_type: subcategory.custom_link_type ?? null,
    });
  });

  brands.forEach((brand) => {
    const parentSubcategory = brand.subcategories;
    const subcategoryName = parentSubcategory?.name ?? undefined;
    const subcategoryId = parentSubcategory?.id ?? brand.subcategory_id ?? undefined;
    const categoryId = parentSubcategory?.category_id ?? undefined;

    const baseResult: HierarchicalSearchResult = {
      id: brand.id,
      type: 'brand',
      name: highlightLabel(brand.name, query),
      categoryId,
      subcategoryId,
      subcategoryName,
      brandName: brand.name,
      link: brand.link ?? null,
      action_links: brand.action_links,
      action_link_1_text: brand.action_link_1_text ?? null,
      action_link_1_url: brand.action_link_1_url ?? null,
      action_link_1_new_tab: brand.action_link_1_new_tab ?? false,
      action_link_1_enabled: brand.action_link_1_enabled ?? false,
      action_link_2_text: brand.action_link_2_text ?? null,
      action_link_2_url: brand.action_link_2_url ?? null,
      action_link_2_new_tab: brand.action_link_2_new_tab ?? false,
      action_link_2_enabled: brand.action_link_2_enabled ?? false,
      action_link_3_text: brand.action_link_3_text ?? null,
      action_link_3_url: brand.action_link_3_url ?? null,
      action_link_3_new_tab: brand.action_link_3_new_tab ?? false,
      action_link_3_enabled: brand.action_link_3_enabled ?? false,
    };

    results.push(baseResult);

    if (brand.action_links?.some((link) => Boolean(link?.text || link?.url))) {
      brand.action_links.forEach((link, index) => {
        if (!link?.text && !link?.url) return;
        results.push({
          id: `${brand.id}-action-${index}`,
          type: 'brand_action_link',
          name: highlightLabel(link.text ?? link.url ?? 'Link', query),
          categoryId,
          subcategoryId,
          brandName: brand.name,
          link: link.url ?? null,
        });
      });
    }
  });

  sections.forEach((section) => {
    const sectionLabel = section.heading || section.name || 'Section';
    results.push({
      id: section.id,
      type: 'section',
      name: highlightLabel(sectionLabel, query),
      categoryId: undefined,
    });
  });

  return results;
};
