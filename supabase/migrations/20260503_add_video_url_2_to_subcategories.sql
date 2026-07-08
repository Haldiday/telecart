-- Add video_url_2 column to subcategories table
ALTER TABLE subcategories ADD COLUMN video_url_2 TEXT[];

COMMENT ON COLUMN subcategories.video_url_2 IS 'Array of video URLs for the Resources tab';
