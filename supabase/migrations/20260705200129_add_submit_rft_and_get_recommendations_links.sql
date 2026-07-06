ALTER TABLE footer_settings
ADD COLUMN IF NOT EXISTS submit_rft_label TEXT DEFAULT 'Submit RFT',
ADD COLUMN IF NOT EXISTS submit_rft_url TEXT,
ADD COLUMN IF NOT EXISTS submit_rft_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS get_recommendations_label TEXT DEFAULT 'Get Recommendations',
ADD COLUMN IF NOT EXISTS get_recommendations_url TEXT,
ADD COLUMN IF NOT EXISTS get_recommendations_enabled BOOLEAN DEFAULT false;
