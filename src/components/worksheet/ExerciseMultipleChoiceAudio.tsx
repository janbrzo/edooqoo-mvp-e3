import React from 'react';
import { InteractiveExerciseProps } from "@/types/interactiveHomework";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { safeGetText } from "@/utils/textObjectFixer";

interface Option {
  label: string;
  text: string;
  correct: boolean;
}

interface Question {
  text: string;
  options: Option[];
}

interface ExerciseMultipleChoiceAudioProps extends Partial<InteractiveExerciseProps> {
  questions?: Question[];
  audio_url?: string;
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onQuestionChange: (qIndex: number, field: string, value: any) => void;
  // PROBLEM 1: Live Session answer prop for displaying student answers in blue
  liveSessionAnswer?: Record<number, any>;
  disabled?: boolean;
}

const ExerciseMultipleChoiceAudio: React.FC<ExerciseMultipleChoiceAudioProps> = ({
  questions = [],
  audio_url,
  isEditing,
  viewMode,
  onQuestionChange,
  // Interactive props
  isInteractive = false,
  studentAnswers = {},
  onAnswerChange,
  showCorrectAnswers = false,
  // PROBLEM 1: Live Session
  liveSessionAnswer,
  disabled = false
}) => {
  return (
    <div>
      {!audio_url && (
        <div className="text-center text-sm text-muted-foreground py-2 bg-blue-50 border border-blue-200 rounded-lg mb-4">
          🎧 Listen to the audio in the Lesson Media section above before answering
        </div>
      )}
      
      <div className="space-y-2">
        {questions.map((question, qIndex) => {
          // CRITICAL FIX: Use safeGetText to prevent "Cannot read properties of undefined (reading 'replace')"
          const questionText = safeGetText(question?.text ?? question);
          
          return (
          <div key={qIndex} className="border-b pb-2 multiple-choice-question">
            <p className="font-medium mb-1 leading-snug">
              {isEditing ? (
                <input
                  type="text"
                  value={questionText}
                  onChange={e => onQuestionChange(qIndex, 'text', e.target.value)}
                  className="w-full border p-1 editable-content"
                />
              ) : (
                <>{qIndex + 1}. {questionText}</>
              )}
            </p>
            {isInteractive ? (
              <RadioGroup
                value={studentAnswers[qIndex]?.toString() || ''}
                onValueChange={(value) => onAnswerChange?.(qIndex, parseInt(value))}
                disabled={disabled}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {question.options?.map((option: any, oIndex: number) => {
                    const isSelected = studentAnswers[qIndex] === oIndex;
                    const isCorrect = showCorrectAnswers && isSelected && option.correct;
                    const isIncorrect = showCorrectAnswers && isSelected && !option.correct;
                    const shouldShowAsCorrect = showCorrectAnswers && option.correct;

                    return (
                      <div
                        key={oIndex}
                        className={`
                          p-2 border rounded-md flex items-center gap-2
                          ${isCorrect ? 'bg-green-50 border-green-500' : ''}
                          ${isIncorrect ? 'bg-red-50 border-red-500' : ''}
                          ${shouldShowAsCorrect && !isSelected ? 'bg-green-50/30 border-green-300' : ''}
                        `}
                      >
                        <RadioGroupItem value={oIndex.toString()} id={`q${qIndex}-o${oIndex}`} />
                        <Label htmlFor={`q${qIndex}-o${oIndex}`} className="flex-grow cursor-pointer">
                          {option.label}. {option.text}
                        </Label>
                        {shouldShowAsCorrect && <span className="text-green-600 text-sm">✓</span>}
                      </div>
                    );
                  })}
                </div>
              </RadioGroup>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                {question.options?.map((option: any, oIndex: number) => {
                  // PROBLEM 1: Check if this option is selected by student in Live Session
                  const isLiveSelected = liveSessionAnswer?.[qIndex] === oIndex;
                  
                  return (
                    <div
                      key={oIndex}
                      className={`
                        p-2 border rounded-md flex items-center gap-2 multiple-choice-option
                        ${viewMode === 'teacher' && option.correct ? 'bg-green-50 border-green-200' : 'bg-white'}
                        ${isLiveSelected ? 'ring-2 ring-blue-400 border-blue-400' : ''}
                      `}
                    >
                      <div
                        className={`
                          w-5 h-5 rounded-md border flex items-center justify-center option-icon
                          ${viewMode === 'teacher' && option.correct ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'}
                          ${isLiveSelected ? 'bg-blue-500 border-blue-500 text-white' : ''}
                        `}
                      >
                        {viewMode === 'teacher' && option.correct && <span>✓</span>}
                        {isLiveSelected && !option.correct && <span>●</span>}
                      </div>
                      <span>
                        {isEditing ? (
                          <input
                            type="text"
                            value={option.text}
                            onChange={e => {
                              const newOptions = [...question.options];
                              newOptions[oIndex] = { ...option, text: e.target.value };
                              onQuestionChange(qIndex, 'options', newOptions);
                            }}
                            className="border p-1 editable-content ml-1"
                          />
                        ) : (
                          <>{option.label}. {option.text}</>
                        )}
                        {/* PROBLEM 1: Show blue indicator for live session answer */}
                        {isLiveSelected && (
                          <span className="ml-2 text-blue-600 font-medium text-xs">(Student)</span>
                        )}
                      </span>
                      {isEditing && (
                        <input
                          type="checkbox"
                          checked={option.correct}
                          onChange={e => {
                            const newOptions = [...question.options];
                            newOptions[oIndex] = { ...option, correct: e.target.checked };
                            onQuestionChange(qIndex, 'options', newOptions);
                          }}
                          className="ml-auto"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          );
        })}
      </div>
    </div>
  );
};

export default ExerciseMultipleChoiceAudio;
