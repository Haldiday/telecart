-- Create subcategory_downloads table
CREATE TABLE IF NOT EXISTS public.subcategory_downloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL DEFAULT 'pdf',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subcategory_downloads ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subcategory_downloads' AND policyname = 'Public read subcategory downloads') THEN
    CREATE POLICY "Public read subcategory downloads" ON public.subcategory_downloads FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subcategory_downloads' AND policyname = 'Admin write subcategory downloads') THEN
    CREATE POLICY "Admin write subcategory downloads" ON public.subcategory_downloads FOR ALL USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;