-- Create subcategory_brands table
CREATE TABLE public.subcategory_brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    link TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subcategory_brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read subcategory brands" ON public.subcategory_brands FOR SELECT USING (true);
CREATE POLICY "Admin write subcategory brands" ON public.subcategory_brands FOR ALL USING (public.has_role(auth.uid(), 'admin'));