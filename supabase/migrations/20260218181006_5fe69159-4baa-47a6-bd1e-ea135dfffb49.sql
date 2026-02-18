-- Round 8: Fix event_source 'test' -> 'welcome_test' for welcome test events
UPDATE student_events SET event_source = 'welcome_test'
WHERE event_type = 'test_answer_submitted' 
AND event_source = 'test'
AND source_id IN (SELECT id FROM student_tests WHERE test_type = 'welcome');