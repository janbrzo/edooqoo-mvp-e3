import React from "react";

interface ExerciseNegativePrefixesProps {
  words: any[];
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onWordChange: (wIndex: number, field: string, value: string) => void;
}

const ExerciseNegativePrefixes: React.FC<ExerciseNegativePrefixesProps> = ({
  words, isEditing, viewMode, onWordChange
}) => {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {words.map((wordItem, wIndex) => (
          <div key={wIndex} className="border-b pb-1">
            <div className="flex flex-row items-start">
              <div className="flex-grow">
                <p className="leading-snug">
                  {wIndex + 1}. {isEditing ? (
                    <input
                      type="text"
                      value={wordItem.word}
                      onChange={e => onWordChange(wIndex, 'word', e.target.value)}
                      className="border p-1 editable-content"
                    />
                  ) : (
                    wordItem.word
                  )} → ______
                </p>
              </div>
              {viewMode === 'teacher' && (
                <div className="text-green-600 italic ml-3 text-sm">
                  {isEditing ? (
                    <input
                      type="text"
                      value={wordItem.answer}
                      onChange={e => onWordChange(wIndex, 'answer', e.target.value)}
                      className="border p-1 editable-content w-full"
                    />
                  ) : (
                    <span>({wordItem.answer})</span>
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

export default ExerciseNegativePrefixes;