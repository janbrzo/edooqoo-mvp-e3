import React from "react";
import { InteractiveExerciseProps } from "@/types/interactiveHomework";

interface ExerciseNegativePrefixesProps extends Partial<InteractiveExerciseProps> {
  words: any[];
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onWordChange: (wIndex: number, field: string, value: string) => void;
}

const ExerciseNegativePrefixes: React.FC<ExerciseNegativePrefixesProps> = ({
  words = [], 
  isEditing, 
  viewMode, 
  onWordChange,
  // Interactive props
  isInteractive = false,
  studentAnswers = {},
  onAnswerChange,
  showCorrectAnswers = false
}) => {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {words.map((wordItem, wIndex) => {
          const studentAnswer = studentAnswers[wIndex] || '';
          const correctAnswer = wordItem?.answer || '';
          const isCorrect = showCorrectAnswers && studentAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
          const isIncorrect = showCorrectAnswers && studentAnswer && !isCorrect;

          return (
            <div key={wIndex} className="border-b pb-1">
              <div className="flex flex-col gap-2">
                <div className="flex-grow">
                  <p className="leading-snug">
                    {wIndex + 1}. {isEditing ? (
                      <input
                        type="text"
                        value={wordItem?.word || ''}
                        onChange={e => onWordChange(wIndex, 'word', e.target.value)}
                        className="border p-1 editable-content"
                      />
                    ) : (
                      wordItem?.word || 'Missing word'
                    )} → ______
                  </p>
                </div>
                {isInteractive && (
                  <input
                    type="text"
                    value={studentAnswer}
                    onChange={(e) => onAnswerChange?.(wIndex, e.target.value)}
                    onBlur={(e) => onAnswerChange?.(wIndex, e.target.value)}
                    placeholder="Type the negative form..."
                    className={`
                      w-full border p-2 rounded
                      ${isCorrect ? 'border-green-500 bg-green-50' : ''}
                      ${isIncorrect ? 'border-red-500 bg-red-50' : ''}
                    `}
                  />
                )}
                {(viewMode === 'teacher' || showCorrectAnswers) && (
                  <div className="text-green-600 italic text-sm">
                    {isEditing ? (
                      <input
                        type="text"
                        value={wordItem?.answer || ''}
                        onChange={e => onWordChange(wIndex, 'answer', e.target.value)}
                        className="border p-1 editable-content w-full"
                      />
                    ) : (
                      <span>({correctAnswer})</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ExerciseNegativePrefixes;