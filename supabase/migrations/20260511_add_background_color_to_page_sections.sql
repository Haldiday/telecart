-- Add background_color column to subcategory_page_sections table
ALTER TABLE public.subcategory_page_sections
ADD COLUMN IF NOT EXISTS background_color TEXT;
