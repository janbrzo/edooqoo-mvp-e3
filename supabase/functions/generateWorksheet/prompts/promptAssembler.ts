/**
 * Prompt assembler for combining all prompt modules
 * CRITICAL: This must produce the exact same prompt as the original
 */

import { getSystemPromptCore } from './systemPrompt.ts';
import { getExerciseExamples } from './exerciseExamples.ts';
import { getValidationRules } from './validationRules.ts';

/**
 * Assembles the complete system prompt from modular parts
 * @param hasGrammarFocus - Whether grammar focus is specified
 * @param grammarFocus - The grammar focus topic
 * @param formData - Form data containing lesson details
 * @returns Complete system prompt exactly matching the original
 */
export function assembleSystemPrompt(
  hasGrammarFocus: boolean, 
  grammarFocus: string = '', 
  formData: any = {}
): string {
  
  const corePrompt = getSystemPromptCore(hasGrammarFocus, grammarFocus, formData);
  
  const structureInstruction = `

20. Generate a structured JSON worksheet with this EXACT format:`;
  
  const examples = getExerciseExamples(hasGrammarFocus, grammarFocus);
  
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