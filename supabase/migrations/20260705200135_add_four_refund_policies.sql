-- Add four new refund policies to legal_pages
INSERT INTO public.legal_pages (slug, title, content)
VALUES 
    ('refund-policy-1', 'Refund Policy 1', '<h1>Refund Policy 1</h1><p>Welcome to our Refund Policy 1 page.</p>'),
    ('refund-policy-2', 'Refund Policy 2', '<h1>Refund Policy 2</h1><p>Welcome to our Refund Policy 2 page.</p>'),
    ('refund-policy-3', 'Refund Policy 3', '<h1>Refund Policy 3</h1><p>Welcome to our Refund Policy 3 page.</p>'),
    ('refund-policy-4', 'Refund Policy 4', '<h1>Refund Policy 4</h1><p>Welcome to our Refund Policy 4 page.</p>')
ON CONFLICT (slug) DO NOTHING;

-- Add visibility fields to footer_settings
ALTER TABLE public.footer_settings
ADD COLUMN IF NOT EXISTS refund_policy_1_visible BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS refund_policy_2_visible BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS refund_policy_3_visible BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS refund_policy_4_visible BOOLEAN DEFAULT true;
