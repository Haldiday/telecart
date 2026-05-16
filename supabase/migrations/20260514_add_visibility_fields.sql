-- Add is_visible field to subcategory_about_sections table
ALTER TABLE public.subcategory_about_sections
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;

-- Add show_header_points_section field to subcategories table
ALTER TABLE public.subcategories
ADD COLUMN IF NOT EXISTS show_header_points_section BOOLEAN DEFAULT true;

-- Update existing records with default values
UPDATE public.subcategory_about_sections SET is_visible = true WHERE is_visible IS NULL;
UPDATE public.subcategories SET show_header_points_section = true WHERE show_header_points_section IS NULL;
