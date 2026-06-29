
-- Add USD price and button link fields to get_listed_plans table
ALTER TABLE public.get_listed_plans 
ADD COLUMN IF NOT EXISTS price_usd NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS button_link_usd TEXT;
