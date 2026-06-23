ALTER TABLE footer_settings
ADD COLUMN bottom_footer_email TEXT,
ADD COLUMN bottom_footer_email_visible BOOLEAN DEFAULT false;