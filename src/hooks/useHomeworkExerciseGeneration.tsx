import { useState } from 'react';
import { toast } from 'sonner';

interface GeneratedExercise {
  id: string;
  type: string;
  title: string;
  instructions: string;
  content: any;
  selected: boolean;
}

// Normalize text fields that might be wrapped in {text: "..."} objects
function normalizeExerciseField(field: any): string {
  if (!field) return '';
  if (typeof field === 'string') return field;
  if (typeof field === 'object' && field.text) return field.text;
  if (typeof field === 'object' && field.content) return field.content;
  return JSON.stringify(field); // fallback
}

export const useHomeworkExerciseGeneration = () => {
  const [generatedExercises, setGeneratedExercises] = useState<GeneratedExercise[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateSimilarExercises = async (
    worksheetFormData: any,
    userId: string,
    options?: { targetTypes?: string[]; countPerType?: number }
  ) => {
    setIsGenerating(true);
    
    try {
      console.log('🎯 Generating similar exercises for homework', options);
      
      // If options.targetTypes is provided, generate sequentially for each type
      if (options?.targetTypes && options.targetTypes.length > 0) {
        const count = options.countPerType && options.countPerType > 0 ? options.countPerType : 1;
        
        // Build array of tasks: for each type, generate 'count' exercises
        const tasks = options.targetTypes.flatMap(type => 
          Array(count).fill(type)
        );
        
        console.log(`📝 Will generate ${tasks.length} exercise(s): ${tasks.join(', ')}`);
        
        // Generate exercises sequentially
        for (let i = 0; i < tasks.length; i++) {
          const targetType = tasks[i];
          console.log(`⏳ Generating ${i + 1}/${tasks.length}: ${targetType}`);
          
          const response = await fetch('https://bvfrkzdlklyvnhlpleck.supabase.co/functions/v1/generateWorksheet', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              prompt: createGenerationPrompt(worksheetFormData, targetType),
              formData: {
                ...worksheetFormData,
                regenerationMode: true,
                targetExerciseType: targetType
              },
              userId,
              isRegeneration: true
            })
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.error || `Failed to generate ${targetType}`);
          }

          const result = await response.json();
          
          if (result.exercises && result.exercises.length > 0) {
            // Add unique IDs and selection state, normalize text fields
            const exercisesWithState = result.exercises.map((exercise: any, index: number) => ({
              ...exercise,
              id: `generated-${Date.now()}-${i}-${index}`,
              selected: false,
              title: normalizeExerciseField(exercise.title),
              instructions: normalizeExerciseField(exercise.instructions),
              content: normalizeExerciseField(exercise.content),
            }));
            
            // APPEND to existing generated exercises
            setGeneratedExercises(prev => [...prev, ...exercisesWithState]);
            console.log(`✅ Generated ${exercisesWithState.length} exercise(s) for ${targetType}`);
          }
        }
        
        toast.success(`Generated ${tasks.length} exercise(s) successfully`);
      } else {
        // Original behavior: generate 2-3 general exercises
        const response = await fetch('https://bvfrkzdlklyvnhlpleck.supabase.co/functions/v1/generateWorksheet', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: createGenerationPrompt(worksheetFormData),
            formData: {
              ...worksheetFormData,
              regenerationMode: true,
            },
            userId,
            isRegeneration: true
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.error || 'Failed to generate exercises');
        }

        const result = await response.json();
        
        if (result.exercises && result.exercises.length > 0) {
          const exercisesWithState = result.exercises.map((exercise: any, index: number) => ({
            ...exercise,
            id: `generated-${Date.now()}-${index}`,
            selected: false,
            title: normalizeExerciseField(exercise.title),
            instructions: normalizeExerciseField(exercise.instructions),
            content: normalizeExerciseField(exercise.content),
          }));
          
          setGeneratedExercises(exercisesWithState);
          toast.success(`Generated ${exercisesWithState.length} similar exercise(s)`);
        } else {
          throw new Error('No exercises returned');
        }
      }
      
    } catch (error) {
      console.error('❌ Error generating exercises:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate exercises');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleExerciseSelection = (exerciseId: string) => {
    setGeneratedExercises(prev => 
      prev.map(ex => 
        ex.id === exerciseId 
          ? { ...ex, selected: !ex.selected }
          : ex
      )
    );
  };

  const clearGeneratedExercises = () => {
    setGeneratedExercises([]);
  };

  const getSelectedGeneratedExercises = () => {
    return generatedExercises.filter(ex => ex.selected);
  };

  return {
    generatedExercises,
    isGenerating,
    generateSimilarExercises,
    toggleExerciseSelection,
    clearGeneratedExercises,
    getSelectedGeneratedExercises
  };
};

function createGenerationPrompt(worksheetFormData: any, targetExerciseType?: string): string {
  const { 
    lessonTopic, 
    lessonGoal, 
    englishLevel, 
    lessonTime,
    grammarFocus,
    vocabularyFocus,
    languageStyle
  } = worksheetFormData;
  
  const baseInfo = `
Lesson Topic: ${lessonTopic || 'Not specified'}
Lesson Goal: ${lessonGoal || 'Not specified'}
English Level: ${englishLevel || 'Not specified'}
Lesson Duration: ${lessonTime || '60min'}
Grammar Focus: ${grammarFocus || 'Not specified'}
Vocabulary: ${vocabularyFocus || 'Not specified'}
Language Style: ${languageStyle || 'Formal'}
`;

  const instructions = targetExerciseType 
    ? `Generate ONE high-quality exercise of type "${targetExerciseType}".

Requirements:
- Must be similar in style and difficulty to other exercises in this lesson
- Use DIFFERENT content and examples than the original worksheet
- Maintain the same English level (${englishLevel})
- If the exercise type uses vocabulary, incorporate words from: ${vocabularyFocus || 'lesson context'}
- If the exercise type practices grammar, focus on: ${grammarFocus || 'lesson grammar'}
- Make it engaging, practical, and appropriate for: ${lessonGoal || 'general learning'}
`
    : `Generate 2-3 exercises similar to those in the original worksheet, with the same types but different content.

Requirements:
- Match the lesson's English level and topic
- Use different content than the original worksheet
- If grammar focus is specified, incorporate: ${grammarFocus}
- If vocabulary is specified, use relevant words from: ${vocabularyFocus}
- Keep exercises engaging and contextually relevant`;

  return `${baseInfo}\n\n${instructions}\n\nEnsure all exercises are fresh, contextually relevant, and pedagogically sound.`;
}
