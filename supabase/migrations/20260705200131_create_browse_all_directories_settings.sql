
CREATE TABLE IF NOT EXISTS public.browse_all_directories_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  heading TEXT NOT NULL DEFAULT 'All Directories & Reviews',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert initial row if not exists
INSERT INTO public.browse_all_directories_settings (heading)
SELECT 'All Directories & Reviews'
WHERE NOT EXISTS (SELECT 1 FROM public.browse_all_directories_settings);

ALTER TABLE public.browse_all_directories_settings ENABLE ROW LEVEL SECURITY;

-- Create policies if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'browse_all_directories_settings' AND policyname = 'Public read browse all directories settings') THEN
        CREATE POLICY "Public read browse all directories settings"
            ON public.browse_all_directories_settings
            FOR SELECT
            USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'browse_all_directories_settings' AND policyname = 'Admins can write browse all directories settings') THEN
        CREATE POLICY "Admins can write browse all directories settings"
            ON public.browse_all_directories_settings
            FOR ALL
            USING (public.has_role(auth.uid(), 'admin'));
    END IF;
END $$;

-- Create trigger if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_browse_all_directories_settings_updated_at') THEN
        CREATE TRIGGER update_browse_all_directories_settings_updated_at
        BEFORE UPDATE ON public.browse_all_directories_settings
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

