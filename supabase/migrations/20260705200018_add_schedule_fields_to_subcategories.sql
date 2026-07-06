ALTER TABLE public.subcategories
ADD COLUMN IF NOT EXISTS schedule_link TEXT,
ADD COLUMN IF NOT EXISTS show_schedule_in_separate_tab BOOLEAN NOT NULL DEFAULT false;
