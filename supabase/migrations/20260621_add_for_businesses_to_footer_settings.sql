-- Add For Businesses footer fields to footer_settings table
ALTER TABLE public.footer_settings
ADD COLUMN IF NOT EXISTS for_businesses_title TEXT DEFAULT 'For Businesses',
ADD COLUMN IF NOT EXISTS for_businesses_links JSONB DEFAULT '[
  {"label": "Advertise With Us", "link": "#"},
  {"label": "Write with us", "link": "#"},
  {"label": "Sell With Us", "link": "#"},
  {"label": "Editorial Policy", "link": "#"}
]'::jsonb;