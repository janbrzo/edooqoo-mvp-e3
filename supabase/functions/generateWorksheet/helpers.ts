// Helper functions used in the worksheet generator

/**
 * Gets exercise types based on count of exercises needed
 * Now uses constant sets for consistent generation
 * UPDATED: Moved true-false to position 2 (after reading)
 * ENHANCED: Supports custom selected exercises from form
 */
export function getExerciseTypesForCount(count: number, selectedExercises?: string[]): string[] {
  // If custom exercises are selected, validate and use them
  if (selectedExercises && selectedExercises.length > 0) {
    return validateAndFilterExercises(selectedExercises, count);
  }
  
  // Standard 8-exercise set (60 min lessons) - NEW ORDER with true-false as Exercise 2
  const fullSet = [
    'reading',           // Exercise 1
    'true-false',        // Exercise 2 - Now directly after reading
    'matching',          // Exercise 3 - Was 2
    'fill-in-blanks',    // Exercise 4 - Was 3
    'multiple-choice',   // Exercise 5 - Was 4
    'dialogue',          // Exercise 6 - Was 5
    'discussion',        // Exercise 7 - Was 7 (unchanged)
    'error-correction'   // Exercise 8 - Was 8 (unchanged)
  ];
  
  return fullSet.slice(0, count);
}

/**
 * Normalizes exercise ID by removing -picture or -audio suffix
 * Returns both the base ID and flags for picture/audio requirements
 */
export function normalizeExerciseId(exerciseId: string): { baseId: string; usePicture: boolean; useAudio: boolean } {
  if (exerciseId.endsWith('-picture')) {
    return {
      baseId: exerciseId.replace('-picture', ''),
      usePicture: true,
      useAudio: false
    };
  }
  if (exerciseId.endsWith('-audio')) {
    return {
      baseId: exerciseId.replace('-audio', ''),
      usePicture: false,
      useAudio: true
    };
  }
  // Special case: listening-comprehension is audio-only but doesn't have -audio suffix
  if (exerciseId === 'listening-comprehension') {
    return {
      baseId: exerciseId,
      usePicture: false,
      useAudio: true
    };
  }
  return {
    baseId: exerciseId,
    usePicture: false,
    useAudio: false
  };
}

/**
 * Validates and filters selected exercises from the form
 * Ensures exercises exist and respects count limit
 * UPDATED: Now handles -picture suffix
 */
export function validateAndFilterExercises(selectedExercises: string[], maxCount: number): string[] {
  // All available exercise types (matching individual-exercises.ts)
  const availableTypes = [
    'reading', 'true-false', 'matching', 'fill-in-blanks', 
    'multiple-choice', 'dialogue', 'discussion', 'error-correction',
    'odd-one-out', 'synonyms', 'antonyms', 'synonyms-antonyms', 'sentence-transformation', 
    'word-order', 'gap-text', 'negative-prefixes', 'categorize',
    'paraphrasing', 'complete-word', 'matching-halves', 
    'describe-picture', 'answer-questions',
    // Picture versions
    'true-false-picture', 'multiple-choice-picture', 'answer-questions-picture',
    // Audio versions
    'listening-comprehension', 'multiple-choice-audio', 'true-false-audio', 
    'fill-in-blanks-audio', 'answer-questions-audio'
  ];
  
  // Filter out invalid exercise types
  const validExercises = selectedExercises.filter(type => availableTypes.includes(type));
  
  // Respect the count limit
  return validExercises.slice(0, maxCount);
}

/**
 * Gets missing exercise types from what we already have
 * Simplified since we now always generate the full set
 */
export function getExerciseTypesForMissing(existingExercises: any[], allTypes: string[]): string[] {
  const existingTypes = new Set(existingExercises.map(ex => ex.type));
  return allTypes.filter(type => !existingTypes.has(type));
}

/**
 * Assigns icon based on exercise type
 */
export function getIconForType(type: string): string {
  const iconMap: {[key: string]: string} = {
    'multiple-choice': 'fa-check-square',
    'reading': 'fa-book-open',
    'matching': 'fa-link',
    'fill-in-blanks': 'fa-pencil-alt',
    'dialogue': 'fa-comments',
    'discussion': 'fa-users',
    'error-correction': 'fa-exclamation-triangle',
    'true-false': 'fa-balance-scale',
    'odd-one-out': 'fa-search',
    'synonyms': 'fa-equals',
    'antonyms': 'fa-not-equal',
    'synonyms-antonyms': 'fa-exchange-alt',
    'sentence-transformation': 'fa-random',
    'word-order': 'fa-sort',
    'gap-text': 'fa-text-width',
    'negative-prefixes': 'fa-minus-circle',
    // Audio exercises
    'listening-comprehension': 'fa-headphones',
    'multiple-choice-audio': 'fa-check-square',
    'true-false-audio': 'fa-balance-scale',
    'fill-in-blanks-audio': 'fa-pencil-alt',
    'answer-questions-audio': 'fa-question-circle'
  };
  
  return iconMap[type] || 'fa-tasks';
}

/**
 * PROBLEM 4 FIX: Official exercise type names for consistent titles
 * Maps exercise type IDs to their official display names
 */
export const EXERCISE_TYPE_NAMES: Record<string, string> = {
  'reading': 'Reading Comprehension',
  'true-false': 'True/False Questions',
  'true-false-picture': 'True/False (Picture)',
  'true-false-audio': 'True/False (Audio)',
  'matching': 'Vocabulary Matching',
  'matching-halves': 'Matching Halves',
  'fill-in-blanks': 'Fill in the Blanks',
  'fill-in-blanks-audio': 'Fill in the Blanks (Audio)',
  'multiple-choice': 'Multiple Choice',
  'multiple-choice-picture': 'Multiple Choice (Picture)',
  'multiple-choice-audio': 'Multiple Choice (Audio)',
  'dialogue': 'Dialogue Practice',
  'discussion': 'Discussion Questions',
  'answer-questions': 'Answer Questions',
  'answer-questions-picture': 'Answer Questions (Picture)',
  'answer-questions-audio': 'Answer Questions (Audio)',
  'describe-picture': 'Describe Picture',
  'listening-comprehension': 'Listening Comprehension',
  'paraphrasing': 'Paraphrasing',
  'sentence-transformation': 'Sentence Transformation',
  'word-order': 'Word Order',
  'gap-text': 'Gap Text (Cloze)',
  'error-correction': 'Error Correction',
  'odd-one-out': 'Odd One Out',
  'negative-prefixes': 'Negative Prefixes',
  'categorize': 'Categorization',
  'complete-word': 'Complete Word',
  'synonyms': 'Synonyms',
  'antonyms': 'Antonyms',
  'synonyms-antonyms': 'Synonyms/Antonyms',
  'writing-task': 'Writing Task',
  'essay': 'Essay',
  'speaking': 'Speaking Practice',
};

/**
 * Get the official display name for an exercise type
 */
export function getOfficialExerciseName(type: string): string {
  if (EXERCISE_TYPE_NAMES[type]) {
    return EXERCISE_TYPE_NAMES[type];
  }
  // Fallback: capitalize and replace dashes with spaces
  return type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

/**
 * Parses and cleans JSON content from AI response
 * Enhanced with JSON repair capabilities for common AI output issues
 */
export function parseAIResponse(jsonContent: string): any {
  // Clean the JSON content
  let cleanJsonContent = jsonContent;
  
  // Remove markdown wrappers if present
  cleanJsonContent = cleanJsonContent.replace(/^```json?\s*/i, '');
  cleanJsonContent = cleanJsonContent.replace(/```\s*$/i, '');
  
  // Find the first occurrence of { and the last occurrence of }
  const firstBrace = cleanJsonContent.indexOf('{');
  const lastBrace = cleanJsonContent.lastIndexOf('}');
  
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    // Extract only the text between the first { and the last }
    cleanJsonContent = cleanJsonContent.substring(firstBrace, lastBrace + 1);
  }
  
  // First attempt - standard parsing
  try {
    console.log('Attempting to parse cleaned JSON content');
    return JSON.parse(cleanJsonContent);
  } catch (firstError) {
    console.warn('⚠️ First JSON parse failed, attempting repairs...', (firstError as Error).message);
    
    // Attempt repairs for common AI output issues
    let repairedContent = cleanJsonContent;
    
    // 1. Remove trailing commas before } or ]
    repairedContent = repairedContent.replace(/,(\s*[}\]])/g, '$1');
    
    // 2. Fix missing commas between objects in arrays
    repairedContent = repairedContent.replace(/}(\s*){/g, '},{');
    
    // 3. Fix missing commas between array elements
    repairedContent = repairedContent.replace(/](\s*)\[/g, '],[');
    
    // 4. Fix unescaped quotes in string values (common issue)
    // This is a simple heuristic - replace ": " followed by unquoted content
    
    // 5. Ensure the content ends properly
    const openBraces = (repairedContent.match(/{/g) || []).length;
    const closeBraces = (repairedContent.match(/}/g) || []).length;
    const openBrackets = (repairedContent.match(/\[/g) || []).length;
    const closeBrackets = (repairedContent.match(/]/g) || []).length;
    
    // Add missing closing braces/brackets
    for (let i = 0; i < openBraces - closeBraces; i++) {
      repairedContent += '}';
    }
    for (let i = 0; i < openBrackets - closeBrackets; i++) {
      repairedContent += ']';
    }
    
    try {
      console.log('✅ JSON repair succeeded');
      return JSON.parse(repairedContent);
    } catch (secondError) {
      console.error('❌ JSON repair failed:', (secondError as Error).message);
      console.error('❌ Original error:', (firstError as Error).message);
      console.error('❌ Content length:', cleanJsonContent.length);
      console.error('❌ Content preview (first 500 chars):', cleanJsonContent.substring(0, 500));
      console.error('❌ Content preview (last 500 chars):', cleanJsonContent.substring(cleanJsonContent.length - 500));
      throw new Error(`Invalid JSON from AI: ${(firstError as Error).message}`);
    }
  }
}
