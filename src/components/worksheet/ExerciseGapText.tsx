import React from "react";
import { InteractiveExerciseProps } from "@/types/interactiveHomework";

interface ExerciseGapTextProps extends Partial<InteractiveExerciseProps> {
  sentences: any[];
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onSentenceChange: (sIndex: number, field: string, value: string) => void;
}

const ExerciseGapText: React.FC<ExerciseGapTextProps> = ({
  sentences = [],
  isEditing,
  viewMode,
  onSentenceChange,
  // Interactive props
  isInteractive = false,
  studentAnswers = {},
  onAnswerChange,
  showCorrectAnswers = false
}) => {
  if (!sentences || sentences.length === 0) {
    return <div className="text-gray-500 italic">No sentences available for this exercise.</div>;
  }

  return (
    <div className="space-y-0.5">
      {sentences.map((sentence, sIndex) => {
        const studentAnswer = studentAnswers[sIndex] || '';
        const correctAnswer = sentence?.answer || '';
        const isCorrect = showCorrectAnswers && studentAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
        const isIncorrect = showCorrectAnswers && studentAnswer && !isCorrect;

        return (
          <div key={sIndex} className="border-b pb-1">
            <div className="flex flex-col gap-2">
              <div className="flex-grow">
                <p className="leading-snug">
                  {isEditing ? (
                    <input
                      type="text"
                      value={sentence?.text || ''}
                      onChange={e => onSentenceChange(sIndex, 'text', e.target.value)}
                      className="w-full border p-1 editable-content"
                    />
                  ) : (
                    <>{sIndex + 1}. {(sentence?.text || 'Missing text').replace(/_+/g, "_______________")}</>
                  )}
                </p>
              </div>
              {isInteractive && (
                <input
                  type="text"
                  value={studentAnswer}
                  onChange={(e) => onAnswerChange?.(sIndex, e.target.value)}
                  onBlur={(e) => onAnswerChange?.(sIndex, e.target.value)}
                  placeholder="Type your answer..."
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
                      value={sentence?.answer || ''}
                      onChange={e => onSentenceChange(sIndex, 'answer', e.target.value)}
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
  );
};

export default ExerciseGapText;