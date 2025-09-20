import React, { useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LessonTime } from './types';

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
  { id: 'synonyms-antonyms', label: 'Synonyms & Antonyms', icon: '↔️' },
  { id: 'sentence-transformation', label: 'Sentence Transformation', icon: '🔄' },
  { id: 'word-order', label: 'Word Order', icon: '📋' },
  { id: 'gap-text', label: 'Gap Text (Cloze)', icon: '📄' },
  { id: 'negative-prefixes', label: 'Negative Prefixes', icon: '➖' },
  { id: 'categorize', label: 'Categorization', icon: '📊' },
  { id: 'paraphrasing', label: 'Paraphrasing', icon: '🔄' },
  { id: 'complete-word', label: 'Complete the Word', icon: '🅰️' },
  { id: 'matching-halves', label: 'Matching Halves', icon: '🧩' },
  { id: 'describe-picture', label: 'Describe Picture', icon: '🖼️' },
  { id: 'answer-questions', label: 'Answer Questions', icon: '❓' }
];

interface ExerciseSelectorProps {
  lessonTime: LessonTime;
  selectedExercises: string[];
  onChange: (exercises: string[]) => void;
}

export default function ExerciseSelector({ lessonTime, selectedExercises, onChange }: ExerciseSelectorProps) {
  const maxExercises = lessonTime === '45min' ? 6 : 8;
  
  // Default to first N exercises if none selected
  const defaultExercises = AVAILABLE_EXERCISES.slice(0, maxExercises).map(ex => ex.id);
  const currentSelection = selectedExercises.length > 0 ? selectedExercises : defaultExercises;

  // Initialize parent state with default exercises if none selected
  useEffect(() => {
    if (selectedExercises.length === 0) {
      console.log(`🔧 [EXERCISE-SELECTOR] Initializing default exercises for ${lessonTime}:`, defaultExercises);
      onChange(defaultExercises);
    }
  }, [lessonTime, selectedExercises.length, defaultExercises.join(','), onChange]);

  // Also handle lesson time changes - update to appropriate default count
  useEffect(() => {
    if (selectedExercises.length > 0 && selectedExercises.length !== maxExercises) {
      // If user had selected exercises but lesson time changed, adjust selection
      const adjustedSelection = selectedExercises.slice(0, maxExercises);
      if (adjustedSelection.length !== selectedExercises.length) {
        console.log(`🔧 [EXERCISE-SELECTOR] Adjusting selection for ${lessonTime} (${maxExercises} max):`, adjustedSelection);
        onChange(adjustedSelection);
      }
    }
  }, [maxExercises, selectedExercises, onChange, lessonTime]);

  const handleExerciseToggle = (exerciseId: string, checked: boolean) => {
    let newSelection = [...currentSelection];
    
    if (checked && !newSelection.includes(exerciseId) && newSelection.length < maxExercises) {
      newSelection.push(exerciseId);
    } else if (!checked && newSelection.includes(exerciseId)) {
      newSelection = newSelection.filter(id => id !== exerciseId);
    }
    
    onChange(newSelection);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800">
          Choose Exercises ({currentSelection.length}/{maxExercises})
        </CardTitle>
        <p className="text-sm text-gray-600">
          Select up to {maxExercises} exercises for your {lessonTime} lesson. Default selection includes the most popular exercises.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {AVAILABLE_EXERCISES.map((exercise) => {
            const isSelected = currentSelection.includes(exercise.id);
            const canSelect = isSelected || currentSelection.length < maxExercises;
            
            return (
              <div 
                key={exercise.id} 
                className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                  isSelected 
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
                  disabled={!canSelect}
                  className="data-[state=checked]:bg-worksheet-purple data-[state=checked]:border-worksheet-purple"
                />
                <label 
                  htmlFor={exercise.id} 
                  className={`flex items-center space-x-2 text-sm font-medium cursor-pointer ${
                    canSelect ? 'text-gray-700' : 'text-gray-400'
                  }`}
                >
                  <span className="text-lg">{exercise.icon}</span>
                  <span>{exercise.label}</span>
                </label>
              </div>
            );
          })}
        </div>
        
        {currentSelection.length === maxExercises && (
          <p className="mt-4 text-sm text-worksheet-purple font-medium">
            Maximum number of exercises selected. Uncheck an exercise to select a different one.
          </p>
        )}
      </CardContent>
    </Card>
  );
}