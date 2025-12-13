import React from "react";
import { InteractiveExerciseProps } from "@/types/interactiveHomework";
import { Input } from "@/components/ui/input";

interface ExerciseNegativePrefixesProps extends Partial<InteractiveExerciseProps> {
  words: any[];
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onWordChange: (wIndex: number, field: string, value: string) => void;
  liveSessionAnswer?: Record<number, any>;
}

const ExerciseNegativePrefixes: React.FC<ExerciseNegativePrefixesProps> = ({
  words = [], 
  isEditing, 
  viewMode, 
  onWordChange,
  liveSessionAnswer,
  // Interactive props
  isInteractive = false,
  studentAnswers = {},
  onAnswerChange,
  showCorrectAnswers = false
}) => {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {words.map((wordItem, wIndex) => {
          const studentAnswer = studentAnswers[wIndex] || '';
          const correctAnswer = wordItem?.answer || '';
          const isCorrect = showCorrectAnswers && studentAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
          const isIncorrect = showCorrectAnswers && studentAnswer && !isCorrect;
          const isEmpty = showCorrectAnswers && !studentAnswer;

          return (
            <div key={wIndex} className="border rounded-lg p-3 bg-white">
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
                  <Input
                    type="text"
                    value={studentAnswer}
                    onChange={(e) => onAnswerChange?.(wIndex, e.target.value)}
                    placeholder="Type the negative form..."
                    className={`h-10
                      ${isCorrect ? 'bg-green-200 border-2 border-green-600' : ''}
                      ${isIncorrect ? 'bg-red-200 border-2 border-red-600' : ''}
                      ${isEmpty ? 'bg-red-100 border-2 border-red-400' : ''}
                    `}
                  />
                )}
                {(viewMode === 'teacher' || showCorrectAnswers) && (
                  <div className="flex items-center gap-2 flex-wrap">
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
                    {/* Live Session: show student answer in blue */}
                    {liveSessionAnswer?.[wIndex] !== undefined && (
                      <span className="text-blue-600 font-medium text-sm">
                        [Student: {liveSessionAnswer[wIndex]}]
                      </span>
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
