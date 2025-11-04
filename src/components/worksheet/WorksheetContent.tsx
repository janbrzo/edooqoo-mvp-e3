
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { updateWorksheet } from "@/services/worksheetService";
import { useWorksheetTimes } from "@/hooks/useWorksheetTimes";
import { useExerciseRegeneration } from "@/hooks/useExerciseRegeneration";
import { useWorksheetNavigation } from "@/hooks/useWorksheetNavigation";
import ExerciseSection from "./ExerciseSection";
import WarmupSection from "./WarmupSection";
import GrammarRules from "./GrammarRules";
import VocabularySheet from "./VocabularySheet";
import WorksheetRating from "@/components/WorksheetRating";
import TeacherNotes from "./TeacherNotes";
import DemoWatermark from "./DemoWatermark";
import MediaSection from "./MediaSection";
import { ExerciseNavSidebar } from "./ExerciseNavSidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, RotateCcw, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  onExpandAll?: (expandAllFn: () => void) => void;
  onCloseSidebar?: (closeSidebarFn: () => void) => void;
  isPinned?: boolean;
  onTogglePin?: () => void;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
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
  userId,
  onExpandAll,
  onCloseSidebar,
  isPinned = false,
  onTogglePin,
  isFullScreen = false,
  onToggleFullScreen
}: WorksheetContentProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Pass closeSidebar function to parent for toolbar usage
  React.useEffect(() => {
    if (onCloseSidebar) {
      onCloseSidebar(() => setSidebarOpen(false));
    }
  }, [onCloseSidebar]);
  // Check if worksheet has grammar rules
  const hasGrammar = Boolean(editableWorksheet?.grammar_rules);
  const worksheetTimes = useWorksheetTimes(inputParams?.lessonTime, hasGrammar);
  
  // Get regeneration status for global notification
  const { isLoading, loadingExerciseIndex } = useExerciseRegeneration();
  
  // Filter active and deleted exercises
  const activeExercises = editableWorksheet?.exercises?.filter((ex: any) => !ex.deleted) || [];
  const deletedExercises = editableWorksheet?.exercises?.filter((ex: any) => ex.deleted) || [];

  // Initialize navigation hook
  const navigation = useWorksheetNavigation({
    exercises: activeExercises || []
  });

  // Pass expandAll function to parent for toolbar usage
  React.useEffect(() => {
    if (onExpandAll) {
      onExpandAll(navigation.expandAll);
    }
  }, [onExpandAll, navigation.expandAll]);

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

  // Function to update exercise numbers in titles
  const updateExerciseNumbers = (exercises: any[]) => {
    return exercises.map((exercise, index) => {
      if (exercise.title && exercise.title.match(/^Exercise \d+:/)) {
        // Update the exercise number while keeping the rest of the title
        const titleParts = exercise.title.split(': ');
        if (titleParts.length > 1) {
          return {
            ...exercise,
            title: `Exercise ${index + 1}: ${titleParts.slice(1).join(': ')}`
          };
        }
      }
      return {
        ...exercise,
        title: exercise.title || `Exercise ${index + 1}`
      };
    });
  };

  // Move exercise up
  const moveExerciseUp = (index: number) => {
    if (index <= 0) return;
    
    const newExercises = [...editableWorksheet.exercises];
    [newExercises[index - 1], newExercises[index]] = [newExercises[index], newExercises[index - 1]];
    
    // Update exercise numbers
    const updatedExercises = updateExerciseNumbers(newExercises);
    
    const updatedWorksheet = {
      ...editableWorksheet,
      exercises: updatedExercises
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
    
    // Update exercise numbers
    const updatedExercises = updateExerciseNumbers(newExercises);
    
    const updatedWorksheet = {
      ...editableWorksheet,
      exercises: updatedExercises
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

  // Filter active and deleted exercises - moved above navigation hook
  // const activeExercises = editableWorksheet.exercises?.filter((ex: any) => !ex.deleted) || [];
  // const deletedExercises = editableWorksheet.exercises?.filter((ex: any) => ex.deleted) || [];

  return (
    <div className="worksheet-content mb-8 relative w-full" id="worksheet-content">
      {/* Exercise Navigation Sidebar */}
      {activeExercises.length > 0 && (
        <ExerciseNavSidebar
          exercises={activeExercises.map((exercise, index) => ({
            title: exercise.title,
            icon: exercise.icon,
            estimated_time: exercise.estimated_time
          }))}
          activeExercise={navigation.activeExercise}
          collapsedExercises={navigation.collapsedExercises}
          onScrollToExercise={navigation.scrollToExercise}
          onToggleExercise={navigation.toggleExercise}
          onCollapseAll={navigation.collapseAll}
          onExpandAll={navigation.expandAll}
          isAllCollapsed={navigation.isAllCollapsed}
          isAllExpanded={navigation.isAllExpanded}
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
        />
      )}

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
          worksheetId={worksheetId}
          userId={userId}
        />
      )}

      {editableWorksheet.grammar_rules && (
        <div className="relative" data-section="grammar" id="grammar-rules-section">
          {!isDownloadUnlocked && <DemoWatermark />}
          <GrammarRules
            grammarRules={editableWorksheet.grammar_rules}
            isEditing={isEditing}
            editableWorksheet={editableWorksheet}
            setEditableWorksheet={setEditableWorksheet}
            inputParams={inputParams}
            worksheetId={worksheetId}
            userId={userId}
          />
        </div>
      )}

      {/* Media Section - displays image or audio for media-enhanced exercises */}
      {(() => {
        // Reconstruct selectedAudio from worksheet database fields if needed
        const reconstructedAudio = (editableWorksheet?.audio_url || editableWorksheet?.audio_base64_backup)
          ? {
              url: editableWorksheet.audio_url || null,
              ai_generated_audio_url: editableWorksheet.audio_url || null,
              audio_base64_backup: editableWorksheet.audio_base64_backup || null,
              transcript: editableWorksheet.audio_transcript || null,
              duration: editableWorksheet.audio_duration || null,
              voice: editableWorksheet.audio_voice || null,
              source: 'openai-tts-generated',
              id: editableWorksheet.id
            }
          : (inputParams?.selectedAudio || editableWorksheet?.selected_audio || null);

        const hasMedia = inputParams?.selectedImage || editableWorksheet?.selected_image || reconstructedAudio;
        
        return hasMedia ? (
          <>
            <MediaSection
              selectedImage={inputParams?.selectedImage || editableWorksheet?.selected_image}
              selectedAudio={reconstructedAudio}
              base64Backup={editableWorksheet?.base64_backup}
              isDownloadUnlocked={isDownloadUnlocked}
              isPinned={isPinned}
              onTogglePin={onTogglePin}
              isFullScreen={isFullScreen}
              onToggleFullScreen={onToggleFullScreen}
            />
            
            {/* Pinned Audio Player - compact mini player in bottom right corner */}
            {isPinned && reconstructedAudio && (
              <div className="fixed bottom-20 right-4 z-50 bg-white border-2 border-worksheet-purple rounded-lg shadow-2xl w-64">
                {/* X button at top right */}
                <div className="flex items-center justify-end p-2 pb-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onTogglePin}
                    className="h-6 w-6 p-0 hover:bg-gray-100"
                    title="Unpin audio player"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                
                {/* Audio Player */}
                <div className="px-2 pb-2">
                  <audio
                    controls
                    src={
                      reconstructedAudio.ai_generated_audio_url || 
                      reconstructedAudio.url || 
                      (reconstructedAudio.audio_base64_backup ? `data:audio/mpeg;base64,${reconstructedAudio.audio_base64_backup}` : '')
                    }
                    className="w-full"
                    controlsList="nodownload"
                    style={{ 
                      height: '32px',
                      backgroundColor: '#f3f4f6',
                      borderRadius: '6px'
                    }}
                  />
                </div>
                
                {/* Transcript - optional */}
                {reconstructedAudio.transcript && (
                  <details className="px-2 pb-2">
                    <summary className="cursor-pointer text-xs font-medium text-gray-700 hover:text-worksheet-purple">
                      Transcript
                    </summary>
                    <div className="mt-1 p-2 bg-gray-50 rounded-lg text-xs text-gray-700 leading-relaxed max-h-32 overflow-y-auto">
                      {reconstructedAudio.transcript}
                    </div>
                  </details>
                )}
              </div>
            )}
          </>
        ) : null;
      })()}

      {/* Active exercises - sorted to show media exercises first (picture > audio > others) */}
        {(() => {
          // Create sorted version for display
          const sortedExercises = activeExercises
            .slice()
            .sort((a: any, b: any) => {
              // Check if exercise types contain '-picture' or '-audio' suffix
              const aIsPicture = a.type?.includes('-picture') || a.image_url || a.media_url;
              const bIsPicture = b.type?.includes('-picture') || b.image_url || b.media_url;
              
              const aIsAudio = a.type?.includes('-audio') || a.type === 'listening-comprehension';
              const bIsAudio = b.type?.includes('-audio') || b.type === 'listening-comprehension';
              
              // Priority: picture > audio > others
              if (aIsPicture && !bIsPicture) return -1;
              if (!aIsPicture && bIsPicture) return 1;
              
              if (aIsAudio && !bIsAudio) return -1;
              if (!aIsAudio && bIsAudio) return 1;
              
              return 0;
            });
          
          return sortedExercises.map((exercise: any, sortedIndex: number) => {
            // Find the original index in the full exercises array
            const originalIndex = editableWorksheet.exercises.findIndex((ex: any) => ex === exercise);
            
            return (
              <div key={originalIndex} className="relative">
                {!isDownloadUnlocked && <DemoWatermark />}
                <ExerciseSection
                  ref={(el) => (navigation.exerciseRefs.current[sortedIndex] = el)}
                  exercise={exercise}
                  index={sortedIndex + 1}
                  originalIndex={originalIndex}
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
                  isCollapsed={navigation.collapsedExercises.get(sortedIndex)}
                  onToggleCollapse={() => navigation.toggleExercise(sortedIndex)}
                />
              </div>
            );
          });
        })()}

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
