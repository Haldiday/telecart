-- Add highlight color field for header points (green/blue)
ALTER TABLE public.subcategory_overview_points
ADD COLUMN IF NOT EXISTS highlight_color TEXT DEFAULT 'green';

-- Backfill existing rows
UPDATE public.subcategory_overview_points
SET highlight_color = 'green'
WHERE highlight_color IS NULL;

-- Constrain allowed values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'subcategory_overview_points_highlight_color_check'
  ) THEN
    ALTER TABLE public.subcategory_overview_points
    ADD CONSTRAINT subcategory_overview_points_highlight_color_check
    CHECK (highlight_color IN ('green', 'blue'));
  END IF;
END $$;

