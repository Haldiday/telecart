-- Add editable detail fields for category detail pages
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS subcategories_tab_label text,
  ADD COLUMN IF NOT EXISTS detail_heading text,
  ADD COLUMN IF NOT EXISTS detail_description text;
