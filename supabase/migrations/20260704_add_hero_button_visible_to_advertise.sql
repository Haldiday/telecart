
ALTER TABLE public.advertise_page_settings 
ADD COLUMN IF NOT EXISTS hero_button_visible BOOLEAN NOT NULL DEFAULT TRUE;
