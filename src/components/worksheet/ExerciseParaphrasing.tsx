import React from "react";
import { InteractiveExerciseProps } from "@/types/interactiveHomework";
import { Input } from "@/components/ui/input";

interface ExerciseParaphrasingProps extends Partial<InteractiveExerciseProps> {
  sentences: any[];
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onSentenceChange: (sIndex: number, field: string, value: string) => void;
}

const ExerciseParaphrasing: React.FC<ExerciseParaphrasingProps> = ({
  sentences, 
  isEditing, 
  viewMode, 
  onSentenceChange,
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
          const hasNoAnswer = showCorrectAnswers && !studentAnswer;

          return (
            <div key={sIndex} className="border-b pb-2">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{sIndex + 1}.</span>
                  
                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        value={sentence.original}
                        onChange={e => onSentenceChange(sIndex, 'original', e.target.value)}
                        className="flex-grow border p-1 editable-content"
                      />
                      <input
                        type="text"
                        value={sentence.word_to_use}
                        onChange={e => onSentenceChange(sIndex, 'word_to_use', e.target.value)}
                        className="w-32 border p-1 editable-content text-sm"
                      />
                    </>
                  ) : (
                    <>
                      <span className="flex-grow">{sentence.original}</span>
                      <span className="text-sm text-gray-600">Use: <strong>{sentence.word_to_use}</strong></span>
                    </>
                  )}
                </div>

                {isInteractive && (
                  <Input
                    value={studentAnswer}
                    onChange={(e) => onAnswerChange?.(sIndex, e.target.value)}
                    onBlur={(e) => onAnswerChange?.(sIndex, e.target.value)}
                    placeholder="Write your paraphrased sentence..."
                    className={`h-10 ${hasNoAnswer ? 'border-2 border-red-400 bg-red-100' : ''}`}
                  />
                )}
                
                {(viewMode === 'teacher' || showCorrectAnswers) && (
                  <div className="text-green-600 italic text-sm">
                    {isEditing ? (
                      <input
                        type="text"
                        value={sentence.answer}
                        onChange={e => onSentenceChange(sIndex, 'answer', e.target.value)}
                        className="border p-1 editable-content w-full"
                      />
                    ) : (
                      <span>Suggested answer: {sentence.answer}</span>
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

export default ExerciseParaphrasing;
