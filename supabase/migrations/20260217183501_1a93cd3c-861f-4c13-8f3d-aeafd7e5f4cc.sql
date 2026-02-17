
-- Clean up old welcome test event types that are no longer used
DELETE FROM public.student_events 
WHERE event_type IN ('welcome_test_section_progress', 'welcome_test_completed');
