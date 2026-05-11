-- Add hero_background_image field to subcategories table
ALTER TABLE subcategories ADD COLUMN hero_background_image text;

-- Add comment
COMMENT ON COLUMN subcategories.hero_background_image IS 'Background image URL for the hero section on subcategory detail page';
