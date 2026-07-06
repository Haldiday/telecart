-- Add contact_intro_text column to write_for_us_settings table
ALTER TABLE write_for_us_settings 
ADD COLUMN IF NOT EXISTS contact_intro_text TEXT DEFAULT 'Or else you connect with us at';

-- Add contact_intro_text column to vendor_guidelines_settings table
ALTER TABLE vendor_guidelines_settings 
ADD COLUMN IF NOT EXISTS contact_intro_text TEXT DEFAULT 'Or else you connect with us at';
