import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Info, Clock } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { getExerciseTimeByType } from "@/utils/timeCalculator";
import { LessonTime } from "./types";

// All available exercise types with their display names and descriptions
const AVAILABLE_EXERCISES = [
  // Original 8 exercises
  { type: 'reading', name: 'Reading Comprehension', description: 'Text with comprehension questions', icon: 'fa-book-open' },
  { type: 'true-false', name: 'True/False', description: 'Statements to evaluate as true or false', icon: 'fa-balance-scale' },
  { type: 'matching', name: 'Matching', description: 'Connect related items or concepts', icon: 'fa-link' },
  { type: 'fill-in-blanks', name: 'Fill in the Blanks', description: 'Complete sentences with missing words', icon: 'fa-pencil-alt' },
  { type: 'multiple-choice', name: 'Multiple Choice', description: 'Choose the correct answer from options', icon: 'fa-check-square' },
  { type: 'dialogue', name: 'Dialogue', description: 'Conversation practice exercises', icon: 'fa-comments' },
  { type: 'discussion', name: 'Discussion Questions', description: 'Open-ended questions for conversation', icon: 'fa-users' },
  { type: 'error-correction', name: 'Error Correction', description: 'Find and fix mistakes in sentences', icon: 'fa-exclamation-triangle' },
  
  // New Phase 1 exercises
  { type: 'odd-one-out', name: 'Odd One Out', description: 'Identify the word that doesn\'t belong', icon: 'fa-search' },
  { type: 'synonyms-antonyms', name: 'Synonyms & Antonyms', description: 'Match words with similar/opposite meanings', icon: 'fa-exchange-alt' },
  { type: 'sentence-transformation', name: 'Sentence Transformation', description: 'Rewrite sentences using given prompts', icon: 'fa-random' },
  { type: 'word-order', name: 'Word Order', description: 'Arrange words to form correct sentences', icon: 'fa-sort' },
  { type: 'gap-text', name: 'Gap Text', description: 'Complete text with appropriate word forms', icon: 'fa-text-width' },
  { type: 'negative-prefixes', name: 'Negative Prefixes', description: 'Add correct negative prefixes to words', icon: 'fa-minus-circle' }
];

interface ExerciseSelectorProps {
  autoSelectExercises: boolean;
  onAutoSelectChange: (value: boolean) => void;
  selectedExerciseTypes: string[];
  onSelectedExerciseTypesChange: (types: string[]) => void;
  lessonTime: LessonTime;
}

const ExerciseSelector: React.FC<ExerciseSelectorProps> = ({
  autoSelectExercises,
  onAutoSelectChange,
  selectedExerciseTypes,
  onSelectedExerciseTypesChange,
  lessonTime
}) => {
  const isMobile = useIsMobile();
  const [showValidationError, setShowValidationError] = useState(false);

  // Validation: 6-8 exercises required
  const maxExercises = lessonTime === "45min" ? 6 : 8;
  const minExercises = lessonTime === "45min" ? 4 : 6;
  const isValidSelection = selectedExerciseTypes.length >= minExercises && selectedExerciseTypes.length <= maxExercises;

  // Calculate total time for selected exercises
  const totalTime = selectedExerciseTypes.reduce((sum, type) => {
    return sum + getExerciseTimeByType(type, lessonTime, true);
  }, 0);

  useEffect(() => {
    if (!autoSelectExercises && selectedExerciseTypes.length > 0) {
      setShowValidationError(!isValidSelection);
    } else {
      setShowValidationError(false);
    }
  }, [selectedExerciseTypes.length, autoSelectExercises, isValidSelection]);

  // Default selection for when switching from auto to manual
  useEffect(() => {
    if (!autoSelectExercises && selectedExerciseTypes.length === 0) {
      // Set default selection based on lesson time
      const defaultTypes = lessonTime === "45min" 
        ? ['reading', 'true-false', 'matching', 'fill-in-blanks', 'multiple-choice', 'dialogue']
        : ['reading', 'true-false', 'matching', 'fill-in-blanks', 'multiple-choice', 'dialogue', 'discussion', 'error-correction'];
      onSelectedExerciseTypesChange(defaultTypes);
    }
  }, [autoSelectExercises, selectedExerciseTypes.length, lessonTime, onSelectedExerciseTypesChange]);

  const handleExerciseToggle = (exerciseType: string) => {
    const newSelection = selectedExerciseTypes.includes(exerciseType)
      ? selectedExerciseTypes.filter(type => type !== exerciseType)
      : [...selectedExerciseTypes, exerciseType];
    
    onSelectedExerciseTypesChange(newSelection);
  };

  return (
    <div className="space-y-4">
      {/* Auto Select Checkbox */}
      <div className="flex items-center space-x-3">
        <Checkbox 
          id="auto-select-exercises"
          checked={autoSelectExercises}
          onCheckedChange={onAutoSelectChange}
        />
        <label 
          htmlFor="auto-select-exercises" 
          className={`${isMobile ? 'text-sm' : 'text-base'} font-medium text-gray-700 cursor-pointer`}
        >
          AI selects exercises automatically
        </label>
        <div className="group relative">
          <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
          <div className="invisible group-hover:visible absolute left-0 top-6 z-10 w-64 p-2 bg-black text-white text-xs rounded shadow-lg">
            When enabled, AI will choose the best exercise types based on your lesson parameters. 
            When disabled, you can manually select which exercises to include.
          </div>
        </div>
      </div>

      {/* Manual Selection Interface */}
      {!autoSelectExercises && (
        <div className="space-y-4">
          {/* Instructions and validation */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-blue-800`}>
              <p className="font-medium mb-1">
                Select {minExercises}-{maxExercises} exercises for your {lessonTime} lesson:
              </p>
              <p>
                Choose exercises that best match your lesson goals and student needs.
              </p>
            </div>
          </div>

          {/* Validation Error */}
          {showValidationError && (
            <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
              <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-red-700`}>
                Please select between {minExercises} and {maxExercises} exercises.
              </span>
            </div>
          )}

          {/* Exercise Grid */}
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
            {AVAILABLE_EXERCISES.map((exercise) => {
              const isSelected = selectedExerciseTypes.includes(exercise.type);
              const exerciseTime = getExerciseTimeByType(exercise.type, lessonTime, true);
              
              return (
                <div
                  key={exercise.type}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-worksheet-purple bg-worksheet-purpleLight' 
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                  onClick={() => handleExerciseToggle(exercise.type)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Checkbox 
                        checked={isSelected}
                        onChange={() => {}} // Handled by parent div onClick
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <h4 className={`${isMobile ? 'text-sm' : 'text-base'} font-medium text-gray-900`}>
                          {exercise.name}
                        </h4>
                        <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 mt-1`}>
                          {exercise.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span className="text-xs">{exerciseTime}min</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selection Summary */}
          {selectedExerciseTypes.length > 0 && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className={`${isMobile ? 'text-sm' : 'text-base'} font-medium text-gray-700`}>
                  Selected Exercises ({selectedExerciseTypes.length})
                </span>
                <div className="flex items-center gap-1 text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span className={`${isMobile ? 'text-sm' : 'text-base'} font-medium`}>
                    {totalTime} minutes
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedExerciseTypes.map((type) => {
                  const exercise = AVAILABLE_EXERCISES.find(ex => ex.type === type);
                  return (
                    <Badge 
                      key={type} 
                      variant="secondary" 
                      className={`${isMobile ? 'text-xs' : 'text-sm'} bg-worksheet-purpleLight text-worksheet-purple`}
                    >
                      {exercise?.name || type}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExerciseSelector;