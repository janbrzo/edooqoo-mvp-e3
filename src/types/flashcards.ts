// Flashcard types for spaced repetition learning system

export interface FlashcardSet {
  id: string;
  teacher_id: string;
  student_id: string;
  title: string;
  description: string | null;
  is_bidirectional: boolean;
  back_type: 'translation' | 'definition';
  share_token: string | null;
  share_expires_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  // Computed fields (from queries)
  cards_count?: number;
  mastered_count?: number;
  student_name?: string;
  student_native_language?: string;
}

export interface FlashcardCard {
  id: string;
  set_id: string;
  source_worksheet_id: string | null;
  front_text: string;        // English term
  front_example: string | null;
  back_text: string;         // Translation/definition
  source_type: 'manual' | 'vocabulary_sheet';
  card_position: number;
  created_at: string;
  deleted_at: string | null;
}

export interface FlashcardProgress {
  id: string;
  card_id: string;
  set_id: string;
  learner_identifier: string;
  direction: 1 | 2;  // 1=EN→Native, 2=Native→EN
  easiness_factor: number;
  repetition: number;
  interval_days: number;
  next_review_date: string;
  last_reviewed_at: string | null;
  total_reviews: number;
  correct_count: number;
  incorrect_count: number;
  created_at: string;
  updated_at: string;
}

// Review quality for SM-2 algorithm
export type ReviewQuality = 0 | 1 | 2 | 3;
// 0 = Again (complete failure)
// 1 = Hard (correct with difficulty)
// 2 = Good (correct with some hesitation)
// 3 = Easy (perfect response)

// Card for learning session (combined data)
export interface LearningCard {
  card_id: string;
  front_text: string;
  front_example: string | null;
  back_text: string;
  card_position: number;
  direction: 1 | 2;
  easiness_factor: number;
  repetition: number;
  interval_days: number;
  next_review_date: string;
  total_reviews: number;
  correct_count: number;
  incorrect_count: number;
  // Runtime state
  isNew?: boolean;
  isDueForReview?: boolean;
}

// Session statistics
export interface LearningSessionStats {
  totalCards: number;
  newCards: number;
  reviewedCards: number;
  correctAnswers: number;
  incorrectAnswers: number;
  averageEasiness: number;
}

// Create/Update DTOs
export interface CreateFlashcardSet {
  student_id: string;
  title: string;
  description?: string;
  is_bidirectional?: boolean;
  back_type?: 'translation' | 'definition';
}

export interface CreateFlashcardCard {
  set_id: string;
  front_text: string;
  front_example?: string;
  back_text: string;
  source_type?: 'manual' | 'vocabulary_sheet';
  source_worksheet_id?: string;
  card_position?: number;
}

export interface UpdateFlashcardCard {
  front_text?: string;
  front_example?: string;
  back_text?: string;
  card_position?: number;
}

// Vocabulary sheet formats (for import)
export type VocabularySheetNewFormat = {
  title: string;
  words: Array<{
    word: string;
    definition: string;
    example?: string;
  }>;
};

export type VocabularySheetOldFormat = Array<{
  term: string;
  meaning: string;
}>;

export type VocabularySheet = VocabularySheetNewFormat | VocabularySheetOldFormat;

// Native language options
export const NATIVE_LANGUAGES = [
  { value: 'Spanish', label: 'Spanish' },
  { value: 'Polish', label: 'Polish' },
  { value: 'German', label: 'German' },
  { value: 'French', label: 'French' },
  { value: 'Italian', label: 'Italian' },
  { value: 'Portuguese', label: 'Portuguese' },
  { value: 'Ukrainian', label: 'Ukrainian' },
  { value: 'Russian', label: 'Russian' },
  { value: 'Chinese', label: 'Chinese' },
  { value: 'Japanese', label: 'Japanese' },
  { value: 'Korean', label: 'Korean' },
  { value: 'Arabic', label: 'Arabic' },
  { value: 'Turkish', label: 'Turkish' },
  { value: 'Other', label: 'Other' },
] as const;

// Helper to normalize vocabulary sheet format
export function normalizeVocabularySheet(vocab: VocabularySheet) {
  if (Array.isArray(vocab)) {
    // Old format: [{ term, meaning }]
    return vocab.map(item => ({
      word: item.term,
      definition: item.meaning,
      example: undefined
    }));
  } else {
    // New format: { title, words: [{ word, definition, example }] }
    return vocab.words;
  }
}
