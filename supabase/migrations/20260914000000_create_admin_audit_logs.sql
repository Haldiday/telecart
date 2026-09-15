CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_email TEXT,
    actor_name TEXT NOT NULL DEFAULT 'Unknown Admin',
    actor_avatar TEXT,
    action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
    entity_table TEXT NOT NULL,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    changes JSONB,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    request_id TEXT,
    module TEXT,
    entity_type TEXT,
    entity_id TEXT,
    entity_name TEXT,
    ad_slot SMALLINT,
    hierarchy JSONB NOT NULL DEFAULT '{}'::jsonb,
    correlation_id TEXT,
    actor_id UUID
);

DO $$ BEGIN
  ALTER TABLE public.admin_audit_logs ADD COLUMN IF NOT EXISTS actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.admin_audit_logs ADD COLUMN IF NOT EXISTS actor_email TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.admin_audit_logs ADD COLUMN IF NOT EXISTS actor_name TEXT NOT NULL DEFAULT 'Unknown Admin';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.admin_audit_logs ADD COLUMN IF NOT EXISTS actor_avatar TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.admin_audit_logs ADD COLUMN IF NOT EXISTS action TEXT NOT NULL DEFAULT 'update' CHECK (action IN ('create', 'update', 'delete'));
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.admin_audit_logs ADD COLUMN IF NOT EXISTS entity_table TEXT NOT NULL DEFAULT '';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.admin_audit_logs ADD COLUMN IF NOT EXISTS record_id UUID;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.admin_audit_logs ADD COLUMN IF NOT EXISTS old_data JSONB;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.admin_audit_logs ADD COLUMN IF NOT EXISTS new_data JSONB;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.admin_audit_logs ADD COLUMN IF NOT EXISTS changes JSONB;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.admin_audit_logs ADD COLUMN IF NOT EXISTS description TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.admin_audit_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.admin_audit_logs ADD COLUMN IF NOT EXISTS request_id TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.admin_audit_logs ADD COLUMN IF NOT EXISTS module TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.admin_audit_logs ADD COLUMN IF NOT EXISTS entity_type TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.admin_audit_logs ADD COLUMN IF NOT EXISTS entity_id TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.admin_audit_logs ADD COLUMN IF NOT EXISTS entity_name TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.admin_audit_logs ADD COLUMN IF NOT EXISTS ad_slot SMALLINT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.admin_audit_logs ADD COLUMN IF NOT EXISTS hierarchy JSONB NOT NULL DEFAULT '{}'::jsonb;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.admin_audit_logs ADD COLUMN IF NOT EXISTS correlation_id TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.admin_audit_logs ADD COLUMN IF NOT EXISTS actor_id UUID;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

ALTER TABLE public.admin_audit_logs ALTER COLUMN entity_table DROP DEFAULT;
ALTER TABLE public.admin_audit_logs ALTER COLUMN action DROP DEFAULT;

CREATE INDEX IF NOT EXISTS admin_audit_logs_entity_table_idx ON public.admin_audit_logs(entity_table, created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_logs_module_idx ON public.admin_audit_logs(module, created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_logs_entity_type_idx ON public.admin_audit_logs(entity_type, record_id, created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_logs_actor_idx ON public.admin_audit_logs(actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_logs_created_idx ON public.admin_audit_logs(created_at DESC);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'admin_audit_logs' AND policyname = 'Admins can read audit logs') THEN
    CREATE POLICY "Admins can read audit logs" ON public.admin_audit_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'admin_audit_logs' AND policyname = 'Admins can insert audit logs') THEN
    CREATE POLICY "Admins can insert audit logs" ON public.admin_audit_logs FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;
