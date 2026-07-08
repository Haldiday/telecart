-- Add configurable colors for pricing plan cards and buttons
ALTER TABLE public.pricing_plans
ADD COLUMN IF NOT EXISTS card_bg_color TEXT,
ADD COLUMN IF NOT EXISTS button_bg_color TEXT;

