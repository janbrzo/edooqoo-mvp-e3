-- ETAP 1: Dodaj foreign key relationship między homework_assignments.teacher_id a profiles.id
ALTER TABLE homework_assignments 
ADD CONSTRAINT homework_assignments_teacher_id_fkey 
FOREIGN KEY (teacher_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- ETAP 2: Napraw UTC timestamps - upewnij się że domyślnie używają now() (UTC)
ALTER TABLE homework_assignments 
ALTER COLUMN created_at SET DEFAULT now();

ALTER TABLE homework_assignments 
ALTER COLUMN updated_at SET DEFAULT now();

-- Usuń stary trigger jeśli istnieje i utwórz nowy dla updated_at
DROP TRIGGER IF EXISTS update_homework_assignments_updated_at ON homework_assignments;

CREATE OR REPLACE FUNCTION update_homework_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_homework_assignments_updated_at 
  BEFORE UPDATE ON homework_assignments 
  FOR EACH ROW 
  EXECUTE FUNCTION update_homework_updated_at();

-- Dodaj indeks dla teacher_id dla lepszej wydajności joinów
CREATE INDEX IF NOT EXISTS idx_homework_assignments_teacher_id 
ON homework_assignments(teacher_id);