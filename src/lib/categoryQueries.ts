import { supabase } from '@/integrations/supabase/client';

export interface CategoryBrand {
  id: string;
  name: string;
  link: string | null;
  sort_order: number;
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

export interface CategorySubcategory {
  id: string;
  name: string;
  link: string | null;
  custom_link?: string | null;
  custom_link_type?: 'link' | 'iframe' | null;
  sort_order: number;
  brands: CategoryBrand[];
}

export interface CategoryWithHierarchy {
  id: string;
  name: string;
  icon_url: string | null;
  bg_color: string;
  sort_order: number;
  subcategories: CategorySubcategory[];
}

const CATEGORY_SECTION_SELECT = `
  id,
  name,
  icon_url,
  bg_color,
  sort_order,
  is_visible,
  subcategories (
    id,
    name,
    link,
    custom_link,
    custom_link_type,
    sort_order,
    is_visible,
    category_id,
    subcategory_brands (
      id,
      name,
      link,
      sort_order,
      is_visible,
      subcategory_id,
      action_link_1_text,
      action_link_1_url,
      action_link_1_new_tab,
      action_link_1_enabled,
      action_link_2_text,
      action_link_2_url,
      action_link_2_new_tab,
      action_link_2_enabled,
      action_link_3_text,
      action_link_3_url,
      action_link_3_new_tab,
      action_link_3_enabled
    )
  )
`;

type RawBrand = CategoryBrand & { is_visible?: boolean | null };
type RawSubcategory = Omit<CategorySubcategory, 'brands'> & {
  is_visible?: boolean | null;
  subcategory_brands?: RawBrand[];
};
type RawCategory = Omit<CategoryWithHierarchy, 'subcategories'> & {
  is_visible?: boolean | null;
  subcategories?: RawSubcategory[];
};

function transformCategorySectionData(raw: RawCategory[]): CategoryWithHierarchy[] {
  return (raw ?? [])
    .filter((cat) => cat.is_visible !== false)
    .map((category) => ({
      id: category.id,
      name: category.name,
      icon_url: category.icon_url,
      bg_color: category.bg_color,
      sort_order: category.sort_order,
      subcategories: (category.subcategories ?? [])
        .filter((sub) => sub.is_visible !== false)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((sub) => ({
          id: sub.id,
          name: sub.name,
          link: sub.link,
          custom_link: sub.custom_link,
          custom_link_type: sub.custom_link_type,
          sort_order: sub.sort_order,
          brands: (sub.subcategory_brands ?? [])
            .filter((brand) => brand.is_visible !== false)
            .sort((a, b) => a.sort_order - b.sort_order)
            .map(({ is_visible: _isVisible, subcategory_id: _subcategoryId, ...brand }) => brand),
        })),
    }));
}

export async function fetchCategorySection(sectionId: string): Promise<CategoryWithHierarchy[]> {
  const { data, error } = await supabase
    .from('categories')
    .select(CATEGORY_SECTION_SELECT)
    .eq('section_id', sectionId)
    .order('sort_order')
    .order('sort_order', { foreignTable: 'subcategories' })
    .order('sort_order', { foreignTable: 'subcategories.subcategory_brands' });

  if (error) throw error;

  return transformCategorySectionData((data ?? []) as RawCategory[]);
}
