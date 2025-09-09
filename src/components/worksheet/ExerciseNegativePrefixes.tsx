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
    <div className="space-y-0.5">
      {words.map((wordItem, wIndex) => (
        <div key={wIndex} className="border-b pb-1">
          <div className="flex flex-row items-start">
            <div className="flex-grow">
              <p className="font-medium leading-snug">
                {wIndex + 1}. Add the correct negative prefix to: {' '}
                <span className="text-blue-600 font-semibold">
                  {isEditing ? (
                    <input
                      type="text"
                      value={wordItem.word}
                      onChange={e => onWordChange(wIndex, 'word', e.target.value)}
                      className="border p-1 editable-content"
                    />
                  ) : (
                    wordItem.word
                  )}
                </span>
              </p>
              {viewMode === 'student' && (
                <div className="mt-2 p-2 bg-gray-50 rounded border-dashed border-2 border-gray-300">
                  <p className="text-sm text-gray-600">Your answer: ________________</p>
                </div>
              )}
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
  );
};

export default ExerciseNegativePrefixes;