-- Add show_about_section field to subcategories table
ALTER TABLE public.subcategories
ADD COLUMN IF NOT EXISTS show_about_section BOOLEAN DEFAULT true;

-- Update existing records with default values
UPDATE public.subcategories SET show_about_section = true WHERE show_about_section IS NULL;

-- Create an index for better query performance (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_subcategories_show_about_section ON public.subcategories(show_about_section);
