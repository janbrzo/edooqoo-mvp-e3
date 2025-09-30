import { supabase } from '@/integrations/supabase/client';
import { updateWorksheetAPI } from './worksheetService/updateService';

// URLs for the Edge Functions
const REGENERATE_EXERCISE_URL = 'https://bvfrkzdlklyvnhlpleck.supabase.co/functions/v1/generateWorksheet';

interface RegenerateExerciseRequest {
  worksheetId: string;
  exerciseIndex: number;
  originalFormData: any;
  currentExercise: any;
  additionalGuidelines: string;
  userId: string;
}

class ExerciseRegenerationService {
  async regenerateSection(
    worksheetId: string,
    sectionType: 'warmup' | 'grammar',
    originalFormData: any,
    currentSection: any,
    additionalGuidelines: string,
    userId: string
  ) {
    try {
      console.log(`📤 Sending ${sectionType} regeneration request to Edge Function`);

      const regenerationPrompt = this.createSectionRegenerationPrompt(
        originalFormData,
        sectionType,
        currentSection,
        additionalGuidelines
      );

      console.log(`🔄 ${sectionType} regeneration prompt:`, regenerationPrompt);

      const response = await fetch(REGENERATE_EXERCISE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: regenerationPrompt,
          formData: {
            ...originalFormData,
            regenerationMode: true,
            regenerationType: sectionType
          },
          userId,
          isRegeneration: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Failed to regenerate ${sectionType}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (sectionType === 'warmup' && result.warmup_questions) {
        console.log('✅ Warmup questions regenerated successfully');
        return result.warmup_questions;
      } else if (sectionType === 'grammar' && result.grammar_rules) {
        console.log('✅ Grammar rules regenerated successfully');
        return result.grammar_rules;
      } else {
        throw new Error(`No ${sectionType} data returned from regeneration`);
      }

    } catch (error) {
      console.error(`❌ Error in ${sectionType} regeneration:`, error);
      throw error;
    }
  }

  async regenerateExercise(
    worksheetId: string,
    exerciseIndex: number,
    originalFormData: any,
    currentExercise: any,
    additionalGuidelines: string,
    userId: string
  ) {
    try {
      console.log('📤 Sending regeneration request to Edge Function');

      // Create a specific prompt for single exercise regeneration
      const regenerationPrompt = this.createRegenerationPrompt(
        originalFormData,
        currentExercise,
        additionalGuidelines
      );

      console.log('🔄 Regeneration prompt:', regenerationPrompt);

      const response = await fetch(REGENERATE_EXERCISE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: regenerationPrompt,
          formData: {
            ...originalFormData,
            regenerationMode: true,
            targetExerciseType: currentExercise.type,
            exerciseIndex
          },
          userId,
          isRegeneration: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Failed to regenerate exercise: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Extract the single exercise from the response
      if (result.exercises && result.exercises.length > 0) {
        const newExercise = result.exercises[0];
        
        // Ensure the exercise has the correct index-based title
        newExercise.title = `Exercise ${exerciseIndex + 1}: ${newExercise.type.charAt(0).toUpperCase() + newExercise.type.slice(1).replace(/-/g, ' ')}`;
        
        console.log('✅ Exercise regenerated successfully:', newExercise.type);
        return newExercise;
      } else {
        throw new Error('No exercises returned from regeneration');
      }

    } catch (error) {
      console.error('❌ Error in exercise regeneration:', error);
      throw error;
    }
  }

  async updateWorksheetInDatabase(
    worksheetId: string,
    updatedWorksheet: any,
    userId: string
  ) {
    try {
      console.log('💾 Updating worksheet in database');
      await updateWorksheetAPI(worksheetId, updatedWorksheet, userId);
      console.log('✅ Worksheet updated successfully in database');
    } catch (error) {
      console.error('❌ Error updating worksheet in database:', error);
      throw error;
    }
  }

  private createSectionRegenerationPrompt(
    originalFormData: any,
    sectionType: 'warmup' | 'grammar',
    currentSection: any,
    additionalGuidelines: string
  ): string {
    const baseInfo = `
Lesson Topic: ${originalFormData.lessonTopic || 'Not specified'}
Lesson Goal: ${originalFormData.lessonGoal || 'Not specified'}
English Level: ${originalFormData.englishLevel || 'Not specified'}
Lesson Duration: ${originalFormData.lessonTime || '60min'}
`;

    let sectionInfo = '';
    if (sectionType === 'warmup') {
      sectionInfo = `
REGENERATE WARMUP QUESTIONS:
- Current Questions: ${JSON.stringify(currentSection || [])}
- Generate 4 new warmup questions that are engaging and relevant to the lesson topic.
- Return warmup_questions array with 4 question strings.
`;
    } else if (sectionType === 'grammar') {
      sectionInfo = `
REGENERATE GRAMMAR RULES:
- Current Grammar: ${JSON.stringify(currentSection || {})}
- Generate new grammar explanation with clear structure.
- CRITICAL: Return grammar_rules object with this EXACT structure:
{
  "grammar_rules": {
    "title": "Grammar Title (e.g., 'Present Perfect Tense')",
    "introduction": "Brief introduction paragraph",
    "rules": [
      {
        "title": "Rule title",
        "explanation": "Clear explanation",
        "examples": ["Example 1", "Example 2", "Example 3"]
      }
    ]
  }
}
- The grammar_rules object MUST have: title (string), introduction (string), rules (array of objects)
- Each rule MUST have: title (string), explanation (string), examples (array of strings with at least 2 examples)
`;
    }

    const guidelines = additionalGuidelines 
      ? `\nADDITIONAL GUIDELINES:\n${additionalGuidelines}`
      : '';

    const regenerationInstructions = `
IMPORTANT: Generate ONLY the ${sectionType} section. 
The content should be completely new and different from the current one, but maintain quality standards.
Return the full worksheet JSON format but only regenerate the ${sectionType} section.
`;

    return baseInfo + sectionInfo + guidelines + regenerationInstructions;
  }

  private createRegenerationPrompt(
    originalFormData: any,
    currentExercise: any,
    additionalGuidelines: string
  ): string {
    const baseInfo = `
Lesson Topic: ${originalFormData.lessonTopic || 'Not specified'}
Lesson Goal: ${originalFormData.lessonGoal || 'Not specified'}
English Level: ${originalFormData.englishLevel || 'Not specified'}
Lesson Duration: ${originalFormData.lessonTime || '60min'}
`;

    const exerciseInfo = `
REGENERATE SINGLE EXERCISE:
- Exercise Type: ${currentExercise.type}
- Current Exercise Title: ${currentExercise.title}
- Current Instructions: ${currentExercise.instructions}
`;

    const guidelines = additionalGuidelines 
      ? `\nADDITIONAL GUIDELINES:\n${additionalGuidelines}`
      : '';

    const regenerationInstructions = `
IMPORTANT: Generate ONLY ONE exercise of type "${currentExercise.type}". 
The exercise should be completely new and different from the current one, but maintain the same structure and quality standards.
Return the response in the same JSON format as a full worksheet, but with only one exercise in the exercises array.
`;

    return baseInfo + exerciseInfo + guidelines + regenerationInstructions;
  }
}

export const exerciseRegenerationService = new ExerciseRegenerationService();