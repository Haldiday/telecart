ALTER TABLE public.subcategories
ADD COLUMN IF NOT EXISTS about_bg_color TEXT,
ADD COLUMN IF NOT EXISTS about_heading_color TEXT,
ADD COLUMN IF NOT EXISTS about_subheading_color TEXT,
ADD COLUMN IF NOT EXISTS about_description_color TEXT,
ADD COLUMN IF NOT EXISTS about_button_bg_color TEXT,
ADD COLUMN IF NOT EXISTS about_button_text_color TEXT;
