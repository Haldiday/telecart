
CREATE TABLE IF NOT EXISTS public.write_for_us_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  heading TEXT NOT NULL DEFAULT 'Write For Us',
  banner_image_url TEXT,
  content TEXT NOT NULL DEFAULT '',
  contact_email TEXT NOT NULL DEFAULT 'email@example.com',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert initial row if not exists
INSERT INTO public.write_for_us_settings (heading, banner_image_url, content, contact_email)
SELECT 'Write For Us', NULL, '', 'email@example.com'
WHERE NOT EXISTS (SELECT 1 FROM public.write_for_us_settings);

ALTER TABLE public.write_for_us_settings ENABLE ROW LEVEL SECURITY;

-- Create policies if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'write_for_us_settings' AND policyname = 'Public read write for us settings') THEN
        CREATE POLICY "Public read write for us settings"
            ON public.write_for_us_settings
            FOR SELECT
            USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'write_for_us_settings' AND policyname = 'Admins can write write for us settings') THEN
        CREATE POLICY "Admins can write write for us settings"
            ON public.write_for_us_settings
            FOR ALL
            USING (public.has_role(auth.uid(), 'admin'));
    END IF;
END $$;

-- Create trigger if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_write_for_us_settings_updated_at') THEN
        CREATE TRIGGER update_write_for_us_settings_updated_at
        BEFORE UPDATE ON public.write_for_us_settings
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;
