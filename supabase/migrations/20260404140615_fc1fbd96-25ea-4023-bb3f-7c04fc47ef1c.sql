-- Add slug for custom booking URLs
ALTER TABLE public.calendar_settings ADD COLUMN IF NOT EXISTS public_calendar_slug TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_calendar_settings_slug ON public.calendar_settings (public_calendar_slug) WHERE public_calendar_slug IS NOT NULL;

-- Add discount_percent to calendar_slots
ALTER TABLE public.calendar_slots ADD COLUMN IF NOT EXISTS discount_percent SMALLINT;

-- Validation trigger for discount_percent
CREATE OR REPLACE FUNCTION public.validate_discount_percent()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.discount_percent IS NOT NULL AND (NEW.discount_percent < 0 OR NEW.discount_percent > 100) THEN
    RAISE EXCEPTION 'discount_percent must be between 0 and 100';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_discount_percent ON public.calendar_slots;
CREATE TRIGGER trg_validate_discount_percent
  BEFORE INSERT OR UPDATE ON public.calendar_slots
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_discount_percent();