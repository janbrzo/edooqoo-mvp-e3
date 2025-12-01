
import React from "react";
import { InteractiveExerciseProps } from "@/types/interactiveHomework";

interface ExerciseMultipleChoiceProps extends Partial<InteractiveExerciseProps> {
  questions: any[];
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onQuestionTextChange: (qIndex: number, value: string) => void;
  onOptionTextChange: (qIndex: number, oIndex: number, value: string) => void;
}

const ExerciseMultipleChoice: React.FC<ExerciseMultipleChoiceProps> = ({
  questions, 
  isEditing, 
  viewMode, 
  onQuestionTextChange, 
  onOptionTextChange,
  // Interactive props
  isInteractive = false,
  studentAnswers = {},
  onAnswerChange,
  showCorrectAnswers = false
}) => {
  const handleOptionSelect = (qIndex: number, optionText: string) => {
    if (isInteractive && onAnswerChange) {
      onAnswerChange(qIndex, optionText);
    }
  };

  return (
    <div className="space-y-2">
      {questions.map((question, qIndex) => {
        const selectedAnswer = studentAnswers[qIndex];
        
        return (
          <div key={qIndex} className="border-b pb-2 multiple-choice-question">
            <p className="font-medium mb-1 leading-snug">
              {isEditing ? (
                <input
                  type="text"
                  value={question.text}
                  onChange={e => onQuestionTextChange(qIndex, e.target.value)}
                  className="w-full border p-1 editable-content"
                />
              ) : (
                <>{qIndex + 1}. {question.text}</>
              )}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
              {question.options?.map((option: any, oIndex: number) => {
                const isSelected = isInteractive && selectedAnswer === option.text;
                const isCorrect = option.correct;
                const showAsCorrect = showCorrectAnswers && isCorrect;
                const showAsIncorrect = showCorrectAnswers && isSelected && !isCorrect;

                return (
                  <div
                    key={oIndex}
                    onClick={() => isInteractive && handleOptionSelect(qIndex, option.text)}
                    className={`
                      p-2 border rounded-md flex items-center gap-2 multiple-choice-option
                      ${isInteractive ? 'cursor-pointer hover:bg-gray-50' : ''}
                      ${isSelected ? 'bg-blue-50 border-blue-300' : 'bg-white'}
                      ${showAsCorrect ? 'bg-green-50 border-green-200' : ''}
                      ${showAsIncorrect ? 'bg-red-50 border-red-200' : ''}
                      ${viewMode === 'teacher' && !isInteractive && isCorrect ? 'bg-green-50 border-green-200' : ''}
                    `}
                  >
                    <div
                      className={`
                        w-5 h-5 rounded-full border flex items-center justify-center option-icon
                        ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}
                        ${showAsCorrect ? 'bg-green-500 border-green-500 text-white' : ''}
                        ${showAsIncorrect ? 'bg-red-500 border-red-500 text-white' : ''}
                        ${viewMode === 'teacher' && !isInteractive && isCorrect ? 'bg-green-500 border-green-500 text-white' : ''}
                      `}
                    >
                      {(isSelected || showAsCorrect || (viewMode === 'teacher' && !isInteractive && isCorrect)) && <span className="text-white text-xs">✓</span>}
                      {showAsIncorrect && <span className="text-white text-xs">✗</span>}
                    </div>
                    <span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={option.text}
                          onChange={e => onOptionTextChange(qIndex, oIndex, e.target.value)}
                          className="border p-1 editable-content ml-1"
                        />
                      ) : (
                        <>{option.label}. {option.text}</>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ExerciseMultipleChoice;
