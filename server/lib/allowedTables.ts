/** Tables the backend is allowed to query. */
export const ALLOWED_TABLES = new Set([
  'page_sections',
  'hero_settings',
  'header_settings',
  'featured_cards',
  'categories',
  'subcategories',
  'subcategory_brands',
  'offers',
  'ads_1col',
  'ads_2col',
  'ads_3col',
  'category_buttons',
  'category_products',
  'subcategory_about_sections',
  'subcategory_key_features_sections',
  'subcategory_overview_points',
  'subcategory_page_sections',
  'subcategory_featured_cards',
  'subcategory_offers',
  'subcategory_ads_2col',
  'subcategory_ads_3col',
  'subcategory_downloads',
  'contact_settings',
  'legal_pages',
  'footer_settings',
  'footer_subscribers',
  'faqs',
  'advertise_page_settings',
  'advertise_cards',
  'advertise_sections',
  'get_listed_plans',
  'get_listed_plan_features',
  'get_listed_comparison_rows',
  'get_listed_comparison_cells',
  'get_listed_settings',
  'write_for_us_settings',
  'vendor_guidelines_settings',
  'browse_all_directories_settings',
  'user_roles',
  'category_page_sections',
  'category_featured_cards',
  'category_offers',
  'category_ads_1col',
  'category_ads_2col',
  'category_ads_3col',
]);

/** Public insert allowed without admin auth. */
export const PUBLIC_INSERT_TABLES = new Set(['footer_subscribers']);

export function assertAllowedTable(table: string): void {
  if (!ALLOWED_TABLES.has(table)) {
    throw new Error(`Table "${table}" is not allowed`);
  }
}
