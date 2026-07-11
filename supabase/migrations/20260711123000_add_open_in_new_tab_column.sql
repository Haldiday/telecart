-- Add open_in_new_tab column to featured_cards
ALTER TABLE featured_cards ADD COLUMN IF NOT EXISTS open_in_new_tab BOOLEAN DEFAULT false;

-- Add open_in_new_tab column to offers
ALTER TABLE offers ADD COLUMN IF NOT EXISTS open_in_new_tab BOOLEAN DEFAULT false;

-- Add open_in_new_tab column to ads_3col
ALTER TABLE ads_3col ADD COLUMN IF NOT EXISTS open_in_new_tab BOOLEAN DEFAULT false;

-- Add open_in_new_tab column to subcategory_featured_cards (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subcategory_featured_cards') THEN
    ALTER TABLE subcategory_featured_cards ADD COLUMN IF NOT EXISTS open_in_new_tab BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add open_in_new_tab column to subcategory_offers (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subcategory_offers') THEN
    ALTER TABLE subcategory_offers ADD COLUMN IF NOT EXISTS open_in_new_tab BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add open_in_new_tab column to subcategory_ads_3col (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subcategory_ads_3col') THEN
    ALTER TABLE subcategory_ads_3col ADD COLUMN IF NOT EXISTS open_in_new_tab BOOLEAN DEFAULT false;
  END IF;
END $$;
