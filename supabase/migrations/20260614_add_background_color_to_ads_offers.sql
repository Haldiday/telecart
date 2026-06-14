ALTER TABLE public.ads_3col
ADD COLUMN IF NOT EXISTS background_color TEXT;

ALTER TABLE public.subcategory_ads_3col
ADD COLUMN IF NOT EXISTS background_color TEXT;

ALTER TABLE public.offers
ADD COLUMN IF NOT EXISTS background_color TEXT;

ALTER TABLE public.subcategory_offers
ADD COLUMN IF NOT EXISTS background_color TEXT;
