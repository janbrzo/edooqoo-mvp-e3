-- Add unique constraint on teacher_id in subscriptions table
-- This ensures one subscription per teacher, preventing duplicates

ALTER TABLE public.subscriptions 
ADD CONSTRAINT subscriptions_teacher_id_unique UNIQUE (teacher_id);