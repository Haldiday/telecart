-- Add show_currency_toggle field to get_listed_settings
ALTER TABLE public.get_listed_settings
  ADD COLUMN IF NOT EXISTS show_currency_toggle boolean DEFAULT true;
