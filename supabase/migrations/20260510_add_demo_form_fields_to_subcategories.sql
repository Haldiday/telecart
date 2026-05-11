-- Add demo form fields to subcategories table
ALTER TABLE public.subcategories
ADD COLUMN IF NOT EXISTS demo_form_heading TEXT DEFAULT 'See The Software In Action
Watch Free Demo!',
ADD COLUMN IF NOT EXISTS demo_button_label TEXT DEFAULT 'Get Free Advice';
