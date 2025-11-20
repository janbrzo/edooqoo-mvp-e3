-- ETAP B: Naprawa updated_at - zawsze UTC (bez timezone conversion)

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Używamy now() które zwraca TIMESTAMPTZ w UTC
  -- Usuwamy konwersję AT TIME ZONE 'Europe/Warsaw' która powodowała błąd
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Funkcja będzie automatycznie używana przez istniejące triggery na:
-- homework_assignments, students, subscriptions

COMMENT ON FUNCTION public.update_updated_at_column() IS 'Always sets updated_at to now() in UTC timezone';
