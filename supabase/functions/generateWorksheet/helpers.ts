// Helper functions used in the worksheet generator

/**
 * Gets exercise types based on count of exercises needed
 * UPDATED: Now supports custom exercise selection from form
 */
export function getExerciseTypesForCount(count: number, customTypes?: string[]): string[] {
  // If custom types are provided (manual selection), use them
  if (customTypes && customTypes.length > 0) {
    console.log(`Using custom exercise types: ${customTypes.join(', ')}`);
    return customTypes.slice(0, count); // Ensure we don't exceed the requested count
  }
  
  // Default 8-exercise set for automatic selection
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
  
  console.log(`Using default exercise types (${count} exercises)`);
  return fullSet.slice(0, count);
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
