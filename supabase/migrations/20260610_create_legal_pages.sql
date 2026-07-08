-- Create legal_pages table
CREATE TABLE IF NOT EXISTS public.legal_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL, -- 'privacy-policy', 'terms-of-service'
    title TEXT NOT NULL,
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.legal_pages ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Public read legal pages" ON public.legal_pages
    FOR SELECT USING (true);

-- Create policy for admin write access
CREATE POLICY "Admin write legal pages" ON public.legal_pages
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Insert initial pages
INSERT INTO public.legal_pages (slug, title, content)
VALUES 
    ('privacy-policy', 'Privacy Policy', '<h1>Privacy Policy</h1><p>Welcome to our Privacy Policy page.</p>'),
    ('terms-of-service', 'Terms of Service', '<h1>Terms of Service</h1><p>Welcome to our Terms of Service page.</p>')
ON CONFLICT (slug) DO NOTHING;

-- Add trigger for updated_at
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_legal_pages_updated_at') THEN
            CREATE TRIGGER update_legal_pages_updated_at 
            BEFORE UPDATE ON public.legal_pages 
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
        END IF;
    END IF;
END $$;
