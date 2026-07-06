-- Create header_settings table
CREATE TABLE IF NOT EXISTS public.header_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    leave_review_text TEXT DEFAULT 'Leave a Review',
    leave_review_link TEXT DEFAULT '#',
    leave_review_visible BOOLEAN DEFAULT true,
    for_providers_text TEXT DEFAULT 'For Providers',
    for_providers_link TEXT DEFAULT '#',
    for_providers_visible BOOLEAN DEFAULT true,
    sign_in_text TEXT DEFAULT 'Sign In',
    sign_in_visible BOOLEAN DEFAULT true,
    join_text TEXT DEFAULT 'Join',
    join_link TEXT DEFAULT '#',
    join_visible BOOLEAN DEFAULT true,
    submit_button_text TEXT DEFAULT 'Submit',
    submit_button_link TEXT DEFAULT '#',
    submit_button_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.header_settings ENABLE ROW LEVEL SECURITY;

-- Create policies if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'header_settings' AND policyname = 'Public read header settings') THEN
        CREATE POLICY "Public read header settings" ON public.header_settings
            FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'header_settings' AND policyname = 'Admin write header settings') THEN
        CREATE POLICY "Admin write header settings" ON public.header_settings
            FOR ALL USING (public.has_role(auth.uid(), 'admin'));
    END IF;
END $$;

-- Insert default settings only if none exist
INSERT INTO public.header_settings (
    leave_review_text, leave_review_link, leave_review_visible,
    for_providers_text, for_providers_link, for_providers_visible,
    sign_in_text, sign_in_visible,
    join_text, join_link, join_visible
)
SELECT
    'Leave a Review', '#', true,
    'For Providers', '#', true,
    'Sign In', true,
    'Join', '#', true
WHERE NOT EXISTS (SELECT 1 FROM public.header_settings);

-- Add trigger for updated_at if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_header_settings_updated_at') THEN
        CREATE TRIGGER update_header_settings_updated_at
        BEFORE UPDATE ON public.header_settings
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;
