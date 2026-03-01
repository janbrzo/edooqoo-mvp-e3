-- 1. Fix CHECK constraint to allow 'deleted' status
ALTER TABLE calendar_slots DROP CONSTRAINT IF EXISTS valid_slot_status;
ALTER TABLE calendar_slots ADD CONSTRAINT valid_slot_status 
  CHECK (status IN ('available','booked','completed','cancelled','no_show','deleted'));

-- 2. Add is_resolved to calendar_notifications
ALTER TABLE calendar_notifications ADD COLUMN IF NOT EXISTS is_resolved boolean NOT NULL DEFAULT false;

-- 3. Drop the duplicate notification trigger
DROP TRIGGER IF EXISTS trg_notify_on_slot_booking ON calendar_slots;
DROP FUNCTION IF EXISTS notify_on_slot_booking();

-- 4. Unique index on students(teacher_id, lower(student_email)) to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_students_teacher_email_unique 
  ON students(teacher_id, lower(student_email)) 
  WHERE student_email IS NOT NULL AND deleted_at IS NULL;