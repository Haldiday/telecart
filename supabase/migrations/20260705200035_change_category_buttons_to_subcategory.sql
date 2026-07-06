-- Change category_buttons table to use subcategory_id instead of category_id
-- This allows each subcategory to have its own distinct buttons

-- Drop the old foreign key constraint
ALTER TABLE public.category_buttons DROP CONSTRAINT IF EXISTS category_buttons_category_id_fkey;

-- Drop the old column
ALTER TABLE public.category_buttons DROP COLUMN IF EXISTS category_id;

-- Add new subcategory_id column
ALTER TABLE public.category_buttons ADD COLUMN IF NOT EXISTS subcategory_id uuid REFERENCES public.subcategories(id) ON DELETE CASCADE;

-- Make subcategory_id NOT NULL after data migration (if any existing data)
-- Note: This will delete any existing buttons since they were category-level
DELETE FROM public.category_buttons;

-- Add NOT NULL constraint
ALTER TABLE public.category_buttons ALTER COLUMN subcategory_id SET NOT NULL;

-- Update RLS policy to reference subcategory_id instead
DROP POLICY IF EXISTS "Public read buttons" ON public.category_buttons;
CREATE POLICY "Public read buttons" ON public.category_buttons FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin write buttons" ON public.category_buttons;
CREATE POLICY "Admin write buttons" ON public.category_buttons FOR ALL USING (public.has_role(auth.uid(), 'admin'));
