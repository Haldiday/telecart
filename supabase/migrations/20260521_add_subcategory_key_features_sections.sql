-- Create subcategory key features sections table
CREATE TABLE IF NOT EXISTS public.subcategory_key_features_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE CASCADE NOT NULL,
    heading TEXT DEFAULT 'Key Features' NOT NULL,
    is_visible BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add section_id to subcategory_overview_points
ALTER TABLE public.subcategory_overview_points 
ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES public.subcategory_key_features_sections(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.subcategory_key_features_sections ENABLE ROW LEVEL SECURITY;

-- Create policies for subcategory_key_features_sections
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'subcategory_key_features_sections' AND policyname = 'Public read key features sections'
    ) THEN
        CREATE POLICY "Public read key features sections" ON public.subcategory_key_features_sections FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'subcategory_key_features_sections' AND policyname = 'Admin manage key features sections'
    ) THEN
        CREATE POLICY "Admin manage key features sections" ON public.subcategory_key_features_sections FOR ALL USING (public.has_role(auth.uid(), 'admin'));
    END IF;
END
$$;

-- Migrate existing data
DO $$
DECLARE
    sub_rec RECORD;
    new_section_id UUID;
BEGIN
    FOR sub_rec IN SELECT id, key_features_tab_label FROM public.subcategories LOOP
        -- Create a default section for each subcategory that has points
        IF EXISTS (SELECT 1 FROM public.subcategory_overview_points WHERE subcategory_id = sub_rec.id AND section_id IS NULL) THEN
            INSERT INTO public.subcategory_key_features_sections (subcategory_id, heading, is_visible)
            VALUES (sub_rec.id, COALESCE(sub_rec.key_features_tab_label, 'Key Features'), true)
            RETURNING id INTO new_section_id;

            UPDATE public.subcategory_overview_points
            SET section_id = new_section_id
            WHERE subcategory_id = sub_rec.id AND section_id IS NULL;
        END IF;
    END LOOP;
END
$$;
