-- Fix old welcome test events with event_source = 'test' -> 'welcome_test'
UPDATE student_events SET event_source = 'welcome_test'
WHERE event_type = 'test_answer_submitted' 
AND event_source = 'test'
AND source_id IN (SELECT id FROM student_tests WHERE test_type = 'welcome');

-- Delete legacy event types that are no longer used
DELETE FROM student_events 
WHERE event_type IN ('welcome_test_section_progress', 'welcome_test_completed');