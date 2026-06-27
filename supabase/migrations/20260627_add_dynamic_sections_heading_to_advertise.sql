
ALTER TABLE public.advertise_page_settings
ADD COLUMN IF NOT EXISTS dynamic_sections_heading_part1 TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS dynamic_sections_heading_part2 TEXT NOT NULL DEFAULT '';
