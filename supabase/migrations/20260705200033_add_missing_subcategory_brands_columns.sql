-- Add missing columns to subcategory_brands table
ALTER TABLE public.subcategory_brands 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT true;
