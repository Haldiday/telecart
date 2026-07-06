-- Add RLS policies to category_buttons table
ALTER TABLE public.category_buttons ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'category_buttons' AND policyname = 'Public read buttons') THEN
    CREATE POLICY "Public read buttons" ON public.category_buttons FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'category_buttons' AND policyname = 'Admin write buttons') THEN
    CREATE POLICY "Admin write buttons" ON public.category_buttons FOR ALL USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;
