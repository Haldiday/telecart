-- Add link column to featured_cards table
ALTER TABLE public.featured_cards ADD COLUMN IF NOT EXISTS link TEXT;
