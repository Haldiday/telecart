ALTER TABLE public.faqs
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.faqs(id) ON DELETE CASCADE;

ALTER TABLE public.faqs
ALTER COLUMN answer DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_faqs_parent_id ON public.faqs(parent_id);

UPDATE public.faqs
SET parent_id = NULL
WHERE parent_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM public.faqs AS parent_faqs WHERE parent_faqs.id = public.faqs.parent_id
);
