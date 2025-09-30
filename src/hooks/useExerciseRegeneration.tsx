import { useState } from 'react';
import { toast } from 'sonner';
import { exerciseRegenerationService } from '@/services/exerciseRegenerationService';

interface RegenerationState {
  isModalOpen: boolean;
  isLoading: boolean;
  loadingExerciseIndex: number | null;
  guidelines: string;
  sectionType: 'exercise' | 'warmup' | 'grammar';
  sectionTitle: string;
}

export const useExerciseRegeneration = () => {
  const [state, setState] = useState<RegenerationState>({
    isModalOpen: false,
    isLoading: false,
    loadingExerciseIndex: null,
    guidelines: '',
    sectionType: 'exercise',
    sectionTitle: ''
  });

  const openModal = (exerciseIndex: number, sectionType: 'exercise' | 'warmup' | 'grammar' = 'exercise', sectionTitle: string = '') => {
    setState(prev => ({
      ...prev,
      isModalOpen: true,
      loadingExerciseIndex: exerciseIndex,
      guidelines: '',
      sectionType,
      sectionTitle
    }));
  };

  const closeModal = () => {
    setState(prev => ({
      ...prev,
      isModalOpen: false,
      guidelines: '',
      sectionType: 'exercise',
      sectionTitle: ''
    }));
  };

  const setGuidelines = (guidelines: string) => {
    setState(prev => ({ ...prev, guidelines }));
  };

  const regenerateSection = async (
    worksheetId: string,
    sectionType: 'warmup' | 'grammar',
    originalFormData: any,
    currentSection: any,
    editableWorksheet: any,
    setEditableWorksheet: React.Dispatch<React.SetStateAction<any>>,
    userId: string
  ) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      closeModal();

      console.log(`🔄 Starting ${sectionType} regeneration:`, {
        worksheetId,
        sectionType,
        guidelines: state.guidelines
      });

      const newSection = await exerciseRegenerationService.regenerateSection(
        worksheetId,
        sectionType,
        originalFormData,
        currentSection,
        state.guidelines,
        userId
      );

      // Update the specific section in the worksheet
      const updatedWorksheet = {
        ...editableWorksheet,
        [sectionType === 'warmup' ? 'warmup_questions' : 'grammar_rules']: newSection
      };

      setEditableWorksheet(updatedWorksheet);

      // Update the worksheet in the database
      await exerciseRegenerationService.updateWorksheetInDatabase(
        worksheetId,
        updatedWorksheet,
        userId
      );

      toast.success(`${sectionType === 'warmup' ? 'Warmup Questions' : 'Grammar Rules'} regenerated successfully!`);
      
    } catch (error) {
      console.error(`Error regenerating ${sectionType}:`, error);
      toast.error(error instanceof Error ? error.message : `Failed to regenerate ${sectionType}`);
    } finally {
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        loadingExerciseIndex: null
      }));
    }
  };

  const regenerateExercise = async (
    worksheetId: string,
    exerciseIndex: number,
    originalFormData: any,
    currentExercise: any,
    editableWorksheet: any,
    setEditableWorksheet: React.Dispatch<React.SetStateAction<any>>,
    userId: string
  ) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      closeModal();

      console.log('🔄 Starting exercise regeneration:', {
        worksheetId,
        exerciseIndex,
        exerciseType: currentExercise.type,
        guidelines: state.guidelines
      });

      const newExercise = await exerciseRegenerationService.regenerateExercise(
        worksheetId,
        exerciseIndex,
        originalFormData,
        currentExercise,
        state.guidelines,
        userId
      );

      // Update the specific exercise in the worksheet
      const updatedExercises = [...editableWorksheet.exercises];
      updatedExercises[exerciseIndex] = newExercise;

      const updatedWorksheet = {
        ...editableWorksheet,
        exercises: updatedExercises
      };

      setEditableWorksheet(updatedWorksheet);

      // Update the worksheet in the database
      await exerciseRegenerationService.updateWorksheetInDatabase(
        worksheetId,
        updatedWorksheet,
        userId
      );

      toast.success('Exercise regenerated successfully!');
      
    } catch (error) {
      console.error('Error regenerating exercise:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to regenerate exercise');
    } finally {
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        loadingExerciseIndex: null
      }));
    }
  };

  return {
    ...state,
    openModal,
    closeModal,
    setGuidelines,
    regenerateExercise,
    regenerateSection
  };
};