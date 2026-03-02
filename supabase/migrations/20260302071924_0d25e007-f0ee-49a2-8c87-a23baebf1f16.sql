
-- Add reschedule tracking columns to calendar_slots
ALTER TABLE public.calendar_slots 
  ADD COLUMN IF NOT EXISTS reschedule_request_from_slot_id uuid NULL,
  ADD COLUMN IF NOT EXISTS reschedule_request_to_slot_id uuid NULL;

-- Add comments for clarity
COMMENT ON COLUMN public.calendar_slots.reschedule_request_from_slot_id IS 'On new pending slot: points to the old slot being rescheduled from';
COMMENT ON COLUMN public.calendar_slots.reschedule_request_to_slot_id IS 'On old confirmed slot: points to the new pending slot being rescheduled to';
