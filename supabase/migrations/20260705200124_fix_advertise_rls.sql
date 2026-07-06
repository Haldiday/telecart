
-- Fix RLS policies for advertise tables (if tables already exist)

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Public read advertise page settings" ON public.advertise_page_settings;
DROP POLICY IF EXISTS "Admins can write advertise page settings" ON public.advertise_page_settings;
DROP POLICY IF EXISTS "Public read advertise cards" ON public.advertise_cards;
DROP POLICY IF EXISTS "Admins can write advertise cards" ON public.advertise_cards;
DROP POLICY IF EXISTS "Public read advertise sections" ON public.advertise_sections;
DROP POLICY IF EXISTS "Admins can write advertise sections" ON public.advertise_sections;

-- Enable RLS (if not already enabled)
ALTER TABLE IF EXISTS public.advertise_page_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.advertise_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.advertise_sections ENABLE ROW LEVEL SECURITY;

-- Create correct policies for advertise_page_settings
DO $$ BEGIN
  CREATE POLICY "Public read advertise page settings"
      ON public.advertise_page_settings
      FOR SELECT
      USING (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can write advertise page settings"
      ON public.advertise_page_settings
      FOR ALL
      USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create correct policies for advertise_cards
DO $$ BEGIN
  CREATE POLICY "Public read advertise cards"
      ON public.advertise_cards
      FOR SELECT
      USING (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can write advertise cards"
      ON public.advertise_cards
      FOR ALL
      USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create correct policies for advertise_sections
DO $$ BEGIN
  CREATE POLICY "Public read advertise sections"
      ON public.advertise_sections
      FOR SELECT
      USING (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can write advertise sections"
      ON public.advertise_sections
      FOR ALL
      USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add updated_at triggers if they don't exist
DROP TRIGGER IF EXISTS update_advertise_page_settings_updated_at ON public.advertise_page_settings;
DROP TRIGGER IF EXISTS update_advertise_cards_updated_at ON public.advertise_cards;
DROP TRIGGER IF EXISTS update_advertise_sections_updated_at ON public.advertise_sections;

DO $$ BEGIN
  CREATE TRIGGER update_advertise_page_settings_updated_at 
  BEFORE UPDATE ON public.advertise_page_settings 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_advertise_cards_updated_at 
  BEFORE UPDATE ON public.advertise_cards 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_advertise_sections_updated_at 
  BEFORE UPDATE ON public.advertise_sections 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
