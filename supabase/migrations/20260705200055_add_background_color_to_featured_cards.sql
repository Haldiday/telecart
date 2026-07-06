ALTER TABLE public.featured_cards
ADD COLUMN IF NOT EXISTS background_color TEXT;

ALTER TABLE public.subcategory_featured_cards
ADD COLUMN IF NOT EXISTS background_color TEXT;
