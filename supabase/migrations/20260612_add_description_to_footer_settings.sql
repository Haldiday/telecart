-- Add description column to footer_settings
ALTER TABLE public.footer_settings ADD COLUMN IF NOT EXISTS description TEXT DEFAULT 'BizReq empowers teams to transform raw data into clear, compelling visuals — making insights easier to share, understand, and act on.';
