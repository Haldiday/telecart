-- Add bottom branding control fields to footer_settings table
ALTER TABLE public.footer_settings
ADD COLUMN IF NOT EXISTS bottom_branding_visible BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS bottom_branding_text TEXT DEFAULT '';
