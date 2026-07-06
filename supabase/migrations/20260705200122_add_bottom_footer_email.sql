ALTER TABLE footer_settings
ADD COLUMN IF NOT EXISTS bottom_footer_email TEXT,
ADD COLUMN IF NOT EXISTS bottom_footer_email_visible BOOLEAN DEFAULT false;