-- Add show_currency_toggle field to get_listed_settings
ALTER TABLE public.get_listed_settings
  ADD COLUMN show_currency_toggle boolean DEFAULT true;
