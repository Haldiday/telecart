-- Add key_features_tab_label to subcategories table
ALTER TABLE public.subcategories
ADD COLUMN IF NOT EXISTS key_features_tab_label TEXT DEFAULT 'Key Features';

-- Update existing records to ensure they have the default label
UPDATE public.subcategories SET key_features_tab_label = 'Key Features' WHERE key_features_tab_label IS NULL;
