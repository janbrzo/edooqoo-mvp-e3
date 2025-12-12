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
  // PROBLEM 1: Live Session answer prop for displaying student answers in blue
  liveSessionAnswer?: Record<number, any>;
}

// PROBLEM 9 FIX: Seeded random function for deterministic shuffle
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Generate a hash from string for seed
const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

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
  showCorrectAnswers = false,
  // PROBLEM 1: Live Session
  liveSessionAnswer
}) => {
  // PROBLEM 9 FIX: Shuffle word bank with deterministic seed based on content
  const shuffledWordBank = useMemo(() => {
    if (!word_bank || isEditing) return word_bank;
    
    // Create seed from word_bank content - same content = same shuffle
    const seed = hashString(word_bank.join('|'));
    
    const shuffled = [...word_bank];
    for (let i = shuffled.length - 1; i > 0; i--) {
      // Use seeded random instead of Math.random()
      const j = Math.floor(seededRandom(seed + i) * (i + 1));
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
          const liveAnswer = liveSessionAnswer?.[sIndex];

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
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 italic text-sm min-w-[120px]">
                      {isEditing ? (
                        <input
                          type="text"
                          value={sentence.answer}
                          onChange={e => onSentenceChange(sIndex, 'answer', e.target.value)}
                          className="border p-1 editable-content w-full"
                        />
                      ) : (
                        <>({correctAnswer})</>
                      )}
                    </span>
                    {/* PROBLEM 1: Display live session answer in blue */}
                    {liveAnswer && (
                      <span className="text-blue-600 font-medium text-sm">
                        [{liveAnswer}]
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

export default ExerciseFillInBlanks;
