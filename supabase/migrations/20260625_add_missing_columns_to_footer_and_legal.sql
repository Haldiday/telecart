-- Add missing columns to footer_settings
ALTER TABLE public.footer_settings
ADD COLUMN IF NOT EXISTS faq_heading TEXT DEFAULT 'Frequently Asked Questions',
ADD COLUMN IF NOT EXISTS faq_heading_visible BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS faq_visible BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS whatsapp_visible BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS phone_visible BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS email_visible BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS for_businesses_title TEXT DEFAULT 'For Businesses',
ADD COLUMN IF NOT EXISTS for_businesses_links JSONB DEFAULT '[{"label": "Get Listed", "link": "#", "is_visible": true}, {"label": "Advertise", "link": "#", "is_visible": true}, {"label": "Write for Us", "link": "#", "is_visible": true}]'::jsonb;

-- Add is_visible to legal_pages
ALTER TABLE public.legal_pages
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT TRUE;

-- Update existing records
UPDATE public.footer_settings
SET 
    faq_heading = COALESCE(faq_heading, 'Frequently Asked Questions'),
    faq_heading_visible = COALESCE(faq_heading_visible, TRUE),
    faq_visible = COALESCE(faq_visible, TRUE),
    is_visible = COALESCE(is_visible, TRUE),
    whatsapp_number = COALESCE(whatsapp_number, ''),
    whatsapp_visible = COALESCE(whatsapp_visible, FALSE),
    phone = COALESCE(phone, ''),
    phone_visible = COALESCE(phone_visible, FALSE),
    email = COALESCE(email, ''),
    email_visible = COALESCE(email_visible, FALSE),
    for_businesses_title = COALESCE(for_businesses_title, 'For Businesses'),
    for_businesses_links = COALESCE(for_businesses_links, '[{"label": "Get Listed", "link": "#", "is_visible": true}, {"label": "Advertise", "link": "#", "is_visible": true}, {"label": "Write for Us", "link": "#", "is_visible": true}]'::jsonb);

UPDATE public.legal_pages
SET is_visible = COALESCE(is_visible, TRUE);
