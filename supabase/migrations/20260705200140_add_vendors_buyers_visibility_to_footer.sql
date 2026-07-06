-- Add visibility toggles for vendors and buyers columns in footer
ALTER TABLE public.footer_settings
ADD COLUMN IF NOT EXISTS vendors_visible BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS buyers_visible BOOLEAN DEFAULT true;
