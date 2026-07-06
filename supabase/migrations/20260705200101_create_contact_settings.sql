-- Create contact_settings table
CREATE TABLE IF NOT EXISTS public.contact_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    heading TEXT DEFAULT 'Contact',
    email_label TEXT DEFAULT 'You can contact our Support Team by email:',
    email TEXT DEFAULT 'office@freeprivacypolicy.com',
    description_1 TEXT DEFAULT 'If you haven''t received the download link to your Privacy Policy (or any other policy) yet, please check your Spam/Junk folder before contacting us.',
    description_2 TEXT DEFAULT 'Please note that we provide customer support through email at the moment.',
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.contact_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_settings' AND policyname = 'Public read contact settings') THEN
    CREATE POLICY "Public read contact settings" ON public.contact_settings
        FOR SELECT USING (true);
  END IF;
END $$;

-- Create policy for admin write access
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_settings' AND policyname = 'Admin write contact settings') THEN
    CREATE POLICY "Admin write contact settings" ON public.contact_settings
        FOR ALL USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Insert default settings
INSERT INTO public.contact_settings (
    heading, email_label, email, description_1, description_2
) 
SELECT 
    'Contact', 
    'You can contact our Support Team by email:', 
    'office@freeprivacypolicy.com', 
    'If you haven''t received the download link to your Privacy Policy (or any other policy) yet, please check your Spam/Junk folder before contacting us.', 
    'Please note that we provide customer support through email at the moment.'
WHERE NOT EXISTS (SELECT 1 FROM public.contact_settings);

-- Add trigger for updated_at if function exists and trigger doesn't exist
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_contact_settings_updated_at') THEN
      CREATE TRIGGER update_contact_settings_updated_at 
        BEFORE UPDATE ON public.contact_settings 
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
  END IF;
END $$;
