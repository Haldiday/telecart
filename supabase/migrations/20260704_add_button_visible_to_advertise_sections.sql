
ALTER TABLE public.advertise_sections 
ADD COLUMN IF NOT EXISTS button_visible BOOLEAN NOT NULL DEFAULT TRUE;
