ALTER TABLE public.hero_settings
  ADD COLUMN IF NOT EXISTS hero_search_visible BOOLEAN NOT NULL DEFAULT TRUE;

