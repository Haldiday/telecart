-- Add is_visible column to categories table
ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT TRUE;
