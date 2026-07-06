-- Add new CTA fields to subcategory_brands table
ALTER TABLE public.subcategory_brands
ADD COLUMN IF NOT EXISTS primary_cta_label TEXT,
ADD COLUMN IF NOT EXISTS primary_cta_link TEXT,
ADD COLUMN IF NOT EXISTS primary_cta_visible BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS more_actions_label TEXT DEFAULT 'Contact',
ADD COLUMN IF NOT EXISTS more_actions_visible BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS join_network_label TEXT DEFAULT '+ Join their Network',
ADD COLUMN IF NOT EXISTS join_network_link TEXT,
ADD COLUMN IF NOT EXISTS join_network_visible BOOLEAN DEFAULT FALSE;
