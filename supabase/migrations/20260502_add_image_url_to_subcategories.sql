-- Add image_url column to subcategories table
ALTER TABLE subcategories ADD COLUMN image_url TEXT;

COMMENT ON COLUMN subcategories.image_url IS 'URL to image resource for this subcategory';
