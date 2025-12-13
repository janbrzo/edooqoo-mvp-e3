-- FAZA 1: Dodanie kategorii "Next Lesson Ideas" do dozwolonych kategorii
-- Problem 6: Error saving notes z kategorią "Next Lesson Ideas"

ALTER TABLE student_knowledge_entries 
DROP CONSTRAINT IF EXISTS student_knowledge_entries_category_check;

ALTER TABLE student_knowledge_entries 
ADD CONSTRAINT student_knowledge_entries_category_check 
CHECK (category = ANY (ARRAY[
  'Personal Info'::text,
  'Professional/Work Context'::text,
  'Goals'::text,
  'Strengths'::text,
  'Weaknesses'::text,
  'Common Mistakes'::text,
  'To Practice'::text,
  'Interests & Hobbies'::text,
  'Notes'::text,
  'Next Lesson Ideas'::text
]));