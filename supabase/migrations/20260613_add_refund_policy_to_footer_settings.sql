-- Add refund_policy_visible to footer_settings table
ALTER TABLE public.footer_settings ADD COLUMN IF NOT EXISTS refund_policy_visible BOOLEAN DEFAULT true;
