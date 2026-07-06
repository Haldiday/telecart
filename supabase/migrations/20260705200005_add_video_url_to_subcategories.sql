-- Add video_url column to subcategories table
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Add comment
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_description WHERE objoid = 'subcategories'::regclass AND objsubid = (SELECT attnum FROM pg_attribute WHERE attrelid = 'subcategories'::regclass AND attname = 'video_url')) THEN
    COMMENT ON COLUMN subcategories.video_url IS 'URL to video resource for this subcategory';
  END IF;
END $$;
