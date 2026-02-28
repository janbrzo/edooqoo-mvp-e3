
-- Allow anonymous/public users to book available slots
CREATE POLICY "Public can book available slots" ON calendar_slots
FOR UPDATE USING (status = 'available' AND student_id IS NULL)
WITH CHECK (status = 'booked');

-- Also allow public SELECT on pending (booked but unconfirmed) slots so /book can show them
CREATE POLICY "Public can view pending slots" ON calendar_slots
FOR SELECT USING (status = 'booked' AND confirmed_at IS NULL);
