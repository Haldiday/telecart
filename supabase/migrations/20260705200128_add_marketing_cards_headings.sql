
-- Add marketing cards headings columns to advertise_page_settings
ALTER TABLE public.advertise_page_settings 
ADD COLUMN IF NOT EXISTS marketing_cards_main_heading TEXT NOT NULL DEFAULT 'Marketing Strategies',
ADD COLUMN IF NOT EXISTS marketing_cards_subheading TEXT NOT NULL DEFAULT 'that can do wonders for your business';
