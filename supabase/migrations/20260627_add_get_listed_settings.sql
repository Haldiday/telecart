
CREATE TABLE IF NOT EXISTS public.get_listed_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  main_heading TEXT NOT NULL DEFAULT 'Choose the best plan for your business.',
  comparison_heading TEXT NOT NULL DEFAULT 'Detailed pricing',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert initial row if not exists
INSERT INTO public.get_listed_settings (main_heading, comparison_heading)
SELECT 'Choose the best plan for your business.', 'Detailed pricing'
WHERE NOT EXISTS (SELECT 1 FROM public.get_listed_settings);

ALTER TABLE public.get_listed_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read get listed settings"
    ON public.get_listed_settings
    FOR SELECT
    USING (true);

CREATE POLICY "Admins can write get listed settings"
    ON public.get_listed_settings
    FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_get_listed_settings_updated_at 
BEFORE UPDATE ON public.get_listed_settings 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
