
CREATE TABLE IF NOT EXISTS public.get_listed_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_name TEXT NOT NULL,
  price_inr NUMERIC NOT NULL,
  duration TEXT NOT NULL,
  button_text TEXT,
  button_link TEXT,
  button_visible BOOLEAN NOT NULL DEFAULT TRUE,
  popular BOOLEAN NOT NULL DEFAULT FALSE,
  visible BOOLEAN NOT NULL DEFAULT TRUE,
  show_view_more BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.get_listed_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read get listed plans"
    ON public.get_listed_plans
    FOR SELECT
    USING (true);

CREATE POLICY "Admins can write get listed plans"
    ON public.get_listed_plans
    FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.get_listed_plan_features (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.get_listed_plans(id) ON DELETE CASCADE,
  feature_text TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.get_listed_plan_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read get listed plan features"
    ON public.get_listed_plan_features
    FOR SELECT
    USING (true);

CREATE POLICY "Admins can write get listed plan features"
    ON public.get_listed_plan_features
    FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.get_listed_comparison_rows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  row_title TEXT NOT NULL,
  visible BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.get_listed_comparison_rows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read get listed comparison rows"
    ON public.get_listed_comparison_rows
    FOR SELECT
    USING (true);

CREATE POLICY "Admins can write get listed comparison rows"
    ON public.get_listed_comparison_rows
    FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.get_listed_comparison_cells (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  row_id UUID NOT NULL REFERENCES public.get_listed_comparison_rows(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.get_listed_plans(id) ON DELETE CASCADE,
  tick_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  custom_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (row_id, plan_id)
);

ALTER TABLE public.get_listed_comparison_cells ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read get listed comparison cells"
    ON public.get_listed_comparison_cells
    FOR SELECT
    USING (true);

CREATE POLICY "Admins can write get listed comparison cells"
    ON public.get_listed_comparison_cells
    FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_get_listed_plans_updated_at 
BEFORE UPDATE ON public.get_listed_plans 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_get_listed_plan_features_updated_at 
BEFORE UPDATE ON public.get_listed_plan_features 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_get_listed_comparison_rows_updated_at 
BEFORE UPDATE ON public.get_listed_comparison_rows 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_get_listed_comparison_cells_updated_at 
BEFORE UPDATE ON public.get_listed_comparison_cells 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
