
CREATE TABLE IF NOT EXISTS public.advertise_page_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hero_small_heading TEXT NOT NULL DEFAULT '',
  hero_main_heading TEXT NOT NULL DEFAULT '',
  hero_description TEXT NOT NULL DEFAULT '',
  hero_button_text TEXT,
  hero_button_link TEXT,
  hero_image_url TEXT,
  hero_image_visible BOOLEAN NOT NULL DEFAULT TRUE,
  hero_visible BOOLEAN NOT NULL DEFAULT TRUE,
  section3_small_heading TEXT NOT NULL DEFAULT '',
  section3_main_heading TEXT NOT NULL DEFAULT '',
  section3_description TEXT NOT NULL DEFAULT '',
  section3_image_url TEXT,
  section3_background_color TEXT,
  section3_visible BOOLEAN NOT NULL DEFAULT TRUE,
  section4_small_heading TEXT NOT NULL DEFAULT '',
  section4_main_heading TEXT NOT NULL DEFAULT '',
  section4_description TEXT NOT NULL DEFAULT '',
  section4_button_text TEXT,
  section4_button_link TEXT,
  section4_image_url TEXT,
  section4_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for advertise_page_settings
ALTER TABLE public.advertise_page_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for advertise_page_settings
CREATE POLICY "Public read advertise page settings"
    ON public.advertise_page_settings
    FOR SELECT
    USING (true);

CREATE POLICY "Admins can write advertise page settings"
    ON public.advertise_page_settings
    FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.advertise_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  logo_url TEXT,
  heading TEXT NOT NULL,
  description TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for advertise_cards
ALTER TABLE public.advertise_cards ENABLE ROW LEVEL SECURITY;

-- Create policies for advertise_cards
CREATE POLICY "Public read advertise cards"
    ON public.advertise_cards
    FOR SELECT
    USING (true);

CREATE POLICY "Admins can write advertise cards"
    ON public.advertise_cards
    FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.advertise_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  small_heading TEXT NOT NULL DEFAULT '',
  main_heading TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  button_text TEXT,
  button_link TEXT,
  image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for advertise_sections
ALTER TABLE public.advertise_sections ENABLE ROW LEVEL SECURITY;

-- Create policies for advertise_sections
CREATE POLICY "Public read advertise sections"
    ON public.advertise_sections
    FOR SELECT
    USING (true);

CREATE POLICY "Admins can write advertise sections"
    ON public.advertise_sections
    FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at on all three tables
CREATE TRIGGER update_advertise_page_settings_updated_at 
BEFORE UPDATE ON public.advertise_page_settings 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_advertise_cards_updated_at 
BEFORE UPDATE ON public.advertise_cards 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_advertise_sections_updated_at 
BEFORE UPDATE ON public.advertise_sections 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.advertise_page_settings (
    hero_small_heading, hero_main_heading, hero_description,
    hero_button_text, hero_button_link, hero_image_visible, hero_visible,
    section3_small_heading, section3_main_heading, section3_description,
    section3_visible, section4_small_heading, section4_main_heading,
    section4_description, section4_visible
) VALUES (
    '', '', '',
    '', '', true, true,
    '', '', '',
    true, '', '',
    '', true
);
