import React, { useMemo } from "react";
import { InteractiveExerciseProps } from "@/types/interactiveHomework";
import { Input } from "@/components/ui/input";

interface ExerciseFillInBlanksProps extends Partial<InteractiveExerciseProps> {
  word_bank?: string[];
  sentences: any[];
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onWordBankChange: (wIndex: number, value: string) => void;
  onSentenceChange: (sIndex: number, field: string, value: string) => void;
}

const ExerciseFillInBlanks: React.FC<ExerciseFillInBlanksProps> = ({
  word_bank, 
  sentences, 
  isEditing, 
  viewMode, 
  onWordBankChange, 
  onSentenceChange,
  // Interactive props
  isInteractive = false,
  studentAnswers = {},
  onAnswerChange,
  showCorrectAnswers = false
}) => {
  // Shuffle word bank randomly for student view, but keep original order for editing
  const shuffledWordBank = useMemo(() => {
    if (!word_bank || isEditing) return word_bank;
    
    const shuffled = [...word_bank];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [word_bank, isEditing]);

  const displayWordBank = isEditing ? word_bank : shuffledWordBank;

  return (
    <div>
      {displayWordBank && (
        <div className="mb-4 p-3 bg-worksheet-purpleLight rounded-md word-bank-container">
          <p className="font-medium mb-2">Word Bank:</p>
          <div className="flex flex-wrap gap-2">
            {displayWordBank.map((word, wIndex) => (
              <span key={wIndex} className="bg-white px-2 py-1 rounded-md text-sm">
                {isEditing ? (
                  <input
                    type="text"
                    value={word}
                    onChange={e => onWordBankChange(wIndex, e.target.value)}
                    className="border-0 bg-transparent p-0 w-full focus:outline-none focus:ring-0"
                  />
                ) : word}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="space-y-2">
        {sentences.map((sentence, sIndex) => {
          const studentAnswer = studentAnswers[sIndex] || '';
          const correctAnswer = sentence.answer;
          const isCorrect = showCorrectAnswers && studentAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
          const isIncorrect = showCorrectAnswers && studentAnswer && !isCorrect;
          const isEmpty = showCorrectAnswers && !studentAnswer;

          return (
            <div key={sIndex} className="border rounded-lg p-3 bg-white">
              <div className="flex flex-row items-start gap-2">
                <div className="flex-grow">
                  <p className="leading-snug mb-2">
                    {isEditing ? (
                      <input
                        type="text"
                        value={sentence.text}
                        onChange={e => onSentenceChange(sIndex, 'text', e.target.value)}
                        className="w-full border p-1 editable-content"
                      />
                    ) : (
                      <>{sIndex + 1}. {sentence.text.replace(/_+/g, "_______________")}</>
                    )}
                  </p>
                  {isInteractive && (
                    <Input
                      type="text"
                      value={studentAnswer}
                      onChange={(e) => onAnswerChange?.(sIndex, e.target.value)}
                      placeholder="Type your answer..."
                      className={`h-10
                        ${isCorrect ? 'bg-green-200 border-2 border-green-600' : ''}
                        ${isIncorrect ? 'bg-red-200 border-2 border-red-600' : ''}
                        ${isEmpty ? 'bg-red-100 border-2 border-red-400' : ''}
                      `}
                    />
                  )}
                </div>
                {(viewMode === 'teacher' || showCorrectAnswers) && (
                  <div className="text-green-600 italic text-sm min-w-[120px]">
                    {isEditing ? (
                      <input
                        type="text"
                        value={sentence.answer}
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
    </div>
  );
};

export default ExerciseFillInBlanks;
