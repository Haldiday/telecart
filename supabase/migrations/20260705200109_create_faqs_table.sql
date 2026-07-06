CREATE TABLE IF NOT EXISTS faqs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

-- Create policies if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'faqs' AND policyname = 'FAQs are viewable by everyone') THEN
        CREATE POLICY "FAQs are viewable by everyone"
          ON faqs
          FOR SELECT
          TO public
          USING (is_visible = true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'faqs' AND policyname = 'Admins can manage FAQs') THEN
        CREATE POLICY "Admins can manage FAQs"
          ON faqs
          FOR ALL
          TO authenticated
          USING (true)
          WITH CHECK (true);
    END IF;
END $$;
