-- Add tab_order column to subcategories table
ALTER TABLE public.subcategories
ADD COLUMN IF NOT EXISTS tab_order JSONB DEFAULT '["overview", "resources", "downloads", "key_features", "pricing", "brands", "form"]'::jsonb;
