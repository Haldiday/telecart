
CREATE TABLE IF NOT EXISTS public.vendor_guidelines_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  heading TEXT NOT NULL DEFAULT 'Vendor Guidelines',
  content TEXT NOT NULL DEFAULT '',
  contact_email TEXT NOT NULL DEFAULT 'email@example.com',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert initial row if not exists
INSERT INTO public.vendor_guidelines_settings (heading, content, contact_email)
SELECT 'Vendor Guidelines', '', 'email@example.com'
WHERE NOT EXISTS (SELECT 1 FROM public.vendor_guidelines_settings);

ALTER TABLE public.vendor_guidelines_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read vendor guidelines settings"
    ON public.vendor_guidelines_settings
    FOR SELECT
    USING (true);

CREATE POLICY "Admins can write vendor guidelines settings"
    ON public.vendor_guidelines_settings
    FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_vendor_guidelines_settings_updated_at 
BEFORE UPDATE ON public.vendor_guidelines_settings 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
