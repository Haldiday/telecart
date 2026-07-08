-- Add background_color column to page_sections table
ALTER TABLE public.page_sections
ADD COLUMN IF NOT EXISTS background_color TEXT;
