-- Add about section fields to subcategories table
ALTER TABLE public.subcategories
ADD COLUMN IF NOT EXISTS about_heading TEXT DEFAULT 'About',
ADD COLUMN IF NOT EXISTS about_content TEXT;
