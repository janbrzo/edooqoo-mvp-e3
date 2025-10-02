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

  // Regenerate Warmup Section
  async regenerateWarmupSection(
    worksheetId: string,
    originalFormData: any,
    currentWarmupQuestions: string[],
    additionalGuidelines: string,
    userId: string
  ): Promise<string[]> {
    try {
      console.log('📤 Sending warmup regeneration request to Edge Function');

      const regenerationPrompt = this.createWarmupRegenerationPrompt(
        originalFormData,
        currentWarmupQuestions,
        additionalGuidelines
      );

      console.log('🔄 Warmup regeneration prompt:', regenerationPrompt);

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
            targetSectionType: 'warmup'
          },
          userId,
          isRegeneration: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Failed to regenerate warmup: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.warmup_questions && result.warmup_questions.length > 0) {
        console.log('✅ Warmup questions regenerated successfully');
        return result.warmup_questions;
      } else {
        throw new Error('No warmup questions returned from regeneration');
      }

    } catch (error) {
      console.error('❌ Error in warmup regeneration:', error);
      throw error;
    }
  }

  // Regenerate Grammar Section
  async regenerateGrammarSection(
    worksheetId: string,
    originalFormData: any,
    currentGrammarRules: any,
    additionalGuidelines: string,
    userId: string
  ): Promise<any> {
    try {
      console.log('📤 Sending grammar regeneration request to Edge Function');

      const regenerationPrompt = this.createGrammarRegenerationPrompt(
        originalFormData,
        currentGrammarRules,
        additionalGuidelines
      );

      console.log('🔄 Grammar regeneration prompt:', regenerationPrompt);

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
            targetSectionType: 'grammar'
          },
          userId,
          isRegeneration: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Failed to regenerate grammar: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.grammar_rules) {
        console.log('✅ Grammar rules regenerated successfully');
        return result.grammar_rules;
      } else {
        throw new Error('No grammar rules returned from regeneration');
      }

    } catch (error) {
      console.error('❌ Error in grammar regeneration:', error);
      throw error;
    }
  }

  private createWarmupRegenerationPrompt(
    originalFormData: any,
    currentWarmupQuestions: string[],
    additionalGuidelines: string
  ): string {
    const baseInfo = `
Lesson Topic: ${originalFormData.lessonTopic || 'Not specified'}
Lesson Goal: ${originalFormData.lessonGoal || 'Not specified'}
English Level: ${originalFormData.englishLevel || 'Not specified'}
Lesson Duration: ${originalFormData.lessonTime || '60min'}
`;

    const warmupInfo = `
REGENERATE WARMUP QUESTIONS:
- Current Warmup Questions: ${currentWarmupQuestions.join(', ')}
`;

    const guidelines = additionalGuidelines 
      ? `\nADDITIONAL GUIDELINES:\n${additionalGuidelines}`
      : '';

    const regenerationInstructions = `
IMPORTANT: Generate NEW warmup questions that are completely different from the current ones.
The questions should be engaging, relevant to the lesson topic and level.
Return the response with warmup_questions array containing 4 questions.
`;

    return baseInfo + warmupInfo + guidelines + regenerationInstructions;
  }

  private createGrammarRegenerationPrompt(
    originalFormData: any,
    currentGrammarRules: any,
    additionalGuidelines: string
  ): string {
    const baseInfo = `
Lesson Topic: ${originalFormData.lessonTopic || 'Not specified'}
Lesson Goal: ${originalFormData.lessonGoal || 'Not specified'}
English Level: ${originalFormData.englishLevel || 'Not specified'}
Lesson Duration: ${originalFormData.lessonTime || '60min'}
Grammar Focus: ${originalFormData.teachingPreferences || 'Not specified'}
`;

    const grammarInfo = `
REGENERATE GRAMMAR RULES:
- Current Grammar Title: ${currentGrammarRules.title}
- Current Grammar Introduction: ${currentGrammarRules.introduction}
`;

    const guidelines = additionalGuidelines 
      ? `\nADDITIONAL GUIDELINES:\n${additionalGuidelines}`
      : '';

    const regenerationInstructions = `
IMPORTANT: Generate NEW grammar rules that are completely different from the current ones.
The grammar rules should be clear, well-structured with explanations and examples.
Return the response with grammar_rules object containing title, introduction, and rules array.
`;

    return baseInfo + grammarInfo + guidelines + regenerationInstructions;
  }
}

export const exerciseRegenerationService = new ExerciseRegenerationService();