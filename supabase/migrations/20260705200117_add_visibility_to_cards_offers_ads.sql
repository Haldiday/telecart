
-- Add is_visible to featured_cards
ALTER TABLE public.featured_cards
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;

-- Add is_visible to offers
ALTER TABLE public.offers
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;

-- Add is_visible to ads_2col
ALTER TABLE public.ads_2col
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;

-- Add is_visible to ads_3col
ALTER TABLE public.ads_3col
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;

-- Update existing records
UPDATE public.featured_cards SET is_visible = true WHERE is_visible IS NULL;
UPDATE public.offers SET is_visible = true WHERE is_visible IS NULL;
UPDATE public.ads_2col SET is_visible = true WHERE is_visible IS NULL;
UPDATE public.ads_3col SET is_visible = true WHERE is_visible IS NULL;
