-- Add action link fields to subcategory_brands table
ALTER TABLE public.subcategory_brands
ADD COLUMN IF NOT EXISTS action_link_1_text TEXT,
ADD COLUMN IF NOT EXISTS action_link_1_url TEXT,
ADD COLUMN IF NOT EXISTS action_link_1_new_tab BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS action_link_1_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS action_link_2_text TEXT,
ADD COLUMN IF NOT EXISTS action_link_2_url TEXT,
ADD COLUMN IF NOT EXISTS action_link_2_new_tab BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS action_link_2_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS action_link_3_text TEXT,
ADD COLUMN IF NOT EXISTS action_link_3_url TEXT,
ADD COLUMN IF NOT EXISTS action_link_3_new_tab BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS action_link_3_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS action_links JSONB DEFAULT '[]'::jsonb;
