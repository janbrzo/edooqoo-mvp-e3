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

export const useHomeworkExerciseGeneration = () => {
  const [generatedExercises, setGeneratedExercises] = useState<GeneratedExercise[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateSimilarExercises = async (
    worksheetFormData: any,
    userId: string,
    targetExerciseType?: string
  ) => {
    setIsGenerating(true);
    
    try {
      console.log('🎯 Generating similar exercises for homework');
      
      // Use the same edge function as worksheet regeneration
      const response = await fetch('https://bvfrkzdlklyvnhlpleck.supabase.co/functions/v1/generateWorksheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: createGenerationPrompt(worksheetFormData, targetExerciseType),
          formData: {
            ...worksheetFormData,
            regenerationMode: true,
            targetExerciseType: targetExerciseType || worksheetFormData.selectedExercises?.[0] || 'fill-in-blanks'
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
        // Add unique IDs and selection state to generated exercises
        const exercisesWithState = result.exercises.map((exercise: any, index: number) => ({
          ...exercise,
          id: `generated-${Date.now()}-${index}`,
          selected: false
        }));
        
        setGeneratedExercises(exercisesWithState);
        toast.success(`Generated ${exercisesWithState.length} similar exercise(s)`);
        console.log('✅ Generated exercises:', exercisesWithState.length);
      } else {
        throw new Error('No exercises returned');
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

function createGenerationPrompt(formData: any, targetExerciseType?: string): string {
  const baseInfo = `
Lesson Topic: ${formData.lessonTopic || 'Not specified'}
Lesson Goal: ${formData.lessonGoal || 'Not specified'}
English Level: ${formData.englishLevel || 'Not specified'}
Lesson Duration: ${formData.lessonTime || '60min'}
`;

  const instructions = targetExerciseType 
    ? `Generate ONE exercise of type "${targetExerciseType}" that is similar in style and difficulty but with different content.`
    : `Generate exercises similar to those in the original worksheet, with the same types but different content.`;

  return `${baseInfo}\n\n${instructions}\n\nMake sure the exercises are fresh, engaging, and appropriate for the level.`;
}
