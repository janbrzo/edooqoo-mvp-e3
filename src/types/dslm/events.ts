/**
 * DSLM Event Types - Warstwa A (Fakty)
 * Definicje typów dla systemu zbierania eventów edukacyjnych
 */

// =====================================================
// Event Sources - skąd pochodzi event
// =====================================================
export type EventSource = 
  | 'homework'    // Z homework assignments
  | 'flashcard'   // Z flashcard reviews
  | 'test'        // Z testów
  | 'worksheet'   // Z interakcji z worksheet
  | 'teacher'     // Manualna obserwacja nauczyciela
  | 'system';     // Generowane automatycznie przez system

// =====================================================
// Event Types - rodzaje zdarzeń
// =====================================================
export type StudentEventType = 
  // Homework events
  | 'homework_started'
  | 'homework_answer_saved'
  | 'homework_submitted'
  
  // Flashcard events
  | 'flashcard_review'
  | 'flashcard_session_started'
  | 'flashcard_session_complete'
  
  // Test events
  | 'test_started'
  | 'test_answer_submitted'
  | 'test_completed'
  
  // Worksheet events
  | 'worksheet_viewed'
  | 'worksheet_exercise_interaction'
  | 'worksheet_completed'
  
  // Teacher events
  | 'teacher_observation'
  | 'teacher_rating_update'
  | 'lesson_started'
  | 'lesson_completed'
  | 'exercise_mastery_evaluation'  // Legacy: kept for backward compatibility
  | 'mark_done_evaluation'  // Teacher evaluates student mastery per nano_skill via Mark Done button
  
  // AI evaluation trigger events
  | 'student_learning_activity'  // Student typed/changed an answer
  | '10min_AI_evaluation'        // AI eval triggered by 10-min inactivity
  | 'close_tab_AI_evaluation'    // AI eval triggered by closing tab
  | 'create_hw_AI_evaluation'    // AI eval triggered by Create Homework button
  | 'submit_hw_AI_evaluation'    // AI eval triggered by Submit Homework button
  
  // System events
  | 'knowledge_entry_added'
  | 'goal_created'
  | 'goal_achieved'
  | 'milestone_reached';

// =====================================================
// Element Types - kategorie umiejętności
// =====================================================
export type ElementType = 
  | 'grammar'
  | 'vocabulary'
  | 'speaking'
  | 'listening'
  | 'writing'
  | 'reading'
  | 'pronunciation';

// =====================================================
// Event Payloads - struktury danych dla różnych eventów
// =====================================================

export interface HomeworkAnswerPayload {
  exercise_index: number;
  exercise_type: string;
  is_submitted: boolean;
  answer_id: string;
  time_spent_ms?: number;
}

export interface HomeworkSubmittedPayload {
  total_exercises: number;
  completed_exercises: number;
  time_total_ms?: number;
}

export interface FlashcardReviewPayload {
  set_id: string;
  direction: number;
  is_correct: boolean;
  easiness_factor: number;
  repetition: number;
  interval_days: number;
  total_reviews: number;
  response_time_ms?: number;
  recalled_without_hint?: boolean;
}

export interface FlashcardSessionPayload {
  set_id: string;
  cards_reviewed: number;
  correct_count: number;
  session_duration_ms: number;
}

export interface TestAnswerPayload {
  question_id: string;
  question_type: string;
  question_index: number;
  is_correct: boolean | null;
  time_spent_seconds: number | null;
  difficulty_level: number | null;
}

export interface TestCompletedPayload {
  test_id: string;
  score_percentage: number;
  total_questions: number;
  correct_answers: number;
  time_total_seconds: number;
}

export interface TeacherObservationPayload {
  observation_type: 'strength' | 'weakness' | 'behavior' | 'progress' | 'note';
  claim: string;
  weight: number; // 0-1, jak pewny jest nauczyciel
  related_skill_ids?: string[];
}

export interface KnowledgeEntryPayload {
  category: string;
  tags: string[];
  entry_source: string;
}

export interface WorksheetViewPayload {
  worksheet_id: string;
  view_duration_ms?: number;
}

export interface LessonPayload {
  duration_minutes?: number;
  topics_covered?: string[];
  notes?: string;
}

export interface ExerciseMasteryEvaluationPayload {
  exercise_index: number;
  exercise_title: string;
  exercise_type: string;
  nano_skill_ratings: Array<{
    name: string;
    reason: string;
    mastery: number; // 0-100
  }>;
}

// =====================================================
// Main Event Interface
// =====================================================
export interface StudentEvent {
  id: string;
  student_id: string;
  teacher_id: string;
  event_type: StudentEventType;
  event_source: EventSource;
  source_id: string | null;
  event_payload: Record<string, unknown>;
  skill_ids: string[] | null;
  element_type: ElementType | null;
  session_id: string | null;
  created_at: string;
  is_processed: boolean;
}

// =====================================================
// Input types for creating events
// =====================================================
export interface CreateStudentEventInput {
  student_id: string;
  teacher_id: string;
  event_type: StudentEventType;
  event_source: EventSource;
  source_id?: string;
  event_payload?: Record<string, unknown>;
  skill_ids?: string[];
  element_type?: ElementType;
  session_id?: string;
}

// =====================================================
// Event filters for querying
// =====================================================
export interface StudentEventFilters {
  event_types?: StudentEventType[];
  event_sources?: EventSource[];
  element_types?: ElementType[];
  date_from?: string;
  date_to?: string;
  is_processed?: boolean;
  limit?: number;
}

// =====================================================
// Event statistics
// =====================================================
export interface StudentEventStats {
  total_events: number;
  events_by_type: Record<StudentEventType, number>;
  events_by_source: Record<EventSource, number>;
  events_last_7_days: number;
  events_last_30_days: number;
  last_event_at: string | null;
}
