import React from "react";

interface ExerciseSynonymsAntonymsProps {
  items: any[];
  type: 'synonyms' | 'antonyms';
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onItemChange: (itemIndex: number, field: string, value: string) => void;
}

const ExerciseSynonymsAntonyms: React.FC<ExerciseSynonymsAntonymsProps> = ({
  items, type, isEditing, viewMode, onItemChange
}) => {
  return (
    <div className="space-y-0.5">
      {items.map((item, iIndex) => (
        <div key={iIndex} className="border-b pb-1">
          <div className="flex flex-row items-start">
            <div className="flex-grow">
              <p className="font-medium leading-snug">
                {iIndex + 1}. Find a {type === 'synonyms' ? 'synonym' : 'antonym'} for: {' '}
                <span className="text-blue-600 font-semibold">
                  {isEditing ? (
                    <input
                      type="text"
                      value={item.word}
                      onChange={e => onItemChange(iIndex, 'word', e.target.value)}
                      className="border p-1 editable-content"
                    />
                  ) : (
                    item.word
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
                    value={item.answer}
                    onChange={e => onItemChange(iIndex, 'answer', e.target.value)}
                    className="border p-1 editable-content w-full"
                  />
                ) : (
                  <span>({item.answer})</span>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ExerciseSynonymsAntonyms;