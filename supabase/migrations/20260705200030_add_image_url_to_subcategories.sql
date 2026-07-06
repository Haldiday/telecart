-- Add image_url column to subcategories table
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS image_url TEXT;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_description WHERE objoid = 'subcategories'::regclass AND objsubid = (SELECT attnum FROM pg_attribute WHERE attrelid = 'subcategories'::regclass AND attname = 'image_url')) THEN
    COMMENT ON COLUMN subcategories.image_url IS 'URL to image resource for this subcategory';
  END IF;
END $$;
