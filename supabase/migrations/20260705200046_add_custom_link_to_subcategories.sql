-- Add custom_link column to subcategories table
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS custom_link TEXT NULL;
