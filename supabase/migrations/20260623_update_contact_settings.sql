-- Update contact_settings table to add new fields
ALTER TABLE public.contact_settings
ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS whatsapp TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS form_embed TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS contact_emails JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS nodal_officer_title TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS nodal_officer_name TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS nodal_officer_phone TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS nodal_officer_email TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS appellate_authority_title TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS appellate_authority_name TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS appellate_authority_phone TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS appellate_authority_email TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT TRUE;

-- Update existing records to have default values for new fields
UPDATE public.contact_settings
SET 
    phone = COALESCE(phone, ''),
    whatsapp = COALESCE(whatsapp, ''),
    address = COALESCE(address, ''),
    form_embed = COALESCE(form_embed, ''),
    contact_emails = COALESCE(contact_emails, '[]'::jsonb),
    nodal_officer_title = COALESCE(nodal_officer_title, ''),
    nodal_officer_name = COALESCE(nodal_officer_name, ''),
    nodal_officer_phone = COALESCE(nodal_officer_phone, ''),
    nodal_officer_email = COALESCE(nodal_officer_email, ''),
    appellate_authority_title = COALESCE(appellate_authority_title, ''),
    appellate_authority_name = COALESCE(appellate_authority_name, ''),
    appellate_authority_phone = COALESCE(appellate_authority_phone, ''),
    appellate_authority_email = COALESCE(appellate_authority_email, ''),
    is_visible = COALESCE(is_visible, TRUE);
