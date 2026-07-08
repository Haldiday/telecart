ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS show_brands_tab BOOLEAN NOT NULL DEFAULT true;
