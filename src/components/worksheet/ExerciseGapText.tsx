import React from "react";

interface ExerciseGapTextProps {
  sentences: any[];
  word_bank?: string[];
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onSentenceChange: (sIndex: number, field: string, value: string) => void;
  onWordBankChange?: (wIndex: number, value: string) => void;
}

const ExerciseGapText: React.FC<ExerciseGapTextProps> = ({
  sentences, word_bank, isEditing, viewMode, onSentenceChange, onWordBankChange
}) => {
  // Shuffle word bank for student view
  const displayWordBank = React.useMemo(() => {
    if (!word_bank) return [];
    if (viewMode === 'teacher' || isEditing) return word_bank;
    return [...word_bank].sort(() => Math.random() - 0.5);
  }, [word_bank, viewMode, isEditing]);

  return (
    <div>
      {displayWordBank && displayWordBank.length > 0 && (
        <div className="mb-4 p-3 bg-worksheet-purpleLight rounded-md">
          <p className="font-medium mb-2">Word Bank:</p>
          <div className="flex flex-wrap gap-2">
            {displayWordBank.map((word, wIndex) => (
              <span key={wIndex} className="bg-white px-2 py-1 rounded-md text-sm">
                {isEditing ? (
                  <input
                    type="text"
                    value={word}
                    onChange={e => onWordBankChange && onWordBankChange(wIndex, e.target.value)}
                    className="border-0 bg-transparent p-0 w-full focus:outline-none focus:ring-0"
                  />
                ) : word}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-0.5">
        {sentences.map((sentence, sIndex) => (
          <div key={sIndex} className="border-b pb-1">
            <div className="flex flex-row items-start">
              <div className="flex-grow">
                <p className="leading-snug">
                  {isEditing ? (
                    <input
                      type="text"
                      value={sentence.text}
                      onChange={e => onSentenceChange && onSentenceChange(sIndex, 'text', e.target.value)}
                      className="w-full border p-1 editable-content"
                    />
                  ) : (
                    <>{sIndex + 1}. {sentence.text.replace(/_+/g, "_______________")}</>
                  )}
                </p>
              </div>
              {viewMode === 'teacher' && (
                <div className="text-green-600 italic ml-3 text-sm">
                  {isEditing ? (
                    <input
                      type="text"
                      value={sentence.answer || ''}
                      onChange={e => onSentenceChange && onSentenceChange(sIndex, 'answer', e.target.value)}
                      className="border p-1 editable-content w-full"
                    />
                  ) : (
                    <span>({sentence.answer})</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExerciseGapText;