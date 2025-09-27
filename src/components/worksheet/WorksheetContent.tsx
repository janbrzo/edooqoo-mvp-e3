
import React from "react";
import ExerciseSection from "./ExerciseSection";
import VocabularySheet from "./VocabularySheet";
import WorksheetRating from "@/components/WorksheetRating";
import TeacherNotes from "./TeacherNotes";
import GrammarRules from "./GrammarRules";
import DemoWatermark from "./DemoWatermark";
import WarmupSection from "./WarmupSection";
import { useWorksheetTimes } from "@/hooks/useWorksheetTimes";
import { useExerciseRegeneration } from "@/hooks/useExerciseRegeneration";
import { Loader2, ChevronUp, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { updateWorksheet } from "@/services/worksheetService";
import { toast } from "sonner";

interface WorksheetContentProps {
  editableWorksheet: any;
  isEditing: boolean;
  viewMode: "student" | "teacher";
  setEditableWorksheet: (worksheet: any) => void;
  worksheetId?: string | null;
  onFeedbackSubmit?: (rating: number, feedback: string) => void;
  isDownloadUnlocked: boolean;
  inputParams?: any;
  userId?: string;
}

export default function WorksheetContent({
  editableWorksheet,
  isEditing,
  viewMode,
  setEditableWorksheet,
  worksheetId,
  onFeedbackSubmit,
  isDownloadUnlocked,
  inputParams,
  userId
}: WorksheetContentProps) {
  // Check if worksheet has grammar rules
  const hasGrammar = Boolean(editableWorksheet?.grammar_rules);
  const worksheetTimes = useWorksheetTimes(inputParams?.lessonTime, hasGrammar);
  
  // Get regeneration status for global notification
  const { isLoading, loadingExerciseIndex } = useExerciseRegeneration();
  
  // CRITICAL FIX: Add safety check to prevent rendering with null worksheet
  if (!editableWorksheet) {
    console.log('WorksheetContent: editableWorksheet is null, showing loading...');
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin h-8 w-8 border-4 border-worksheet-purple border-t-transparent rounded-full"></div>
      </div>
    );
  }

  console.log('WorksheetContent: Rendering with editableWorksheet:', editableWorksheet);
  console.log('WorksheetContent: Calculated times:', worksheetTimes);
  console.log('WorksheetContent: Has grammar:', hasGrammar);

  const getExerciseName = (index: number) => {
    if (editableWorksheet?.exercises?.[index]) {
      return editableWorksheet.exercises[index].title || `Exercise ${index + 1}`;
    }
    return `Exercise ${index + 1}`;
  };

  // Function to save worksheet changes to database
  const saveWorksheetChanges = async (updatedWorksheet: any) => {
    if (!worksheetId || !userId) {
      console.log('Cannot save - missing worksheetId or userId');
      return;
    }
    
    try {
      console.log('💾 Saving worksheet changes to database...');
      await updateWorksheet(worksheetId, updatedWorksheet, userId);
      console.log('✅ Worksheet saved successfully');
    } catch (error) {
      console.error('❌ Failed to save worksheet:', error);
      toast.error('Failed to save changes');
    }
  };

  // Move exercise up
  const moveExerciseUp = (index: number) => {
    if (index <= 0) return;
    
    const newExercises = [...editableWorksheet.exercises];
    [newExercises[index - 1], newExercises[index]] = [newExercises[index], newExercises[index - 1]];
    
    const updatedWorksheet = {
      ...editableWorksheet,
      exercises: newExercises
    };
    
    setEditableWorksheet(updatedWorksheet);
    saveWorksheetChanges(updatedWorksheet);
    toast.success('Exercise moved up');
  };

  // Move exercise down
  const moveExerciseDown = (index: number) => {
    if (index >= editableWorksheet.exercises.length - 1) return;
    
    const newExercises = [...editableWorksheet.exercises];
    [newExercises[index], newExercises[index + 1]] = [newExercises[index + 1], newExercises[index]];
    
    const updatedWorksheet = {
      ...editableWorksheet,
      exercises: newExercises
    };
    
    setEditableWorksheet(updatedWorksheet);
    saveWorksheetChanges(updatedWorksheet);
    toast.success('Exercise moved down');
  };

  // Soft delete exercise
  const softDeleteExercise = (index: number) => {
    const updatedExercises = [...editableWorksheet.exercises];
    updatedExercises[index] = {
      ...updatedExercises[index],
      deleted: true,
      deletedAt: new Date().toISOString(),
      deletedBy: userId
    };
    
    const updatedWorksheet = {
      ...editableWorksheet,
      exercises: updatedExercises
    };
    
    setEditableWorksheet(updatedWorksheet);
    saveWorksheetChanges(updatedWorksheet);
    toast.success('Exercise deleted. You can restore it from the deleted section below.');
  };

  // Restore deleted exercise
  const restoreExercise = (index: number) => {
    const updatedExercises = [...editableWorksheet.exercises];
    const { deleted, deletedAt, deletedBy, ...cleanExercise } = updatedExercises[index];
    updatedExercises[index] = cleanExercise;
    
    const updatedWorksheet = {
      ...editableWorksheet,
      exercises: updatedExercises
    };
    
    setEditableWorksheet(updatedWorksheet);
    saveWorksheetChanges(updatedWorksheet);
    toast.success('Exercise restored successfully');
  };

  // Filter active and deleted exercises
  const activeExercises = editableWorksheet.exercises?.filter((ex: any) => !ex.deleted) || [];
  const deletedExercises = editableWorksheet.exercises?.filter((ex: any) => ex.deleted) || [];

  return (
    <div className="worksheet-content mb-8" id="worksheet-content">
      <div className="page-number"></div>
      
      <div className="bg-white p-6 border rounded-lg shadow-sm mb-6 relative">
        {!isDownloadUnlocked && <DemoWatermark />}
        
        {/* Simple edooqoo link - positioned in top right */}
        <div className="absolute top-4 right-4 hidden sm:block">
          <a 
            href="https://edooqoo.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-gray-500 hover:text-worksheet-purple transition-colors duration-200"
          >
            Create your own at edooqoo.com
          </a>
        </div>
        
        <h1 className="text-3xl font-bold mb-2 text-worksheet-purpleDark leading-tight pr-24">
          {isEditing ? (
            <input 
              type="text" 
              value={editableWorksheet.title || ''} 
              onChange={e => setEditableWorksheet({
                ...editableWorksheet,
                title: e.target.value
              })} 
              className="w-full border p-2 editable-content" 
            />
          ) : (editableWorksheet.title || 'Untitled Worksheet')}
        </h1>
        
        <h2 className="text-xl text-worksheet-purple mb-3 leading-tight pr-24">
          {isEditing ? (
            <input 
              type="text" 
              value={editableWorksheet.subtitle || ''} 
              onChange={e => setEditableWorksheet({
                ...editableWorksheet,
                subtitle: e.target.value
              })} 
              className="w-full border p-2 editable-content" 
            />
          ) : (editableWorksheet.subtitle || '')}
        </h2>

        <div className="mb-4 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-md">
          {isEditing ? (
            <textarea 
              value={editableWorksheet.introduction || ''} 
              onChange={e => setEditableWorksheet({
                ...editableWorksheet,
                introduction: e.target.value
              })} 
              className="w-full h-20 border p-2 editable-content" 
            />
          ) : (
            <p className="leading-snug">{editableWorksheet.introduction || ''}</p>
          )}
        </div>

        {/* Total lesson time display */}
        {viewMode === 'teacher' && (
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md mb-4">
            <strong>Total lesson time: {worksheetTimes.totalLesson} minutes</strong>
            <div className="mt-1 text-xs">
              Warmup: {worksheetTimes.warmup}min{hasGrammar ? ` • Grammar: ${worksheetTimes.grammar}min` : ''} • Exercises: {worksheetTimes.exercisesTotal}min
            </div>
          </div>
        )}
      </div>

      {/* Warmup Section - added before grammar rules */}
      {inputParams && (
        <WarmupSection
          inputParams={inputParams}
          isEditing={isEditing}
          editableWorksheet={editableWorksheet}
          setEditableWorksheet={setEditableWorksheet}
          isDownloadUnlocked={isDownloadUnlocked}
        />
      )}

      {editableWorksheet.grammar_rules && (
        <div className="relative">
          {!isDownloadUnlocked && <DemoWatermark />}
          <GrammarRules
            grammarRules={editableWorksheet.grammar_rules}
            isEditing={isEditing}
            editableWorksheet={editableWorksheet}
            setEditableWorksheet={setEditableWorksheet}
            inputParams={inputParams}
          />
        </div>
      )}

      {/* Active exercises */}
      {activeExercises.map((exercise: any, activeIndex: number) => {
        // Find the original index in the full exercises array
        const originalIndex = editableWorksheet.exercises.findIndex((ex: any) => ex === exercise);
        
        return (
          <div key={originalIndex} className="relative">
            {!isDownloadUnlocked && <DemoWatermark />}
            <ExerciseSection
              exercise={exercise}
              index={originalIndex}
              isEditing={isEditing}
              viewMode={viewMode}
              editableWorksheet={editableWorksheet}
              setEditableWorksheet={setEditableWorksheet}
              worksheetId={worksheetId}
              originalFormData={inputParams}
              userId={userId}
              totalExercises={activeExercises.length}
              onMoveUp={() => moveExerciseUp(originalIndex)}
              onMoveDown={() => moveExerciseDown(originalIndex)}
              onDeleteExercise={() => softDeleteExercise(originalIndex)}
            />
          </div>
        );
      })}

      {editableWorksheet.vocabulary_sheet && editableWorksheet.vocabulary_sheet.length > 0 && (
        <div className="relative">
          {!isDownloadUnlocked && <DemoWatermark />}
          <VocabularySheet
            vocabularySheet={editableWorksheet.vocabulary_sheet}
            isEditing={isEditing}
            viewMode={viewMode}
            editableWorksheet={editableWorksheet}
            setEditableWorksheet={setEditableWorksheet}
          />
        </div>
      )}

      {/* Deleted exercises section - moved here and always visible */}
      {deletedExercises.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between hover:bg-red-100 text-red-700"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">Deleted Exercises ({deletedExercises.length})</span>
                </div>
                <ChevronUp className="h-4 w-4 transition-transform [&[data-state=open]]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-3">
              {deletedExercises.map((exercise: any, index: number) => {
                const originalIndex = editableWorksheet.exercises.findIndex((ex: any) => ex === exercise);
                return (
                  <div key={originalIndex} className="bg-white border border-red-300 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{exercise.title || `Exercise ${originalIndex + 1}`}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Deleted on {new Date(exercise.deletedAt).toLocaleDateString()} at {new Date(exercise.deletedAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <Button
                      onClick={() => restoreExercise(originalIndex)}
                      variant="outline"
                      size="sm"
                      className="ml-4 border-green-300 text-green-700 hover:bg-green-50"
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Restore
                    </Button>
                  </div>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}

      <WorksheetRating 
        worksheetId={worksheetId}
        onSubmitRating={onFeedbackSubmit} 
      />

      <TeacherNotes />
      
      {/* Global regeneration notification */}
      {isLoading && loadingExerciseIndex !== null && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-worksheet-purple text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm font-medium">
            {getExerciseName(loadingExerciseIndex)} is being regenerated...
          </span>
        </div>
      )}
    </div>
  );
}
