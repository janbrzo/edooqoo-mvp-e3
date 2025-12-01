import React from "react";
import { InteractiveExerciseProps } from "@/types/interactiveHomework";
import { Input } from "@/components/ui/input";

interface ExerciseSentenceTransformationProps extends Partial<InteractiveExerciseProps> {
  sentences: any[];
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onSentenceChange: (sIndex: number, field: string, value: string) => void;
}

const ExerciseSentenceTransformation: React.FC<ExerciseSentenceTransformationProps> = ({
  sentences = [], isEditing, viewMode, onSentenceChange,
  // Interactive props
  isInteractive = false,
  studentAnswers = {},
  onAnswerChange,
  showCorrectAnswers = false
}) => {
  return (
    <div>
      <div className="space-y-3">
        {sentences.map((sentence, sIndex) => {
          const studentAnswer = studentAnswers[sIndex] || '';
          const correctAnswer = sentence?.transformed || '';
          const isCorrect = showCorrectAnswers && studentAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
          const isIncorrect = showCorrectAnswers && studentAnswer && !isCorrect;

          return (
            <div key={sIndex} className="border-b pb-2">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{sIndex + 1}.</span>
                  
                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        value={sentence?.original || ''}
                        onChange={e => onSentenceChange(sIndex, 'original', e.target.value)}
                        className="flex-grow border p-1 editable-content"
                      />
                      <input
                        type="text"
                        value={sentence?.instruction || ''}
                        onChange={e => onSentenceChange(sIndex, 'instruction', e.target.value)}
                        className="w-48 border p-1 editable-content text-sm"
                      />
                    </>
                  ) : (
                    <>
                      <span className="flex-grow">{sentence?.original || 'Missing original sentence'}</span>
                      <span className="text-sm text-gray-600">({sentence?.instruction || 'Missing instruction'})</span>
                    </>
                  )}
                </div>

                {isInteractive ? (
                  <Input
                    type="text"
                    value={studentAnswer}
                    onChange={(e) => onAnswerChange?.(sIndex, e.target.value)}
                    placeholder="Transform the sentence..."
                    className={`
                      ${isCorrect ? 'border-green-500 bg-green-50' : ''}
                      ${isIncorrect ? 'border-red-500 bg-red-50' : ''}
                    `}
                  />
                ) : (
                  <span className="ml-6">→ ___________________________</span>
                )}
                
                {(viewMode === 'teacher' || showCorrectAnswers) && (
                  <div className="text-green-600 italic text-sm ml-6">
                    {isEditing ? (
                      <input
                        type="text"
                        value={correctAnswer}
                        onChange={e => onSentenceChange(sIndex, 'transformed', e.target.value)}
                        className="border p-1 editable-content w-full"
                      />
                    ) : (
                      <span>({correctAnswer || 'Missing answer'})</span>
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

export default ExerciseSentenceTransformation;