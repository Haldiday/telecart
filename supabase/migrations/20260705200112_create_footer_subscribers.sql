CREATE TABLE IF NOT EXISTS public.footer_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.footer_subscribers ENABLE ROW LEVEL SECURITY;

-- Create policies for footer_subscribers table if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'footer_subscribers' AND policyname = 'Anyone can insert footer subscribers') THEN
        CREATE POLICY "Anyone can insert footer subscribers"
          ON public.footer_subscribers
          FOR INSERT
          TO anon, authenticated
          WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'footer_subscribers' AND policyname = 'Admins can view all footer subscribers') THEN
        CREATE POLICY "Admins can view all footer subscribers"
          ON public.footer_subscribers
          FOR SELECT
          TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM user_roles
              WHERE user_id = auth.uid()
              AND role = 'admin'
            )
          );
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_footer_subscribers_email ON public.footer_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_footer_subscribers_created_at ON public.footer_subscribers(created_at DESC);
