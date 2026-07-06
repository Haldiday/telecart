-- Create app_role enum if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role' AND typnamespace = 'public'::regnamespace) THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'user');
    END IF;
END
$$;

-- Create user_roles table if not exists
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create policies if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND policyname = 'Anyone can read roles') THEN
        CREATE POLICY "Anyone can read roles" ON public.user_roles FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND policyname = 'Only admins can manage roles') THEN
        CREATE POLICY "Only admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));
    END IF;
END
$$;

-- Hero settings
CREATE TABLE IF NOT EXISTS public.hero_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    main_text TEXT NOT NULL DEFAULT 'The AI Voice Agent That Helps You Scale',
    animated_words TEXT[] NOT NULL DEFAULT ARRAY['Loan Collection', 'Last Mile Delivery', 'Lead Generation'],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.hero_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hero_settings' AND policyname = 'Public read hero') THEN
        CREATE POLICY "Public read hero" ON public.hero_settings FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hero_settings' AND policyname = 'Admin write hero') THEN
        CREATE POLICY "Admin write hero" ON public.hero_settings FOR ALL USING (public.has_role(auth.uid(), 'admin'));
    END IF;
END
$$;

-- Featured cards
CREATE TABLE IF NOT EXISTS public.featured_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    logo_url TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.featured_cards ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'featured_cards' AND policyname = 'Public read cards') THEN
        CREATE POLICY "Public read cards" ON public.featured_cards FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'featured_cards' AND policyname = 'Admin write cards') THEN
        CREATE POLICY "Admin write cards" ON public.featured_cards FOR ALL USING (public.has_role(auth.uid(), 'admin'));
    END IF;
END
$$;

-- Categories
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    icon_url TEXT,
    bg_color TEXT NOT NULL DEFAULT '#FFF9C4',
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Public read categories') THEN
        CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Admin write categories') THEN
        CREATE POLICY "Admin write categories" ON public.categories FOR ALL USING (public.has_role(auth.uid(), 'admin'));
    END IF;
END
$$;

-- Subcategories
CREATE TABLE IF NOT EXISTS public.subcategories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    link TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subcategories' AND policyname = 'Public read subcategories') THEN
        CREATE POLICY "Public read subcategories" ON public.subcategories FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subcategories' AND policyname = 'Admin write subcategories') THEN
        CREATE POLICY "Admin write subcategories" ON public.subcategories FOR ALL USING (public.has_role(auth.uid(), 'admin'));
    END IF;
END
$$;

-- Offers
CREATE TABLE IF NOT EXISTS public.offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT,
    heading TEXT NOT NULL,
    description TEXT,
    link TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'offers' AND policyname = 'Public read offers') THEN
        CREATE POLICY "Public read offers" ON public.offers FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'offers' AND policyname = 'Admin write offers') THEN
        CREATE POLICY "Admin write offers" ON public.offers FOR ALL USING (public.has_role(auth.uid(), 'admin'));
    END IF;
END
$$;

-- 2-column ads
CREATE TABLE IF NOT EXISTS public.ads_2col (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT,
    link TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ads_2col ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ads_2col' AND policyname = 'Public read ads_2col') THEN
        CREATE POLICY "Public read ads_2col" ON public.ads_2col FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ads_2col' AND policyname = 'Admin write ads_2col') THEN
        CREATE POLICY "Admin write ads_2col" ON public.ads_2col FOR ALL USING (public.has_role(auth.uid(), 'admin'));
    END IF;
END
$$;

-- 3-column ads
CREATE TABLE IF NOT EXISTS public.ads_3col (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT,
    link TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ads_3col ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ads_3col' AND policyname = 'Public read ads_3col') THEN
        CREATE POLICY "Public read ads_3col" ON public.ads_3col FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ads_3col' AND policyname = 'Admin write ads_3col') THEN
        CREATE POLICY "Admin write ads_3col" ON public.ads_3col FOR ALL USING (public.has_role(auth.uid(), 'admin'));
    END IF;
END
$$;

-- Page sections (for drag and drop ordering)
CREATE TABLE IF NOT EXISTS public.page_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_type TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_visible BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.page_sections ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'page_sections' AND policyname = 'Public read sections') THEN
        CREATE POLICY "Public read sections" ON public.page_sections FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'page_sections' AND policyname = 'Admin write sections') THEN
        CREATE POLICY "Admin write sections" ON public.page_sections FOR ALL USING (public.has_role(auth.uid(), 'admin'));
    END IF;
END
$$;

-- Category downloads
CREATE TABLE IF NOT EXISTS public.category_downloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL DEFAULT 'pdf',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.category_downloads ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'category_downloads' AND policyname = 'Public read downloads') THEN
        CREATE POLICY "Public read downloads" ON public.category_downloads FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'category_downloads' AND policyname = 'Admin write downloads') THEN
        CREATE POLICY "Admin write downloads" ON public.category_downloads FOR ALL USING (public.has_role(auth.uid(), 'admin'));
    END IF;
END
$$;

-- Category features
CREATE TABLE IF NOT EXISTS public.category_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.category_features ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'category_features' AND policyname = 'Public read features') THEN
        CREATE POLICY "Public read features" ON public.category_features FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'category_features' AND policyname = 'Admin write features') THEN
        CREATE POLICY "Admin write features" ON public.category_features FOR ALL USING (public.has_role(auth.uid(), 'admin'));
    END IF;
END
$$;

-- Category sub-features
CREATE TABLE IF NOT EXISTS public.category_sub_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_id UUID REFERENCES public.category_features(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.category_sub_features ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'category_sub_features' AND policyname = 'Public read sub_features') THEN
        CREATE POLICY "Public read sub_features" ON public.category_sub_features FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'category_sub_features' AND policyname = 'Admin write sub_features') THEN
        CREATE POLICY "Admin write sub_features" ON public.category_sub_features FOR ALL USING (public.has_role(auth.uid(), 'admin'));
    END IF;
END
$$;

-- Storage bucket for uploads (insert if not exists)
INSERT INTO storage.buckets (id, name, public)
SELECT 'uploads', 'uploads', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'uploads'
);

-- Storage policies (create if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public read uploads' AND schemaname = 'storage') THEN
        CREATE POLICY "Public read uploads" ON storage.objects FOR SELECT USING (bucket_id = 'uploads');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Admin upload files' AND schemaname = 'storage') THEN
        CREATE POLICY "Admin upload files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'uploads' AND public.has_role(auth.uid(), 'admin'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Admin update files' AND schemaname = 'storage') THEN
        CREATE POLICY "Admin update files" ON storage.objects FOR UPDATE USING (bucket_id = 'uploads' AND public.has_role(auth.uid(), 'admin'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Admin delete files' AND schemaname = 'storage') THEN
        CREATE POLICY "Admin delete files" ON storage.objects FOR DELETE USING (bucket_id = 'uploads' AND public.has_role(auth.uid(), 'admin'));
    END IF;
END
$$;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers (create if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_hero_settings_updated_at') THEN
        CREATE TRIGGER update_hero_settings_updated_at BEFORE UPDATE ON public.hero_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_featured_cards_updated_at') THEN
        CREATE TRIGGER update_featured_cards_updated_at BEFORE UPDATE ON public.featured_cards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_categories_updated_at') THEN
        CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_offers_updated_at') THEN
        CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON public.offers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END
$$;

-- Insert default page sections (only if they don't exist)
INSERT INTO public.page_sections (section_type, sort_order)
SELECT 'hero', 0
WHERE NOT EXISTS (SELECT 1 FROM public.page_sections WHERE section_type = 'hero');

INSERT INTO public.page_sections (section_type, sort_order)
SELECT 'cards', 1
WHERE NOT EXISTS (SELECT 1 FROM public.page_sections WHERE section_type = 'cards');

INSERT INTO public.page_sections (section_type, sort_order)
SELECT 'categories', 2
WHERE NOT EXISTS (SELECT 1 FROM public.page_sections WHERE section_type = 'categories');

INSERT INTO public.page_sections (section_type, sort_order)
SELECT 'offers', 3
WHERE NOT EXISTS (SELECT 1 FROM public.page_sections WHERE section_type = 'offers');

INSERT INTO public.page_sections (section_type, sort_order)
SELECT 'ads_2col', 4
WHERE NOT EXISTS (SELECT 1 FROM public.page_sections WHERE section_type = 'ads_2col');

INSERT INTO public.page_sections (section_type, sort_order)
SELECT 'ads_3col', 5
WHERE NOT EXISTS (SELECT 1 FROM public.page_sections WHERE section_type = 'ads_3col');

-- Insert default hero settings (only if none exist)
INSERT INTO public.hero_settings (main_text, animated_words)
SELECT 'The AI Voice Agent That Helps You Scale', ARRAY['Loan Collection', 'Last Mile Delivery', 'Lead Generation']
WHERE NOT EXISTS (SELECT 1 FROM public.hero_settings);