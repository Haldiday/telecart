-- Add custom tab label columns to subcategories table
ALTER TABLE public.subcategories
ADD COLUMN IF NOT EXISTS resources_tab_label TEXT DEFAULT 'Resources',
ADD COLUMN IF NOT EXISTS downloads_tab_label TEXT DEFAULT 'Downloads',
ADD COLUMN IF NOT EXISTS brands_tab_label TEXT DEFAULT 'Brands';
