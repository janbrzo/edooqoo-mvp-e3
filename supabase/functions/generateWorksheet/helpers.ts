// Helper functions used in the worksheet generator

/**
 * Gets exercise types based on count of exercises needed
 * Now uses constant sets for consistent generation
 * UPDATED: Moved true-false to position 2 (after reading)
 */
export function getExerciseTypesForCount(count: number): string[] {
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
  const selectedExercises = fullSet.slice(0, count);
  console.log(`🔧 [HELPERS] getExerciseTypesForCount(${count}) returning:`, selectedExercises);
  
  return selectedExercises;
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
