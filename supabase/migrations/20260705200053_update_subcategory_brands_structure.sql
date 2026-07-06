-- Update subcategory_brands table to include description and buttons
ALTER TABLE public.subcategory_brands 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS buttons JSONB DEFAULT '[]'::jsonb;
