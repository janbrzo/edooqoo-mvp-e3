-- Clean zombie slots: booked status but no student_id
UPDATE public.calendar_slots
SET 
  status = 'available',
  confirmed_at = NULL,
  booked_at = NULL,
  booked_by = NULL,
  student_notes = NULL,
  title = NULL
WHERE status = 'booked' AND student_id IS NULL;