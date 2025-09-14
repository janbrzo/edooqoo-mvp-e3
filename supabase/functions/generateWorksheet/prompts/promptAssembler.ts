/**
 * Prompt assembler for combining all prompt modules
 * CRITICAL: This must produce the exact same prompt as the original
 */

import { getSystemPromptCore } from './systemPrompt.ts';
import { getExerciseExamples, getSelectedExercises } from './exerciseExamples.ts';
import { getValidationRules } from './validationRules.ts';

/**
 * Determines exercise count based on lesson duration
 * @param prompt - The user prompt to analyze
 * @returns Number of exercises to generate
 */
function determineExerciseCount(prompt: string): number {
  console.log(`🔍 Analyzing prompt for duration. Contains '45 min': ${prompt.includes('45 min')}, Contains '30 min': ${prompt.includes('30 min')}`);
  
  if (prompt.includes('45 min') || prompt.includes('30 min')) {
    console.log(`✅ Detected shorter lesson - selecting 6 exercises`);
    return 6; // 45min and 30min lessons get 6 exercises
  }
  
  console.log(`✅ Detected standard lesson - selecting 8 exercises`);
  return 8; // 60min lessons get 8 exercises
}

/**
 * Selects exercise numbers based on count
 * @param count - Number of exercises to select
 * @returns Array of exercise numbers
 */
function selectExercisesForCount(count: number): number[] {
  // Always select the first N exercises in order
  return Array.from({ length: count }, (_, i) => i + 1);
}

/**
 * Assembles the complete system prompt from modular parts
 * @param hasGrammarFocus - Whether grammar focus is specified
 * @param grammarFocus - The grammar focus topic
 * @param formData - Form data containing lesson details
 * @param userPrompt - User prompt to analyze for lesson duration
 * @returns Complete system prompt exactly matching the original
 */
export function assembleSystemPrompt(
  hasGrammarFocus: boolean, 
  grammarFocus: string = '', 
  formData: any = {},
  userPrompt: string = ''
): string {
  
  // Determine exercise count from user prompt
  const exerciseCount = determineExerciseCount(userPrompt);
  const selectedExercises = selectExercisesForCount(exerciseCount);
  
  console.log(`📝 Assembling prompt: ${exerciseCount} exercises for lesson duration detected in prompt`);
  console.log(`🎯 Selected exercises: ${selectedExercises.join(', ')}`);
  console.log(`📋 User prompt analysis: "${userPrompt.substring(0, 200)}..."`);
  
  const corePrompt = getSystemPromptCore(hasGrammarFocus, grammarFocus, formData, exerciseCount);
  
  const structureInstruction = `

20. Generate a structured JSON worksheet with this EXACT format:`;
  
  const examples = getSelectedExercises(selectedExercises, hasGrammarFocus, grammarFocus);
  
  const validationRules = getValidationRules();
  
  // Combine all parts exactly as in the original prompt
  return corePrompt + structureInstruction + examples + validationRules;
}

/**
 * Future function for dynamic exercise selection
 * Currently returns the standard 8 exercises to maintain compatibility
 */
export function assembleSystemPromptWithSelectedExercises(
  hasGrammarFocus: boolean,
  grammarFocus: string = '',
  formData: any = {},
  selectedExercises: string[] = []
): string {
  // For now, return the standard prompt
  // This will be enhanced in future phases to support dynamic exercise selection
  return assembleSystemPrompt(hasGrammarFocus, grammarFocus, formData);
}