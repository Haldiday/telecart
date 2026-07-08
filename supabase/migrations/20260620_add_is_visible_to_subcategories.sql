-- Add missing visibility flag to subcategories table
ALTER TABLE public.subcategories
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;

UPDATE public.subcategories
SET is_visible = true
WHERE is_visible IS NULL;
