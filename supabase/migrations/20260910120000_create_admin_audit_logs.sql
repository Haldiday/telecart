CREATE TABLE public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_email TEXT,
    actor_name TEXT,
    action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted')),
    entity_type TEXT NOT NULL,
    entity_table TEXT NOT NULL,
    record_id TEXT,
    description TEXT,
    old_data JSONB,
    new_data JSONB,
    changes JSONB,
    request_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX admin_audit_logs_created_at_idx
    ON public.admin_audit_logs (created_at DESC);
CREATE INDEX admin_audit_logs_actor_user_id_idx
    ON public.admin_audit_logs (actor_user_id);
CREATE INDEX admin_audit_logs_action_idx
    ON public.admin_audit_logs (action);
CREATE INDEX admin_audit_logs_entity_record_idx
    ON public.admin_audit_logs (entity_table, record_id);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
    ON public.admin_audit_logs
    FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));
