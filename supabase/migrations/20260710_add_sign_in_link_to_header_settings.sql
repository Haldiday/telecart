-- Add sign_in_link to header_settings
ALTER TABLE public.header_settings
ADD COLUMN IF NOT EXISTS sign_in_link TEXT DEFAULT '#';

UPDATE public.header_settings
SET sign_in_link = '#'
WHERE sign_in_link IS NULL;
