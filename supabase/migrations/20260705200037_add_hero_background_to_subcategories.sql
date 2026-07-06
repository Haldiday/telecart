-- Add hero_background_image field to subcategories table
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS hero_background_image text;

-- Add comment
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_description WHERE objoid = 'subcategories'::regclass AND objsubid = (SELECT attnum FROM pg_attribute WHERE attrelid = 'subcategories'::regclass AND attname = 'hero_background_image')) THEN
    COMMENT ON COLUMN subcategories.hero_background_image IS 'Background image URL for the hero section on subcategory detail page';
  END IF;
END $$;
