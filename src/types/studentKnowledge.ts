/**
 * Student Knowledge Types & Interfaces
 * 
 * Te typy definiują strukturę danych dla systemu "Student Knowledge" -
 * bazy wiedzy nauczyciela o każdym uczniu. Pozwala to na:
 * - Organizowanie notatek w kategorie (np. "Słabe strony", "Cele")
 * - Tagowanie wpisów dla łatwego wyszukiwania
 * - Linkowanie notatek z konkretnymi worksheetami
 * - Filtrowanie i sortowanie wpisów
 */

// ============================================
// ENUMS & UNION TYPES
// ============================================

/**
 * Kategorie wpisów - predefiniowane, żeby zachować spójność
 * Każdy wpis MUSI należeć do jednej z tych kategorii
 */
export type KnowledgeCategory =
  | 'Personal Info'
  | 'Professional/Work Context'
  | 'Goals'
  | 'Strengths'
  | 'Weaknesses'
  | 'Common Mistakes'
  | 'To Practice'
  | 'Interests & Hobbies'
  | 'Notes';

/**
 * Źródło wpisu - skąd pochodził wpis
 * - manual: Nauczyciel dodał ręcznie z profilu ucznia
 * - worksheet: Dodany podczas przeglądania worksheetu (Quick Note)
 * - vocabulary: Dodany z Vocabulary Sheet (przyszła funkcjonalność Flashcards)
 * - ai-suggested: Zasugerowany przez AI (Phase 5)
 */
export type EntrySource = 'manual' | 'worksheet' | 'vocabulary' | 'ai-suggested';

/**
 * Opcje sortowania wpisów
 */
export type SortOption = 'newest' | 'oldest' | 'category';

/**
 * Opcje grupowania wpisów
 */
export type GroupOption = 'none' | 'category' | 'date';

// ============================================
// INTERFACES
// ============================================

/**
 * Pełna struktura wpisu w bazie danych
 * (po pobraniu z Supabase)
 */
export interface StudentKnowledgeEntry {
  id: string;
  student_id: string;
  teacher_id: string;
  category: KnowledgeCategory;
  content: string;
  tags: string[]; // Znormalizowane (lowercase_with_underscores)
  worksheet_id: string | null; // NULL jeśli nie linkowany z worksheetem
  entry_source: EntrySource;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  deleted_at: string | null; // NULL = aktywny, NOT NULL = usunięty
  is_outdated: boolean; // TRUE = nieaktualne (przedawnione)
  outdated_at: string | null; // Kiedy oznaczono jako nieaktualne
  outdated_reason: string | null; // Opcjonalny powód oznaczenia jako nieaktualne
}

/**
 * Struktura nowego wpisu (przed zapisem do bazy)
 * Nie zawiera pól auto-generowanych (id, timestamps)
 */
export interface NewKnowledgeEntry {
  student_id: string;
  teacher_id: string;
  category: KnowledgeCategory;
  content: string;
  tags?: string[]; // Opcjonalne - mogą być puste
  worksheet_id?: string | null; // Opcjonalne - tylko jeśli dodawane z worksheetu
  entry_source?: EntrySource; // Opcjonalne - domyślnie 'manual'
}

/**
 * Częściowa aktualizacja wpisu
 * Wszystkie pola opcjonalne - możemy zaktualizować tylko wybrane
 */
export interface UpdateKnowledgeEntry {
  category?: KnowledgeCategory;
  content?: string;
  tags?: string[];
  worksheet_id?: string | null;
  is_outdated?: boolean;
  outdated_reason?: string | null;
}

/**
 * Filtry do wyszukiwania/filtrowania wpisów
 * Wszystkie pola opcjonalne - jeśli nie podane, nie filtrujemy po tym polu
 */
export interface KnowledgeFilters {
  category?: KnowledgeCategory | null; // NULL = wszystkie kategorie
  tags?: string[]; // Filtruj po tagach (OR logic - wpis musi mieć przynajmniej jeden tag)
  search?: string; // Wyszukaj w treści wpisu
  worksheetId?: string; // Pokaż tylko wpisy z tego worksheetu
  dateFrom?: string; // Pokaż wpisy od tej daty (ISO timestamp)
  dateTo?: string; // Pokaż wpisy do tej daty (ISO timestamp)
  limit?: number; // Maksymalna liczba wyników (dla paginacji)
  offset?: number; // Przesunięcie dla paginacji (offset = 0 to pierwsza strona)
  sortBy?: SortOption; // Sposób sortowania
  showOutdated?: boolean; // Pokazuj nieaktualne wpisy (domyślnie: false)
}

/**
 * Odpowiedź z paginacją
 * Zwracana przez API przy pobieraniu wpisów
 */
export interface KnowledgeEntriesResponse {
  entries: StudentKnowledgeEntry[];
  total: number; // Całkowita liczba wpisów (bez paginacji)
  hasMore: boolean; // Czy są jeszcze wpisy do pobrania?
  page: number; // Aktualna strona
  pageSize: number; // Rozmiar strony
}

// ============================================
// CONSTANTS
// ============================================

/**
 * Definicje kategorii z dodatkowymi metadanymi
 * Używane w UI do wyświetlania ikon, kolorów, opisów
 */
export const KNOWLEDGE_CATEGORIES = [
  {
    id: 'Personal Info' as KnowledgeCategory,
    label: 'Personal Info',
    icon: '👤', // Emoji jako ikona
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    description: 'Basic personal information, background, family'
  },
  {
    id: 'Professional/Work Context' as KnowledgeCategory,
    label: 'Professional/Work',
    icon: '💼',
    color: 'bg-purple-100 text-purple-800 border-purple-300',
    description: 'Job, career, work environment, professional goals'
  },
  {
    id: 'Goals' as KnowledgeCategory,
    label: 'Goals',
    icon: '🎯',
    color: 'bg-green-100 text-green-800 border-green-300',
    description: 'Learning objectives, short-term and long-term goals'
  },
  {
    id: 'Strengths' as KnowledgeCategory,
    label: 'Strengths',
    icon: '💪',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    description: 'What the student excels at, strong skills'
  },
  {
    id: 'Weaknesses' as KnowledgeCategory,
    label: 'Weaknesses',
    icon: '📉',
    color: 'bg-red-100 text-red-800 border-red-300',
    description: 'Areas that need improvement, challenges'
  },
  {
    id: 'Common Mistakes' as KnowledgeCategory,
    label: 'Common Mistakes',
    icon: '❌',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    description: 'Recurring errors, patterns to work on'
  },
  {
    id: 'To Practice' as KnowledgeCategory,
    label: 'To Practice',
    icon: '📝',
    color: 'bg-amber-100 text-amber-800 border-amber-300',
    description: 'Topics and skills to focus on in future lessons'
  },
  {
    id: 'Interests & Hobbies' as KnowledgeCategory,
    label: 'Interests & Hobbies',
    icon: '🎨',
    color: 'bg-pink-100 text-pink-800 border-pink-300',
    description: 'Hobbies, passions, topics they enjoy'
  },
  {
    id: 'Notes' as KnowledgeCategory,
    label: 'Notes',
    icon: '📋',
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    description: 'General notes, observations, miscellaneous'
  }
] as const;

/**
 * Domyślne wartości dla filtrów
 */
export const DEFAULT_FILTERS: KnowledgeFilters = {
  category: null,
  tags: [],
  search: '',
  limit: 20, // 20 wpisów na stronę
  offset: 0,
  sortBy: 'newest',
  showOutdated: true // Domyślnie pokazuj wszystkie wpisy włącznie z nieaktualnymi
};

/**
 * Opcje sortowania z etykietami dla UI
 */
export const SORT_OPTIONS = [
  { value: 'newest' as SortOption, label: 'Newest First' },
  { value: 'oldest' as SortOption, label: 'Oldest First' },
  { value: 'category' as SortOption, label: 'By Category' }
] as const;

/**
 * Opcje grupowania z etykietami dla UI
 */
export const GROUP_OPTIONS = [
  { value: 'none' as GroupOption, label: 'Timeline View' },
  { value: 'category' as GroupOption, label: 'Group by Category' },
  { value: 'date' as GroupOption, label: 'Group by Date' }
] as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Pomocnicza funkcja do znalezienia metadanych kategorii
 */
export const getCategoryMetadata = (category: KnowledgeCategory) => {
  return KNOWLEDGE_CATEGORIES.find(cat => cat.id === category);
};

/**
 * Pomocnicza funkcja do normalizacji tagów
 * (w bazie dzieje się to automatycznie, ale przydatne w UI)
 */
export const normalizeTag = (tag: string): string => {
  return tag.toLowerCase().trim().replace(/\s+/g, '_');
};

/**
 * Pomocnicza funkcja do parsowania tagów z inputu
 * Rozdziela przecinkami, normalizuje, usuwa duplikaty
 */
export const parseTagsFromInput = (input: string): string[] => {
  if (!input.trim()) return [];
  
  return Array.from(new Set(
    input
      .split(',')
      .map(tag => normalizeTag(tag))
      .filter(tag => tag.length > 0)
  ));
};

/**
 * Pomocnicza funkcja do formatowania tagów dla wyświetlenia
 * Zamienia underscores na spacje, pierwsza litera wielka
 */
export const formatTagForDisplay = (tag: string): string => {
  return tag
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
};
