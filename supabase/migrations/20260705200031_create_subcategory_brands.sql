-- Create subcategory_brands table
CREATE TABLE IF NOT EXISTS public.subcategory_brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    link TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subcategory_brands ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subcategory_brands' AND policyname = 'Public read subcategory brands') THEN
    CREATE POLICY "Public read subcategory brands" ON public.subcategory_brands FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subcategory_brands' AND policyname = 'Admin write subcategory brands') THEN
    CREATE POLICY "Admin write subcategory brands" ON public.subcategory_brands FOR ALL USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;