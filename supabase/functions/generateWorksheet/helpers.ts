// Helper functions used in the worksheet generator

/**
 * Gets exercise types based on count of exercises needed
 * Now uses constant sets for consistent generation
 * UPDATED: Moved true-false to position 2 (after reading)
 * ENHANCED: Supports custom selected exercises from form
 */
export function getExerciseTypesForCount(count: number, selectedExercises?: string[]): string[] {
  console.log(`🔧 [HELPERS] getExerciseTypesForCount called with count: ${count}, selectedExercises:`, selectedExercises);
  console.log(`🔧 [HELPERS] selectedExercises type:`, typeof selectedExercises);
  console.log(`🔧 [HELPERS] selectedExercises isArray:`, Array.isArray(selectedExercises));
  console.log(`🔧 [HELPERS] selectedExercises length:`, selectedExercises?.length);
  
  // If custom exercises are selected, validate and use them
  if (selectedExercises && selectedExercises.length > 0) {
    console.log(`🔧 [HELPERS] Using CUSTOM exercises path`);
    return validateAndFilterExercises(selectedExercises, count);
  }
  
  console.log(`🔧 [HELPERS] Using DEFAULT exercises path - selectedExercises was:`, selectedExercises);
  
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
  
  // FIXED: Now correctly returns first N exercises based on count parameter
  // For 45 min lessons: first 6 exercises, for 60 min: all 8 exercises
  // Ready for future expansion to 20 exercises
  const selectedExercisesFinal = fullSet.slice(0, count);
  console.log(`🔧 [HELPERS] getExerciseTypesForCount(${count}) returning default:`, selectedExercisesFinal);
  
  return selectedExercisesFinal;
}

/**
 * Validates and filters selected exercises from the form
 * Ensures exercises exist and respects count limit
 */
export function validateAndFilterExercises(selectedExercises: string[], maxCount: number): string[] {
  // All available exercise types (matching individual-exercises.ts)
  const availableTypes = [
    'reading', 'true-false', 'matching', 'fill-in-blanks', 
    'multiple-choice', 'dialogue', 'discussion', 'error-correction',
    'odd-one-out', 'synonyms-antonyms', 'sentence-transformation', 
    'word-order', 'gap-text', 'negative-prefixes', 'categorize',
    'paraphrasing', 'complete-word', 'matching-halves', 
    'describe-picture', 'answer-questions'
  ];
  
  // Filter out invalid exercise types
  const validExercises = selectedExercises.filter(type => {
    const isValid = availableTypes.includes(type);
    if (!isValid) {
      console.warn(`🔧 [HELPERS] Invalid exercise type removed: ${type}`);
    }
    return isValid;
  });
  
  // Respect the count limit
  const finalExercises = validExercises.slice(0, maxCount);
  
  console.log(`🔧 [HELPERS] validateAndFilterExercises: ${selectedExercises.length} selected -> ${validExercises.length} valid -> ${finalExercises.length} final`);
  console.log(`🔧 [HELPERS] Final exercises:`, finalExercises);
  
  return finalExercises;
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
    // New Phase 1 exercise icons
    'odd-one-out': 'fa-search',
    'synonyms-antonyms': 'fa-exchange-alt',
    'sentence-transformation': 'fa-random',
    'word-order': 'fa-sort',
    'gap-text': 'fa-text-width',
    'negative-prefixes': 'fa-minus-circle'
  };
  
  return iconMap[type] || 'fa-tasks';
}

/**
 * Parses and cleans JSON content from AI response
 */
export function parseAIResponse(jsonContent: string): any {
  // Clean the JSON content
  let cleanJsonContent = jsonContent;
  
  // Find the first occurrence of { and the last occurrence of }
  const firstBrace = cleanJsonContent.indexOf('{');
  const lastBrace = cleanJsonContent.lastIndexOf('}');
  
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    // Extract only the text between the first { and the last }
    cleanJsonContent = cleanJsonContent.substring(firstBrace, lastBrace + 1);
  }
  
  console.log('Attempting to parse cleaned JSON content');
  return JSON.parse(cleanJsonContent);
}
