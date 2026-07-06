-- Create table for multiple About sections in subcategories
CREATE TABLE IF NOT EXISTS public.subcategory_about_sections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  subcategory_id uuid NOT NULL REFERENCES public.subcategories(id) ON DELETE CASCADE,
  heading TEXT DEFAULT 'About' NOT NULL,
  content TEXT,
  background_color TEXT DEFAULT '#ffffff',
  heading_color TEXT DEFAULT '#000000',
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.subcategory_about_sections ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read about sections
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subcategory_about_sections' AND policyname = 'Users can view about sections') THEN
    CREATE POLICY "Users can view about sections" ON public.subcategory_about_sections
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- Create policy for authenticated users to manage about sections
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subcategory_about_sections' AND policyname = 'Users can manage about sections') THEN
    CREATE POLICY "Users can manage about sections" ON public.subcategory_about_sections
      FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_subcategory_about_sections_subcategory_id ON public.subcategory_about_sections(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_subcategory_about_sections_sort_order ON public.subcategory_about_sections(sort_order);

-- Trigger to update updated_at column
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_subcategory_about_sections_updated_at') THEN
    CREATE TRIGGER handle_subcategory_about_sections_updated_at
      BEFORE UPDATE ON public.subcategory_about_sections
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;
