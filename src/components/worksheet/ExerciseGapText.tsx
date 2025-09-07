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
    <div className="space-y-4">
      <h3 className="font-medium text-gray-700 mb-3">Fill in the gaps with the correct form of the words:</h3>
      
      {/* Word Bank */}
      {word_bank && word_bank.length > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Word Bank:</h4>
          <div className="flex flex-wrap gap-2">
            {displayWordBank.map((word: string, wIndex: number) => (
              <div key={wIndex} className="inline-flex items-center">
                {isEditing && onWordBankChange ? (
                  <input
                    type="text"
                    value={word}
                    onChange={e => onWordBankChange(wIndex, e.target.value)}
                    className="px-2 py-1 bg-white border border-blue-300 rounded text-blue-800 editable-content"
                  />
                ) : (
                  <span className="px-3 py-1 bg-blue-100 border border-blue-300 rounded text-blue-800 font-medium">
                    {word}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {sentences.map((sentence: any, sIndex: number) => (
        <div key={sIndex} className="p-4 border rounded-lg bg-gray-50">
          <div className="mb-2">
            <strong className="text-gray-700">Sentence {sIndex + 1}:</strong>
          </div>

          <div className="mb-3">
            {isEditing ? (
              <input
                type="text"
                value={sentence.text}
                onChange={e => onSentenceChange(sIndex, 'text', e.target.value)}
                className="w-full border p-2 editable-content"
                placeholder="Sentence with gap (use _____ for blanks)"
              />
            ) : (
              <div className="text-gray-800">
                {sentence.text?.split('_____').map((part: string, partIndex: number, array: string[]) => (
                  <React.Fragment key={partIndex}>
                    {part}
                    {partIndex < array.length - 1 && (
                      <span className="inline-block border-b-2 border-gray-400 min-w-[80px] mx-1 text-center">
                        <span className="text-gray-400 text-xs">({partIndex + 1})</span>
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>

          {viewMode === 'teacher' && (
            <div className="mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
              <strong className="text-blue-700">Answer:</strong>
              {isEditing ? (
                <input
                  type="text"
                  value={sentence.answer}
                  onChange={e => onSentenceChange(sIndex, 'answer', e.target.value)}
                  className="w-full mt-1 border p-2 bg-white editable-content"
                  placeholder="Correct word/phrase for the gap"
                />
              ) : (
                <span className="ml-2 text-blue-700 font-medium">{sentence.answer}</span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ExerciseGapText;