
-- BACKFILL: Add missing renewal tokens to teachers
-- j4n.brz0+44: +150 (30 FT30 12-21 + 60 FT60 01-21 + 60 FT60 02-21)
UPDATE public.profiles 
SET available_tokens = available_tokens + 150,
    total_tokens_received = COALESCE(total_tokens_received, 0) + 150,
    updated_at = now()
WHERE id = '4ee84131-4ac8-4931-86ee-e116234e7e1f';

-- mobilingo.biuro: +90 (30 FT30 12-23 + 60 FT60 01-23)
UPDATE public.profiles 
SET available_tokens = available_tokens + 90,
    total_tokens_received = COALESCE(total_tokens_received, 0) + 90,
    updated_at = now()
WHERE id = '38a9fae8-6c08-4d20-9be6-7cf35ffc4e1d';

-- j4n.brz0+50: +30 (15 SG 12-24 + 15 SG 01-24)
UPDATE public.profiles 
SET available_tokens = available_tokens + 30,
    total_tokens_received = COALESCE(total_tokens_received, 0) + 30,
    updated_at = now()
WHERE id = '3db65411-9609-43ae-8812-b6f52d1b6d24';

-- esl.biery: +15 (15 SG 01-16)
UPDATE public.profiles 
SET available_tokens = available_tokens + 15,
    total_tokens_received = COALESCE(total_tokens_received, 0) + 15,
    updated_at = now()
WHERE id = '5e7853ad-1587-4d03-a40f-e200b047c930';

-- Log backfill transactions
INSERT INTO public.token_transactions (teacher_id, teacher_email, transaction_type, amount, description)
VALUES 
  ('4ee84131-4ac8-4931-86ee-e116234e7e1f', 'j4n.brz0+44@gmail.com', 'purchase', 150, 'Backfill: 3 missed monthly renewals (FT30+FT60+FT60)'),
  ('38a9fae8-6c08-4d20-9be6-7cf35ffc4e1d', 'mobilingo.biuro@gmail.com', 'purchase', 90, 'Backfill: 2 missed monthly renewals (FT30+FT60)'),
  ('3db65411-9609-43ae-8812-b6f52d1b6d24', 'j4n.brz0+50@gmail.com', 'purchase', 30, 'Backfill: 2 missed monthly renewals (SG+SG)'),
  ('5e7853ad-1587-4d03-a40f-e200b047c930', 'esl.biery@gmail.com', 'purchase', 15, 'Backfill: 1 missed monthly renewal (SG)');

-- Mark renewal events with correct event_type
UPDATE public.subscription_events 
SET event_type = 'subscription_renewed'
WHERE id IN (
  '5db7aaf8-4379-4a97-a279-8b7378781f7b', -- j4n.brz0+44 12-21
  'b20fd451-b651-4034-8beb-30b61cf86445', -- j4n.brz0+44 01-21
  '101b3103-d912-4457-84b7-4c0bc8a66ef9', -- j4n.brz0+44 02-21
  '1605d42d-5dc9-4445-b4a1-0ec12f996e68', -- mobilingo 12-23
  '8ce4f12a-4f6b-4088-bb79-c68edad07e25', -- mobilingo 01-23
  'd803e092-0b44-4433-b86a-e0184ba71669', -- j4n.brz0+50 12-24
  'c4276de7-bffc-4220-9830-8376413c63fe', -- j4n.brz0+50 01-24
  '5385a8d2-0281-4e4e-b65d-9ee7704ec966'  -- esl.biery 01-16
);

-- Update tokens_added on those events
UPDATE public.subscription_events SET tokens_added = 30 WHERE id = '5db7aaf8-4379-4a97-a279-8b7378781f7b';
UPDATE public.subscription_events SET tokens_added = 60 WHERE id = 'b20fd451-b651-4034-8beb-30b61cf86445';
UPDATE public.subscription_events SET tokens_added = 60 WHERE id = '101b3103-d912-4457-84b7-4c0bc8a66ef9';
UPDATE public.subscription_events SET tokens_added = 30 WHERE id = '1605d42d-5dc9-4445-b4a1-0ec12f996e68';
UPDATE public.subscription_events SET tokens_added = 60 WHERE id = '8ce4f12a-4f6b-4088-bb79-c68edad07e25';
UPDATE public.subscription_events SET tokens_added = 15 WHERE id = 'd803e092-0b44-4433-b86a-e0184ba71669';
UPDATE public.subscription_events SET tokens_added = 15 WHERE id = 'c4276de7-bffc-4220-9830-8376413c63fe';
UPDATE public.subscription_events SET tokens_added = 15 WHERE id = '5385a8d2-0281-4e4e-b65d-9ee7704ec966';
