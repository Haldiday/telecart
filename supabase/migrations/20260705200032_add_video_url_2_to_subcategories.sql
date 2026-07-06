-- Add video_url_2 column to subcategories table
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS video_url_2 TEXT[];

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_description WHERE objoid = 'subcategories'::regclass AND objsubid = (SELECT attnum FROM pg_attribute WHERE attrelid = 'subcategories'::regclass AND attname = 'video_url_2')) THEN
    COMMENT ON COLUMN subcategories.video_url_2 IS 'Array of video URLs for the Resources tab';
  END IF;
END $$;
