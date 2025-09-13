import React from "react";

interface ExerciseCategorizeProps {
  words: string[];
  categories: any[];
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onWordsChange: (words: string[]) => void;
  onCategoryChange: (cIndex: number, field: string, value: any) => void;
}

const ExerciseCategorize: React.FC<ExerciseCategorizeProps> = ({
  words, categories, isEditing, viewMode, onWordsChange, onCategoryChange
}) => {
  const handleWordChange = (wIndex: number, value: string) => {
    const updatedWords = [...words];
    updatedWords[wIndex] = value;
    onWordsChange(updatedWords);
  };

  const handleCategoryAnswerChange = (cIndex: number, value: string) => {
    onCategoryChange(cIndex, 'words', value.split(',').map(w => w.trim()));
  };

  return (
    <div>
      {/* Words section */}
      <div className="mb-4">
        <h4 className="font-medium text-gray-700 mb-2">Words:</h4>
        <div className="flex flex-wrap gap-2">
          {words.map((word, wIndex) => (
            <div key={wIndex} className="bg-blue-100 px-3 py-1 rounded-md">
              {isEditing ? (
                <input
                  type="text"
                  value={word}
                  onChange={e => handleWordChange(wIndex, e.target.value)}
                  className="border p-1 editable-content w-20"
                />
              ) : (
                word
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Categories section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((category, cIndex) => (
          <div key={cIndex} className="border rounded-lg p-3">
            <h4 className="font-medium mb-2">
              {isEditing ? (
                <input
                  type="text"
                  value={category.name}
                  onChange={e => onCategoryChange(cIndex, 'name', e.target.value)}
                  className="border p-1 editable-content w-full"
                />
              ) : (
                category.name
              )}
            </h4>
            <div className="min-h-[60px] border-2 border-dashed border-gray-300 rounded p-2">
              {viewMode === 'teacher' && (
                <div className="text-green-600 italic text-sm">
                  {isEditing ? (
                    <input
                      type="text"
                      value={category.words ? category.words.join(', ') : ''}
                      onChange={e => handleCategoryAnswerChange(cIndex, e.target.value)}
                      className="border p-1 editable-content w-full"
                      placeholder="word1, word2, word3"
                    />
                  ) : (
                    <span>({category.words ? category.words.join(', ') : ''})</span>
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

export default ExerciseCategorize;