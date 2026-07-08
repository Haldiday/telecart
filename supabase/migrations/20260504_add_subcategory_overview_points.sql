-- Add overview points heading to subcategories table
ALTER TABLE public.subcategories
ADD COLUMN IF NOT EXISTS overview_points_heading TEXT DEFAULT 'Header';

-- Create subcategory overview points table
CREATE TABLE IF NOT EXISTS public.subcategory_overview_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE CASCADE NOT NULL,
    text TEXT NOT NULL,
    is_highlighted BOOLEAN NOT NULL DEFAULT false,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subcategory_overview_points ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'subcategory_overview_points'
          AND policyname = 'Public read subcategory overview points'
    ) THEN
        CREATE POLICY "Public read subcategory overview points"
        ON public.subcategory_overview_points
        FOR SELECT
        USING (true);
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'subcategory_overview_points'
          AND policyname = 'Admin write subcategory overview points'
    ) THEN
        CREATE POLICY "Admin write subcategory overview points"
        ON public.subcategory_overview_points
        FOR ALL
        USING (public.has_role(auth.uid(), 'admin'));
    END IF;
END
$$;
