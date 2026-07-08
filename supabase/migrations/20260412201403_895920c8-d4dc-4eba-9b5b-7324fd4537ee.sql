-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
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

-- User roles policies
CREATE POLICY "Anyone can read roles" ON public.user_roles FOR SELECT USING (true);
CREATE POLICY "Only admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Hero settings
CREATE TABLE public.hero_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    main_text TEXT NOT NULL DEFAULT 'The AI Voice Agent That Helps You Scale',
    animated_words TEXT[] NOT NULL DEFAULT ARRAY['Loan Collection', 'Last Mile Delivery', 'Lead Generation'],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.hero_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read hero" ON public.hero_settings FOR SELECT USING (true);
CREATE POLICY "Admin write hero" ON public.hero_settings FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Featured cards
CREATE TABLE public.featured_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    logo_url TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.featured_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read cards" ON public.featured_cards FOR SELECT USING (true);
CREATE POLICY "Admin write cards" ON public.featured_cards FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Categories
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    icon_url TEXT,
    bg_color TEXT NOT NULL DEFAULT '#FFF9C4',
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admin write categories" ON public.categories FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Subcategories
CREATE TABLE public.subcategories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    link TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read subcategories" ON public.subcategories FOR SELECT USING (true);
CREATE POLICY "Admin write subcategories" ON public.subcategories FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Offers
CREATE TABLE public.offers (
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
CREATE POLICY "Public read offers" ON public.offers FOR SELECT USING (true);
CREATE POLICY "Admin write offers" ON public.offers FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 2-column ads
CREATE TABLE public.ads_2col (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT,
    link TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ads_2col ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read ads_2col" ON public.ads_2col FOR SELECT USING (true);
CREATE POLICY "Admin write ads_2col" ON public.ads_2col FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 3-column ads
CREATE TABLE public.ads_3col (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT,
    link TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ads_3col ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read ads_3col" ON public.ads_3col FOR SELECT USING (true);
CREATE POLICY "Admin write ads_3col" ON public.ads_3col FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Page sections (for drag and drop ordering)
CREATE TABLE public.page_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_type TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_visible BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.page_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read sections" ON public.page_sections FOR SELECT USING (true);
CREATE POLICY "Admin write sections" ON public.page_sections FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Category downloads
CREATE TABLE public.category_downloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL DEFAULT 'pdf',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.category_downloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read downloads" ON public.category_downloads FOR SELECT USING (true);
CREATE POLICY "Admin write downloads" ON public.category_downloads FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Category features
CREATE TABLE public.category_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.category_features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read features" ON public.category_features FOR SELECT USING (true);
CREATE POLICY "Admin write features" ON public.category_features FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Category sub-features
CREATE TABLE public.category_sub_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_id UUID REFERENCES public.category_features(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.category_sub_features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read sub_features" ON public.category_sub_features FOR SELECT USING (true);
CREATE POLICY "Admin write sub_features" ON public.category_sub_features FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Storage bucket for uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true);

CREATE POLICY "Public read uploads" ON storage.objects FOR SELECT USING (bucket_id = 'uploads');
CREATE POLICY "Admin upload files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'uploads' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update files" ON storage.objects FOR UPDATE USING (bucket_id = 'uploads' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete files" ON storage.objects FOR DELETE USING (bucket_id = 'uploads' AND public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers
CREATE TRIGGER update_hero_settings_updated_at BEFORE UPDATE ON public.hero_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_featured_cards_updated_at BEFORE UPDATE ON public.featured_cards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON public.offers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default page sections
INSERT INTO public.page_sections (section_type, sort_order) VALUES
('hero', 0),
('cards', 1),
('categories', 2),
('offers', 3),
('ads_2col', 4),
('ads_3col', 5);

-- Insert default hero settings
INSERT INTO public.hero_settings (main_text, animated_words) VALUES
('The AI Voice Agent That Helps You Scale', ARRAY['Loan Collection', 'Last Mile Delivery', 'Lead Generation']);