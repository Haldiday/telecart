-- Add contact fields to footer_settings table
ALTER TABLE public.footer_settings
ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS email_visible BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS phone_visible BOOLEAN DEFAULT false;

-- Update existing records to have default values
UPDATE public.footer_settings
SET 
    email = COALESCE(email, ''),
    email_visible = COALESCE(email_visible, false),
    phone = COALESCE(phone, ''),
    phone_visible = COALESCE(phone_visible, false);
