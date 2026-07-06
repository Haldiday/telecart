-- Create pricing_plans table for subcategory pricing plans
CREATE TABLE IF NOT EXISTS public.pricing_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE CASCADE NOT NULL,
    plan_name TEXT NOT NULL,
    price TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT '$',
    duration TEXT NOT NULL DEFAULT '/month',
    description TEXT,
    features TEXT[] NOT NULL DEFAULT '{}',
    button_label TEXT NOT NULL DEFAULT 'Get started',
    button_link TEXT,
    razorpay_link TEXT,
    is_popular BOOLEAN NOT NULL DEFAULT false,
    is_visible BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pricing_plans' AND policyname = 'Public read pricing plans') THEN
    CREATE POLICY "Public read pricing plans" ON public.pricing_plans FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pricing_plans' AND policyname = 'Admin write pricing plans') THEN
    CREATE POLICY "Admin write pricing plans" ON public.pricing_plans FOR ALL USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Add comment
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_description WHERE objoid = 'pricing_plans'::regclass AND objsubid = 0) THEN
    COMMENT ON TABLE public.pricing_plans IS 'Pricing plans for each subcategory';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_description WHERE objoid = 'pricing_plans'::regclass AND objsubid = (SELECT attnum FROM pg_attribute WHERE attrelid = 'pricing_plans'::regclass AND attname = 'features')) THEN
    COMMENT ON COLUMN public.pricing_plans.features IS 'Array of feature strings to display in the pricing card';
  END IF;
END $$;
