-- OPCJA B: Dodanie kolumny reminder_scheduled_at + naprawa problemów z datami
-- Problem #1: Brak automatycznego mechanizmu wysyłania reminder
-- Problem #2: created_at używa niewłaściwej strefy czasowej
-- Problem #3: deadline zawsze ustawia godzinę na 23:00 UTC (00:00 Polski czas)

-- Krok 1: Dodaj kolumnę reminder_scheduled_at
ALTER TABLE homework_assignments 
ADD COLUMN IF NOT EXISTS reminder_scheduled_at TIMESTAMPTZ;

-- Krok 2: Napraw default value dla created_at (powinien być UTC, nie 'Europe/Warsaw')
-- Usuń istniejący default
ALTER TABLE homework_assignments 
ALTER COLUMN created_at SET DEFAULT now();

-- Krok 3: Napraw default value dla updated_at (również powinien być UTC)
ALTER TABLE homework_assignments 
ALTER COLUMN updated_at SET DEFAULT now();

-- Krok 4: Funkcja do automatycznego ustawiania reminder_scheduled_at
CREATE OR REPLACE FUNCTION set_reminder_scheduled_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Tylko jeśli deadline i reminder_hours są ustawione
  IF NEW.deadline IS NOT NULL AND NEW.reminder_hours IS NOT NULL AND NEW.reminder_hours > 0 THEN
    -- Oblicz czas wysłania reminder: deadline - reminder_hours
    NEW.reminder_scheduled_at = NEW.deadline - (NEW.reminder_hours || ' hours')::INTERVAL;
    
    -- Logowanie dla debugowania
    RAISE NOTICE 'Setting reminder_scheduled_at: deadline=%, reminder_hours=%, calculated=%', 
      NEW.deadline, NEW.reminder_hours, NEW.reminder_scheduled_at;
  ELSE
    -- Jeśli nie ma deadline lub reminder_hours, wyczyść reminder_scheduled_at
    NEW.reminder_scheduled_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Krok 5: Trigger uruchamiający funkcję przy INSERT i UPDATE
DROP TRIGGER IF EXISTS trigger_set_reminder_scheduled_at ON homework_assignments;

CREATE TRIGGER trigger_set_reminder_scheduled_at
  BEFORE INSERT OR UPDATE ON homework_assignments
  FOR EACH ROW
  EXECUTE FUNCTION set_reminder_scheduled_at();

-- Krok 6: Zaktualizuj istniejące homework (oblicz reminder_scheduled_at dla tych, które jeszcze go nie mają)
UPDATE homework_assignments 
SET reminder_scheduled_at = deadline - (reminder_hours || ' hours')::INTERVAL
WHERE deadline IS NOT NULL 
  AND reminder_hours IS NOT NULL 
  AND reminder_hours > 0
  AND reminder_scheduled_at IS NULL;

-- Krok 7: Utwórz index dla wydajności (send-homework-reminders będzie często odpytywać tę kolumnę)
CREATE INDEX IF NOT EXISTS idx_homework_reminder_scheduled 
ON homework_assignments(reminder_scheduled_at) 
WHERE reminder_scheduled_at IS NOT NULL AND reminder_sent_at IS NULL;

-- Krok 8: Dodaj komentarze dokumentujące zmiany
COMMENT ON COLUMN homework_assignments.reminder_scheduled_at IS 
'Dokładna data i godzina (UTC) kiedy reminder ma być wysłany. Obliczana automatycznie jako deadline - reminder_hours. NULL jeśli reminder jest wyłączony.';

COMMENT ON COLUMN homework_assignments.created_at IS 
'Data utworzenia homework w UTC (poprzednio błędnie używała Europe/Warsaw timezone)';

COMMENT ON COLUMN homework_assignments.updated_at IS 
'Data ostatniej aktualizacji w UTC (poprzednio błędnie używała Europe/Warsaw timezone)';