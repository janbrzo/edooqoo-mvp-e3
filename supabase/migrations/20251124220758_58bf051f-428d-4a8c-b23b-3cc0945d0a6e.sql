-- Update default onboarding_progress to include create_homework step
ALTER TABLE profiles 
ALTER COLUMN onboarding_progress 
SET DEFAULT '{"steps":{"add_student":false,"generate_worksheet":false,"share_worksheet":false,"create_homework":false},"dismissed":false,"completed":false}'::jsonb;

-- Update existing profiles that don't have create_homework in their progress
UPDATE profiles
SET onboarding_progress = jsonb_set(
  COALESCE(onboarding_progress, '{}'::jsonb),
  '{steps,create_homework}',
  'false'::jsonb,
  true
)
WHERE onboarding_progress IS NULL 
   OR NOT (onboarding_progress->'steps' ? 'create_homework');