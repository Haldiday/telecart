-- Insert About Us page
INSERT INTO public.legal_pages (slug, title, content)
VALUES ('about-us', 'About Us')
ON CONFLICT (slug) DO NOTHING;
