-- Insert refund policy into legal_pages table
INSERT INTO public.legal_pages (slug, title, content)
VALUES 
    ('refund-policy', 'Refund Policy', '<h1>Refund Policy</h1><p>Welcome to our Refund Policy page.</p>')
ON CONFLICT (slug) DO NOTHING;
