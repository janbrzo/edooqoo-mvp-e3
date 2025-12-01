import React from "react";
import { InteractiveExerciseProps } from "@/types/interactiveHomework";

interface ExerciseWordOrderProps extends Partial<InteractiveExerciseProps> {
  sentences: any[];
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onSentenceChange: (sIndex: number, field: string, value: string) => void;
}

const ExerciseWordOrder: React.FC<ExerciseWordOrderProps> = ({
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
  const handleScrambledWordsChange = (sIndex: number, value: string) => {
    onSentenceChange(sIndex, 'scrambled_words', value);
  };

  return (
    <div>
      <div className="space-y-3">
        {sentences.map((sentence, sIndex) => {
          const studentAnswer = studentAnswers[sIndex] || '';

          return (
            <div key={sIndex} className="border-b pb-2">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{sIndex + 1}.</span>
                  
                  {isEditing ? (
                    <input
                      type="text"
                      value={sentence?.scrambled_words || ''}
                      onChange={e => handleScrambledWordsChange(sIndex, e.target.value)}
                      className="border p-1 editable-content flex-grow"
                      placeholder="word1 / word2 / word3"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2 flex-grow">
                      {(sentence?.scrambled_words || '').split(' / ').map((word: string, wIndex: number) => (
                        word.trim() && (
                          <span key={wIndex} className="bg-blue-100 px-2 py-1 rounded-md text-sm border">
                            {word.trim()}
                          </span>
                        )
                      ))}
                    </div>
                  )}
                </div>

                {isInteractive && (
                  <input
                    type="text"
                    value={studentAnswer}
                    onChange={(e) => onAnswerChange?.(sIndex, e.target.value)}
                    onBlur={(e) => onAnswerChange?.(sIndex, e.target.value)}
                    placeholder="Write the sentence in correct order..."
                    className="w-full border p-2 rounded"
                  />
                )}
                
                {(viewMode === 'teacher' || showCorrectAnswers) && (
                  <div className="text-green-600 italic text-sm">
                    {isEditing ? (
                      <input
                        type="text"
                        value={sentence?.correct_order || ''}
                        onChange={e => onSentenceChange(sIndex, 'correct_order', e.target.value)}
                        className="border p-1 editable-content w-full"
                      />
                    ) : (
                      <span>({sentence?.correct_order || 'Missing answer'})</span>
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

export default ExerciseWordOrder;