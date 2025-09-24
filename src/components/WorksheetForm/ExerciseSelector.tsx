import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { LessonTime, ExerciseSelectionMode, MediaType } from './types';

const AVAILABLE_EXERCISES = [
  { id: 'reading', label: 'Reading Comprehension', icon: '📖' },
  { id: 'true-false', label: 'True/False Questions', icon: '✓✗' },
  { id: 'matching', label: 'Matching Exercise', icon: '🔗' },
  { id: 'fill-in-blanks', label: 'Fill in the Blanks', icon: '✏️' },
  { id: 'multiple-choice', label: 'Multiple Choice', icon: '📝' },
  { id: 'dialogue', label: 'Dialogue Practice', icon: '💬' },
  { id: 'discussion', label: 'Discussion Questions', icon: '👥' },
  { id: 'error-correction', label: 'Error Correction', icon: '⚠️' },
  { id: 'odd-one-out', label: 'Odd One Out', icon: '🔍' },
  { id: 'synonyms-antonyms', label: 'Synonyms & Antonyms Matching', icon: '↔️' },
  { id: 'sentence-transformation', label: 'Sentence Transformation', icon: '🔄' },
  { id: 'word-order', label: 'Word Order', icon: '📋' },
  { id: 'gap-text', label: 'Gap Text (Cloze)', icon: '📄' },
  { id: 'negative-prefixes', label: 'Negative Prefixes', icon: '➖' },
  { id: 'categorize', label: 'Categorization', icon: '📊' },
  { id: 'paraphrasing', label: 'Paraphrasing', icon: '🔄' },
  { id: 'complete-word', label: 'Complete the Word', icon: '🅰️' },
  { id: 'matching-halves', label: 'Matching Halves', icon: '🧩' },
  { id: 'describe-picture', label: 'Describe Picture', icon: '🖼️', comingSoon: true },
  { id: 'answer-questions', label: 'Answer Questions', icon: '❓', comingSoon: true }
];

// Predefined exercise sets for Manual mode
const MANUAL_EXERCISES_60MIN = ['reading', 'true-false', 'matching', 'fill-in-blanks', 'categorize', 'odd-one-out', 'multiple-choice', 'discussion'];
const MANUAL_EXERCISES_45MIN = ['reading', 'true-false', 'matching', 'fill-in-blanks', 'categorize', 'odd-one-out'];

const MEDIA_ENHANCED_OPTIONS = [
  { id: 'video', label: 'Video', icon: '🎥' },
  { id: 'audio', label: 'Audio', icon: '🎵' },
  { id: 'picture', label: 'Picture', icon: '🖼️' }
];

interface ExerciseSelectorProps {
  lessonTime: LessonTime;
  selectedExercises: string[];
  onChange: (exercises: string[]) => void;
  selectionMode: ExerciseSelectionMode;
}

export default function ExerciseSelector({ lessonTime, selectedExercises, onChange, selectionMode }: ExerciseSelectorProps) {
  const maxExercises = lessonTime === '45min' ? 6 : 8;
  const [showAllExercises, setShowAllExercises] = useState(false);
  const [selectedMediaTypes, setSelectedMediaTypes] = useState<MediaType[]>([]);
  
  // Get default exercises for manual mode
  const manualDefaults = useMemo(() => 
    lessonTime === '45min' ? MANUAL_EXERCISES_45MIN : MANUAL_EXERCISES_60MIN,
    [lessonTime]
  );
  
  // Generate random exercises for random mode
  const generateRandomExercises = useCallback(() => {
    const availableExercises = AVAILABLE_EXERCISES
      .filter(ex => !ex.comingSoon)
      .map(ex => ex.id);
    
    const shuffled = [...availableExercises].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, maxExercises);
  }, [maxExercises]);

  // Initialize exercises based on mode
  useEffect(() => {
    if (selectedExercises.length === 0) {
      console.log(`🔧 [EXERCISE-SELECTOR] Initializing with ${selectionMode} mode for ${lessonTime}`);
      
      let initialExercises: string[];
      if (selectionMode === 'manual') {
        initialExercises = manualDefaults;
      } else if (selectionMode === 'random') {
        initialExercises = generateRandomExercises();
      } else {
        // Smart mode - use manual defaults for now
        initialExercises = manualDefaults;
      }
      
      console.log(`🔧 [EXERCISE-SELECTOR] Setting initial exercises:`, initialExercises);
      onChange(initialExercises);
    }
  }, [lessonTime, selectionMode, selectedExercises.length, onChange, manualDefaults, generateRandomExercises]);

  // Handle lesson time changes - adjust exercise count
  useEffect(() => {
    if (selectedExercises.length > 0) {
      console.log(`🔧 [EXERCISE-SELECTOR] Lesson time changed to ${lessonTime}, adjusting exercises`);
      
      if (selectionMode === 'manual') {
        // For manual mode, adjust to the new count using manual defaults
        const newExercises = lessonTime === '45min' ? MANUAL_EXERCISES_45MIN : MANUAL_EXERCISES_60MIN;
        console.log(`🔧 [EXERCISE-SELECTOR] Manual mode: adjusting to ${newExercises.length} exercises`);
        onChange(newExercises);
      } else if (selectionMode === 'random') {
        // For random mode, generate new random selection
        const newExercises = generateRandomExercises();
        console.log(`🔧 [EXERCISE-SELECTOR] Random mode: generating new selection with ${newExercises.length} exercises`);
        onChange(newExercises);
      }
    }
  }, [lessonTime, selectionMode, generateRandomExercises, onChange]);


  const handleExerciseToggle = useCallback((exerciseId: string, checked: boolean) => {
    if (selectionMode !== 'manual') return; // Only allow manual changes in manual mode
    
    console.log(`🔧 [EXERCISE-SELECTOR] Toggle ${exerciseId}: ${checked}`);
    let newSelection = [...selectedExercises];
    
    if (checked && !newSelection.includes(exerciseId) && newSelection.length < maxExercises) {
      newSelection.push(exerciseId);
    } else if (!checked && newSelection.includes(exerciseId)) {
      newSelection = newSelection.filter(id => id !== exerciseId);
    }
    
    console.log(`🔧 [EXERCISE-SELECTOR] New selection after toggle:`, newSelection);
    onChange(newSelection);
  }, [selectedExercises, maxExercises, onChange, selectionMode]);

  const handleMediaToggle = (mediaType: MediaType) => {
    const newMediaTypes = selectedMediaTypes.includes(mediaType)
      ? selectedMediaTypes.filter(type => type !== mediaType)
      : [...selectedMediaTypes, mediaType];
    
    setSelectedMediaTypes(newMediaTypes);
    // TODO: This will be used for media-enhanced exercises in the future
  };

  return (
    <div>
      {/* Show/Hide All Exercises Toggle */}
        <Collapsible open={showAllExercises} onOpenChange={setShowAllExercises}>
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full mb-4 border-worksheet-purple text-worksheet-purple hover:bg-worksheet-purpleLight"
            >
              {showAllExercises ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Hide exercise types
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Show all 20 exercise types
                </>
              )}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-4">
            {/* Media Enhanced Options */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Media Enhanced</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                {MEDIA_ENHANCED_OPTIONS.map((media) => (
                  <button
                    key={media.id}
                    type="button"
                    disabled
                    className="p-3 rounded-lg border-2 border-gray-200 bg-gray-100 text-left opacity-60 cursor-not-allowed"
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-lg">{media.icon}</span>
                      <span className="font-medium text-gray-500">{media.label}</span>
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded ml-auto">Coming Soon</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* All Exercise Types */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Exercise Types</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {AVAILABLE_EXERCISES.map((exercise) => {
                  const isSelected = selectedExercises.includes(exercise.id);
                  const canSelect = selectionMode === 'manual' && (isSelected || selectedExercises.length < maxExercises) && !exercise.comingSoon;
                  const isDisabled = selectionMode !== 'manual' || exercise.comingSoon;
                  
                  return (
                    <div 
                      key={exercise.id} 
                      className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                        exercise.comingSoon
                          ? 'bg-gray-100 border-gray-200 opacity-60'
                          : isSelected 
                            ? 'bg-worksheet-purpleLight border-worksheet-purple' 
                            : canSelect 
                              ? 'bg-gray-50 border-gray-200 hover:bg-gray-100' 
                              : 'bg-gray-100 border-gray-200 opacity-50'
                      }`}
                    >
                      <Checkbox
                        id={exercise.id}
                        checked={isSelected}
                        onCheckedChange={(checked) => handleExerciseToggle(exercise.id, !!checked)}
                        disabled={isDisabled}
                        className="data-[state=checked]:bg-worksheet-purple data-[state=checked]:border-worksheet-purple"
                      />
                      <label 
                        htmlFor={exercise.id} 
                        className={`flex items-center space-x-2 text-sm font-medium cursor-pointer ${
                          exercise.comingSoon ? 'text-gray-400' : canSelect ? 'text-gray-700' : 'text-gray-400'
                        }`}
                      >
                        <span className="text-lg">{exercise.icon}</span>
                        <span>{exercise.label}</span>
                        {exercise.comingSoon && (
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded ml-auto">Coming Soon</span>
                        )}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Selection Info */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Current mode:</span> {selectionMode.charAt(0).toUpperCase() + selectionMode.slice(1)}
            {selectionMode === 'manual' && " - Click 'Show all 20 exercise types' to customize your selection"}
            {selectionMode === 'random' && " - A new random selection will be generated each time you switch to this mode"}
          </p>
          
          {selectedExercises.length === maxExercises && (
            <p className="mt-2 text-sm text-worksheet-purple font-medium">
              Perfect! You have selected all {maxExercises} exercises for your {lessonTime} lesson.
            </p>
          )}
        </div>
    </div>
  );
}