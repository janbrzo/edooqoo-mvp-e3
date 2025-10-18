import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { LessonTime, ExerciseSelectionMode, MediaType } from './types';
const AVAILABLE_EXERCISES = [{
  id: 'reading',
  label: 'Reading Comprehension',
  icon: '📖',
  description: 'Students read a text passage and demonstrate understanding through comprehension questions, analyzing main ideas, details, and vocabulary in context.'
}, {
  id: 'true-false',
  label: 'True/False Questions',
  icon: '✓✗',
  description: 'Students determine whether statements about the lesson content are true or false, helping develop critical thinking and reading comprehension skills.'
}, {
  id: 'true-false-picture',
  label: 'True/False',
  icon: '✓✗',
  description: 'Students determine whether statements about the picture are true or false, developing critical thinking and visual comprehension skills.',
  pictureRequired: true,
  baseExercise: 'true-false'
}, {
  id: 'matching',
  label: 'Matching Exercise',
  icon: '🔗',
  description: 'Students connect related items from two columns, such as words with definitions, questions with answers, or concepts with examples.'
}, {
  id: 'fill-in-blanks',
  label: 'Fill in the Blanks',
  icon: '✏️',
  description: 'Students complete sentences or paragraphs by filling in missing words, focusing on vocabulary, grammar structures, and contextual understanding.'
}, {
  id: 'multiple-choice',
  label: 'Multiple Choice',
  icon: '📝',
  description: 'Students select the correct answer from several options, testing comprehension, vocabulary knowledge, and grammatical understanding.'
}, {
  id: 'multiple-choice-picture',
  label: 'Multiple Choice',
  icon: '📝',
  description: 'Students answer questions about the picture by selecting the correct answer from several options, testing visual comprehension.',
  pictureRequired: true,
  baseExercise: 'multiple-choice'
}, {
  id: 'dialogue',
  label: 'Dialogue Practice',
  icon: '💬',
  description: 'Students practice conversational English through structured dialogues, improving speaking skills, natural expressions, and real-life communication patterns.'
}, {
  id: 'discussion',
  label: 'Discussion Questions',
  icon: '👥',
  description: 'Open-ended questions that encourage students to express opinions, share experiences, and engage in meaningful conversations about the lesson topic.'
}, {
  id: 'error-correction',
  label: 'Error Correction',
  icon: '⚠️',
  description: 'Students identify and correct grammatical, vocabulary, or structural mistakes in sentences, developing proofreading and language accuracy skills.'
}, {
  id: 'odd-one-out',
  label: 'Odd One Out',
  icon: '🔍',
  description: 'Students identify which item in a group doesn\'t belong, focusing on categorization, vocabulary relationships, and logical thinking.'
}, {
  id: 'matching-halves',
  label: 'Matching Halves',
  icon: '🧩',
  description: 'Students connect sentence beginnings with appropriate endings, practicing sentence structure, logical connections, and natural English flow.'
}, {
  id: 'word-order',
  label: 'Word Order',
  icon: '📋',
  description: 'Students arrange scrambled words to form correct sentences, reinforcing grammar rules, sentence structure, and natural English word order.'
}, {
  id: 'gap-text',
  label: 'Gap Text (Cloze)',
  icon: '📄',
  description: 'Students fill in missing words or phrases in a continuous text, developing contextual understanding and cohesive writing skills.'
}, {
  id: 'negative-prefixes',
  label: 'Negative Prefixes',
  icon: '➖',
  description: 'Students practice using prefixes like un-, dis-, in- to form negative words, expanding vocabulary and understanding word formation patterns.'
}, {
  id: 'categorize',
  label: 'Categorization',
  icon: '📊',
  description: 'Students sort words, phrases, or concepts into appropriate categories, developing organizational thinking and vocabulary classification skills.'
}, {
  id: 'paraphrasing',
  label: 'Paraphrasing',
  icon: '🔄',
  description: 'Students rewrite sentences or passages using different words while maintaining the original meaning, improving writing flexibility and vocabulary.'
}, {
  id: 'complete-word',
  label: 'Complete the Word',
  icon: '🅰️',
  description: 'Students complete partially written words using context clues, strengthening spelling, vocabulary recognition, and contextual understanding.'
}, {
  id: 'synonyms-antonyms',
  label: 'Synonyms & Antonyms Matching',
  icon: '↔️',
  description: 'Students match words with their synonyms or antonyms, expanding vocabulary knowledge and understanding word relationships and nuances.'
}, {
  id: 'sentence-transformation',
  label: 'Sentence Transformation',
  icon: '🔄',
  comingSoon: true,
  description: 'Students rewrite sentences using different grammatical structures while maintaining the same meaning, practicing advanced grammar and syntax.'
}, {
  id: 'describe-picture',
  label: 'Describe Picture',
  icon: '🖼️',
  description: 'Students describe images using target vocabulary and structures, developing speaking and observational skills through visual prompts.',
  pictureRequired: true
}, {
  id: 'answer-questions',
  label: 'Answer Questions',
  icon: '❓',
  description: 'Students provide written or spoken answers to comprehension questions, demonstrating understanding and practicing response formation.'
}, {
  id: 'answer-questions-picture',
  label: 'Answer Questions',
  icon: '❓',
  description: 'Students provide answers to questions about the picture, demonstrating visual comprehension and observation skills.',
  pictureRequired: true,
  baseExercise: 'answer-questions'
}];

// Picture-compatible exercises for automatic selection (with -picture suffix)
const PICTURE_COMPATIBLE_EXERCISES = ['multiple-choice-picture', 'true-false-picture', 'answer-questions-picture', 'describe-picture'];

// Predefined exercise sets for Manual mode
const MANUAL_EXERCISES_60MIN = ['reading', 'true-false', 'matching', 'fill-in-blanks', 'categorize', 'odd-one-out', 'multiple-choice', 'discussion'];
const MANUAL_EXERCISES_45MIN = ['reading', 'true-false', 'matching', 'fill-in-blanks', 'categorize', 'odd-one-out'];

// Picture mode defaults (with picture-compatible exercises using -picture suffix)
const MANUAL_EXERCISES_60MIN_PICTURE = [
  'describe-picture',
  'answer-questions-picture',
  'true-false',
  'fill-in-blanks',
  'multiple-choice',
  'odd-one-out',
  'categorize',
  'word-order'
];
const MANUAL_EXERCISES_45MIN_PICTURE = [
  'describe-picture',
  'answer-questions-picture',
  'true-false',
  'fill-in-blanks',
  'multiple-choice',
  'categorize'
];

const MEDIA_ENHANCED_OPTIONS = [{
  id: 'video',
  label: 'Video',
  icon: '🎥'
}, {
  id: 'audio',
  label: 'Audio',
  icon: '🎵'
}, {
  id: 'picture',
  label: 'Picture',
  icon: '🖼️'
}];
interface ExerciseSelectorProps {
  lessonTime: LessonTime;
  selectedExercises: string[];
  onChange: (exercises: string[]) => void;
  selectionMode: ExerciseSelectionMode;
  selectedMediaTypes: MediaType[];
  onMediaTypesChange: (mediaTypes: MediaType[]) => void;
}
export default function ExerciseSelector({
  lessonTime,
  selectedExercises,
  onChange,
  selectionMode,
  selectedMediaTypes,
  onMediaTypesChange
}: ExerciseSelectorProps) {
  const maxExercises = lessonTime === '45min' ? 6 : 8;
  const [showAllExercises, setShowAllExercises] = useState(false);

  // Get default exercises for manual mode
  const manualDefaults = useMemo(() => {
    const isPictureMode = selectedMediaTypes.includes('picture');
    if (isPictureMode) {
      return lessonTime === '45min' ? MANUAL_EXERCISES_45MIN_PICTURE : MANUAL_EXERCISES_60MIN_PICTURE;
    }
    return lessonTime === '45min' ? MANUAL_EXERCISES_45MIN : MANUAL_EXERCISES_60MIN;
  }, [lessonTime, selectedMediaTypes]);

  // Generate random exercises for random mode
  const generateRandomExercises = useCallback(() => {
    const isPictureMode = selectedMediaTypes.includes('picture');
    
    if (isPictureMode) {
      // Picture mode: Always select 2 picture-compatible exercises, never Reading
      const availablePictureExercises = AVAILABLE_EXERCISES
        .filter(ex => !ex.comingSoon && PICTURE_COMPATIBLE_EXERCISES.includes(ex.id))
        .map(ex => ex.id);
      
      const availableOtherExercises = AVAILABLE_EXERCISES
        .filter(ex => !ex.comingSoon && !PICTURE_COMPATIBLE_EXERCISES.includes(ex.id) && ex.id !== 'reading' && ex.id !== 'discussion')
        .map(ex => ex.id);
      
      // Select 2 random picture exercises
      const shuffledPicture = [...availablePictureExercises].sort(() => Math.random() - 0.5);
      const selectedPicture = shuffledPicture.slice(0, 2);
      
      // Select remaining exercises from other types (excluding Reading and Discussion)
      const shuffledOther = [...availableOtherExercises].sort(() => Math.random() - 0.5);
      const selectedOther = shuffledOther.slice(0, maxExercises - 2);
      
      return [...selectedPicture, ...selectedOther];
    } else {
      // Normal mode: random selection from all available
      const availableExercises = AVAILABLE_EXERCISES.filter(ex => !ex.comingSoon).map(ex => ex.id);
      const shuffled = [...availableExercises].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, maxExercises);
    }
  }, [maxExercises, selectedMediaTypes]);

  // Initialize exercises based on mode
  useEffect(() => {
    if (selectedExercises.length === 0) {
      let initialExercises: string[];
      if (selectionMode === 'manual') {
        initialExercises = manualDefaults;
      } else if (selectionMode === 'random') {
        initialExercises = generateRandomExercises();
      } else {
        // Smart mode - use manual defaults for now
        initialExercises = manualDefaults;
      }
      onChange(initialExercises);
    }
  }, [lessonTime, selectionMode, selectedExercises.length, onChange, manualDefaults, generateRandomExercises]);

  // Handle lesson time changes - adjust exercise count
  useEffect(() => {
    if (selectedExercises.length > 0) {
      if (selectionMode === 'manual') {
        // For manual mode, adjust to the new count using manual defaults
        const newExercises = lessonTime === '45min' ? MANUAL_EXERCISES_45MIN : MANUAL_EXERCISES_60MIN;
        onChange(newExercises);
      } else if (selectionMode === 'random') {
        // For random mode, generate new random selection
        const newExercises = generateRandomExercises();
        onChange(newExercises);
      }
    }
  }, [lessonTime, selectionMode, generateRandomExercises, onChange]);
  const handleExerciseToggle = useCallback((exerciseId: string, checked: boolean) => {
    if (selectionMode !== 'manual') return; // Only allow manual changes in manual mode

    let newSelection = [...selectedExercises];
    if (checked && !newSelection.includes(exerciseId) && newSelection.length < maxExercises) {
      newSelection.push(exerciseId);
    } else if (!checked && newSelection.includes(exerciseId)) {
      newSelection = newSelection.filter(id => id !== exerciseId);
    }
    onChange(newSelection);
  }, [selectedExercises, maxExercises, onChange, selectionMode]);
  const handleMediaToggle = (mediaType: MediaType) => {
    const newMediaTypes = selectedMediaTypes.includes(mediaType) ? selectedMediaTypes.filter(type => type !== mediaType) : [...selectedMediaTypes, mediaType];
    onMediaTypesChange(newMediaTypes);
    
    // Update exercises based on media selection
    if (mediaType === 'picture') {
      const isPictureActive = !selectedMediaTypes.includes('picture');
      let newExercises: string[];
      
      if (isPictureActive) {
        // Picture activated
        if (selectionMode === 'manual') {
          newExercises = lessonTime === '45min' ? MANUAL_EXERCISES_45MIN_PICTURE : MANUAL_EXERCISES_60MIN_PICTURE;
        } else {
          newExercises = generateRandomExercises();
        }
      } else {
        // Picture deactivated
        if (selectionMode === 'manual') {
          newExercises = lessonTime === '45min' ? MANUAL_EXERCISES_45MIN : MANUAL_EXERCISES_60MIN;
        } else {
          newExercises = generateRandomExercises();
        }
      }
      
      onChange(newExercises);
    }
  };
  return <div className="space-y-4">
      {/* Media Enhanced Options */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Media Enhanced</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          {MEDIA_ENHANCED_OPTIONS.map(media => {
            const isSelected = selectedMediaTypes.includes(media.id as MediaType);
            const isPicture = media.id === 'picture';
            const isDisabled = !isPicture;
            
            return (
              <button 
                key={media.id} 
                type="button" 
                disabled={isDisabled}
                onClick={() => !isDisabled && handleMediaToggle(media.id as MediaType)}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  isDisabled
                    ? 'border-gray-200 bg-gray-100 opacity-60 cursor-not-allowed'
                    : isSelected
                    ? 'border-worksheet-purple bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-worksheet-purple hover:shadow-sm cursor-pointer'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-lg">{media.icon}</span>
                  <span className={`font-medium text-sm ${isSelected ? 'text-worksheet-purple' : isDisabled ? 'text-gray-500' : 'text-gray-700'}`}>
                    {media.label}
                  </span>
                  {isDisabled && (
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded ml-auto">Coming Soon</span>
                  )}
                  {isSelected && !isDisabled && (
                    <span className="text-xs bg-worksheet-purple text-white px-2 py-1 rounded ml-auto">Active</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* All Exercise Types - Always Visible */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Exercise Types</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {selectedExercises.length}/{maxExercises}
            </span>
            {selectedExercises.length < maxExercises && <span className="text-xs text-worksheet-purple font-medium">
                Select {maxExercises - selectedExercises.length} more exercises
              </span>}
          </div>
        </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {AVAILABLE_EXERCISES
                  .filter(exercise => {
                    // Hide picture-only exercises when picture mode is OFF
                    const isPictureMode = selectedMediaTypes.includes('picture');
                    if (!isPictureMode && exercise.pictureRequired) {
                      return false;
                    }
                    return true;
                  })
                  .map(exercise => {
          const isSelected = selectedExercises.includes(exercise.id);
          const isPictureMode = selectedMediaTypes.includes('picture');
          const isPictureExercise = exercise.pictureRequired || false;
          const canSelect = selectionMode === 'manual' && (isSelected || selectedExercises.length < maxExercises) && !exercise.comingSoon;
          const isDisabled = selectionMode !== 'manual' || exercise.comingSoon;
          
          return <div key={exercise.id} className={`relative group flex items-center space-x-2 p-2 rounded-lg border transition-colors ${
            exercise.comingSoon 
              ? 'bg-gray-100 border-gray-200 opacity-60' 
              : isSelected
              ? isPictureMode && isPictureExercise
                ? 'bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50 border-worksheet-purple shadow-sm'
                : 'bg-worksheet-purpleLight border-worksheet-purple'
              : canSelect 
              ? 'bg-gray-50 border-gray-200 hover:bg-gray-100' 
              : 'bg-gray-100 border-gray-200 opacity-50'
          }`}>
                      <Checkbox id={exercise.id} checked={isSelected} onCheckedChange={checked => handleExerciseToggle(exercise.id, !!checked)} disabled={isDisabled} className="data-[state=checked]:bg-worksheet-purple data-[state=checked]:border-worksheet-purple" />
                       <label htmlFor={exercise.id} className={`flex items-center space-x-2 text-xs font-medium cursor-pointer ${exercise.comingSoon ? 'text-gray-400' : canSelect ? 'text-gray-700' : 'text-gray-400'}`}>
                         <span className="text-lg">{exercise.icon}</span>
                         <span>{exercise.label}</span>
                         {isPictureExercise && (
                           <span className="text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2 py-0.5 rounded font-semibold">
                             Picture
                           </span>
                         )}
                         {exercise.comingSoon && <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded ml-auto">Soon</span>}
                       </label>
                      
                        {/* Tooltip with 1 second delay */}
                        <div className="absolute left-1/2 bottom-full transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-10 pointer-events-none max-w-xs text-center" style={{
              transitionDelay: '1s'
            }}>
                        {exercise.description}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </div>;
        })}
        </div>
      </div>

        {/* Selection Info */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Current mode:</span> {selectionMode.charAt(0).toUpperCase() + selectionMode.slice(1)}
            {selectionMode === 'manual' && " - Select and deselect exercises by clicking the checkboxes above"}
            {selectionMode === 'random' && " - A new random selection will be generated each time you switch to this mode"}
          </p>
          
          {selectedMediaTypes.includes('picture') && selectionMode === 'manual' && (
            <p className="mt-2 text-sm text-blue-700 font-medium bg-blue-50 p-2 rounded">
              📸 Picture Mode Active: Please select at least one picture-based exercise (marked with "Picture" badge)
            </p>
          )}
          
          {selectedExercises.length === maxExercises && <p className="mt-2 text-sm text-worksheet-purple font-medium">
              Perfect! You have selected all {maxExercises} exercises for your {lessonTime} lesson.
            </p>}
        </div>
    </div>;
}