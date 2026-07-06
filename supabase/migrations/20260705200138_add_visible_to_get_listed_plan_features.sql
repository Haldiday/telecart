ALTER TABLE public.get_listed_plan_features
ADD COLUMN IF NOT EXISTS visible BOOLEAN NOT NULL DEFAULT TRUE;

-- Ensure the updated_at trigger exists (trigger already created in previous migration files)
-- No additional policies are required; existing RLS policies on the table continue to apply.
