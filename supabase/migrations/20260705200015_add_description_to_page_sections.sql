ALTER TABLE public.page_sections
ADD COLUMN IF NOT EXISTS description TEXT;

UPDATE public.page_sections
SET description = NULL
WHERE section_type = 'ads_3col';
