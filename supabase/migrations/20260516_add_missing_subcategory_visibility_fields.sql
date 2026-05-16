-- Add missing fields to subcategories table
ALTER TABLE public.subcategories
ADD COLUMN IF NOT EXISTS show_pricing_plans BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_brands BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_resources BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_downloads BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS custom_link TEXT NULL;

-- Update existing records to ensure they have default values
UPDATE public.subcategories SET show_pricing_plans = true WHERE show_pricing_plans IS NULL;
UPDATE public.subcategories SET show_brands = true WHERE show_brands IS NULL;
UPDATE public.subcategories SET show_resources = true WHERE show_resources IS NULL;
UPDATE public.subcategories SET show_downloads = true WHERE show_downloads IS NULL;
