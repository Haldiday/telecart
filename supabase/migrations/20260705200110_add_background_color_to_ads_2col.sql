ALTER TABLE public.ads_2col
ADD COLUMN IF NOT EXISTS background_color TEXT;

ALTER TABLE public.subcategory_ads_2col
ADD COLUMN IF NOT EXISTS background_color TEXT;
