-- Add custom_link_type column to subcategories table
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS custom_link_type TEXT DEFAULT 'link';