-- Create footer_settings table
CREATE TABLE IF NOT EXISTS public.footer_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    twitter_label TEXT DEFAULT 'Twitter',
    twitter_link TEXT DEFAULT '#',
    twitter_visible BOOLEAN DEFAULT true,
    linkedin_label TEXT DEFAULT 'LinkedIn',
    linkedin_link TEXT DEFAULT '#',
    linkedin_visible BOOLEAN DEFAULT true,
    facebook_label TEXT DEFAULT 'Facebook',
    facebook_link TEXT DEFAULT '#',
    facebook_visible BOOLEAN DEFAULT true,
    instagram_label TEXT DEFAULT 'Instagram',
    instagram_link TEXT DEFAULT '#',
    instagram_visible BOOLEAN DEFAULT true,
    youtube_label TEXT DEFAULT 'YouTube',
    youtube_link TEXT DEFAULT '#',
    youtube_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.footer_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Public read footer settings" ON public.footer_settings
    FOR SELECT USING (true);

-- Create policy for admin write access
CREATE POLICY "Admin write footer settings" ON public.footer_settings
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Insert default settings
INSERT INTO public.footer_settings (
    twitter_label, twitter_link, twitter_visible,
    linkedin_label, linkedin_link, linkedin_visible,
    facebook_label, facebook_link, facebook_visible,
    instagram_label, instagram_link, instagram_visible,
    youtube_label, youtube_link, youtube_visible
) VALUES (
    'Twitter', '#', true,
    'LinkedIn', '#', true,
    'Facebook', '#', true,
    'Instagram', '#', false,
    'YouTube', '#', false
);

-- Add trigger for updated_at
CREATE TRIGGER update_footer_settings_updated_at 
BEFORE UPDATE ON public.footer_settings 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
