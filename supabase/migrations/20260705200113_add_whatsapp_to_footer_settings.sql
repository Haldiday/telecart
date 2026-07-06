-- Add WhatsApp fields to footer_settings table
ALTER TABLE public.footer_settings ADD COLUMN IF NOT EXISTS whatsapp_number TEXT DEFAULT '';
ALTER TABLE public.footer_settings ADD COLUMN IF NOT EXISTS whatsapp_visible BOOLEAN DEFAULT false;
