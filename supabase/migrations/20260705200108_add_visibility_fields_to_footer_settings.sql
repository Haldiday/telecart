-- Add visibility fields to footer_settings table
ALTER TABLE public.footer_settings ADD COLUMN IF NOT EXISTS description_visible BOOLEAN DEFAULT true;
ALTER TABLE public.footer_settings ADD COLUMN IF NOT EXISTS social_media_visible BOOLEAN DEFAULT true;
ALTER TABLE public.footer_settings ADD COLUMN IF NOT EXISTS about_us_visible BOOLEAN DEFAULT true;
ALTER TABLE public.footer_settings ADD COLUMN IF NOT EXISTS contact_visible BOOLEAN DEFAULT true;
ALTER TABLE public.footer_settings ADD COLUMN IF NOT EXISTS privacy_policy_visible BOOLEAN DEFAULT true;
ALTER TABLE public.footer_settings ADD COLUMN IF NOT EXISTS terms_of_service_visible BOOLEAN DEFAULT true;
ALTER TABLE public.footer_settings ADD COLUMN IF NOT EXISTS twitter_visible BOOLEAN DEFAULT true;
ALTER TABLE public.footer_settings ADD COLUMN IF NOT EXISTS linkedin_visible BOOLEAN DEFAULT true;
ALTER TABLE public.footer_settings ADD COLUMN IF NOT EXISTS facebook_visible BOOLEAN DEFAULT true;
ALTER TABLE public.footer_settings ADD COLUMN IF NOT EXISTS instagram_visible BOOLEAN DEFAULT false;
ALTER TABLE public.footer_settings ADD COLUMN IF NOT EXISTS youtube_visible BOOLEAN DEFAULT false;
