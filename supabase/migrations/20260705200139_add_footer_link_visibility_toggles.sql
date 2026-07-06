-- Add visibility toggles for footer navigation links
ALTER TABLE public.footer_settings
ADD COLUMN IF NOT EXISTS get_listed_visible BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS advertise_visible BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS write_for_us_visible BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS vendor_guidelines_visible BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS view_all_categories_visible BOOLEAN DEFAULT true;