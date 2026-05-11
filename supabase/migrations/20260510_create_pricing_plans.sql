-- Create pricing_plans table for subcategory pricing plans
CREATE TABLE public.pricing_plans (
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
CREATE POLICY "Public read pricing plans" ON public.pricing_plans FOR SELECT USING (true);
CREATE POLICY "Admin write pricing plans" ON public.pricing_plans FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Add comment
COMMENT ON TABLE public.pricing_plans IS 'Pricing plans for each subcategory';
COMMENT ON COLUMN public.pricing_plans.features IS 'Array of feature strings to display in the pricing card';
