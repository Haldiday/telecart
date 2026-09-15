ALTER TABLE public.admin_audit_logs
  DROP CONSTRAINT IF EXISTS admin_audit_logs_action_check;

UPDATE public.admin_audit_logs
SET action = CASE lower(trim(action))
  WHEN 'created' THEN 'create'
  WHEN 'insert' THEN 'create'
  WHEN 'updated' THEN 'update'
  WHEN 'deleted' THEN 'delete'
  WHEN 'create' THEN 'create'
  WHEN 'update' THEN 'update'
  WHEN 'delete' THEN 'delete'
  ELSE 'update'
END
WHERE action IS NULL
   OR lower(trim(action)) NOT IN ('create', 'update', 'delete');

ALTER TABLE public.admin_audit_logs
  ADD CONSTRAINT admin_audit_logs_action_check
  CHECK (action IN ('create', 'update', 'delete'));
