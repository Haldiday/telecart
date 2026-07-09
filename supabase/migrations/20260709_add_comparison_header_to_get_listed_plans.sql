ALTER TABLE public.get_listed_plans 
ADD COLUMN IF NOT EXISTS comparison_header TEXT;

COMMENT ON COLUMN public.get_listed_plans.comparison_header IS 'Custom header text to use in comparison table instead of plan_name';
