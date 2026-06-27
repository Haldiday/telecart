ALTER TABLE footer_settings
ADD COLUMN submit_rft_label TEXT DEFAULT 'Submit RFT',
ADD COLUMN submit_rft_url TEXT,
ADD COLUMN submit_rft_enabled BOOLEAN DEFAULT false,
ADD COLUMN get_recommendations_label TEXT DEFAULT 'Get Recommendations',
ADD COLUMN get_recommendations_url TEXT,
ADD COLUMN get_recommendations_enabled BOOLEAN DEFAULT false;
