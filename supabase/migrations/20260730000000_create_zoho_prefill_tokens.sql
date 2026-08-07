CREATE TABLE IF NOT EXISTS public.zoho_prefill_tokens (
  token TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  company_name TEXT,
  phone TEXT,
  first_name TEXT,
  last_name TEXT,
  expires_at BIGINT NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS zoho_prefill_tokens_expires_at_idx ON public.zoho_prefill_tokens (expires_at);
