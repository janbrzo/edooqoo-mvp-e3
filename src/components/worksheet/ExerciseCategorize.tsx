import React from "react";
import { InteractiveExerciseProps } from "@/types/interactiveHomework";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ExerciseCategorizeProps extends Partial<InteractiveExerciseProps> {
  items?: string[];
  words?: string[];
  categories: any[];
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onWordsChange?: (words: string[]) => void;
  onCategoryChange: (cIndex: number, field: string, value: any) => void;
  liveSessionAnswer?: Record<number, any>;
}

const ExerciseCategorize: React.FC<ExerciseCategorizeProps> = ({
  items = [],
  words = [],
  categories = [],
  isEditing,
  viewMode,
  onWordsChange,
  onCategoryChange,
  // Interactive props
  isInteractive = false,
  studentAnswers = {},
  onAnswerChange,
  showCorrectAnswers = false
}) => {
  // Use items if available, otherwise fall back to words
  const actualWords = items && items.length > 0 ? items : words;
  
  const handleWordChange = (wIndex: number, value: string) => {
    const updatedWords = [...actualWords];
    updatedWords[wIndex] = value;
    if (onWordsChange) {
      onWordsChange(updatedWords);
    }
  };

  const handleCategoryAnswerChange = (cIndex: number, value: string) => {
    onCategoryChange(cIndex, 'correct_items', value.split(',').map(w => w.trim()));
  };

  if (!actualWords || actualWords.length === 0) {
    return <div className="text-gray-500 italic">No words available for categorization.</div>;
  }

  if (!categories || categories.length === 0) {
    return <div className="text-gray-500 italic">No categories available for this exercise.</div>;
  }

  return (
    <div>
      {/* Words section - 3 columns in interactive mode */}
      <div className="mb-4">
        <h4 className="font-medium text-gray-700 mb-2">Words to categorize:</h4>
        {isInteractive ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {actualWords.map((word, wIndex) => {
              const studentAnswer = studentAnswers[wIndex];
              const correctCategory = categories.findIndex(cat => 
                cat.correct_items?.includes(word) || cat.words?.includes(word)
              );
              const isCorrect = showCorrectAnswers && studentAnswer !== undefined && parseInt(studentAnswer) === correctCategory;
              const isIncorrect = showCorrectAnswers && studentAnswer !== undefined && parseInt(studentAnswer) !== correctCategory;
              const isEmpty = showCorrectAnswers && studentAnswer === undefined;

              return (
                <div key={wIndex} className="flex items-center gap-2 p-2 border rounded bg-white">
                  <span className="flex-grow font-medium">{word}</span>
                  <Select
                    value={studentAnswer?.toString() || ''}
                    onValueChange={(value) => onAnswerChange?.(wIndex, value)}
                  >
                    <SelectTrigger className={`w-36 
                      ${isCorrect ? 'bg-green-200 border-2 border-green-600' : ''} 
                      ${isIncorrect ? 'bg-red-200 border-2 border-red-600' : ''}
                      ${isEmpty ? 'bg-red-100 border-2 border-red-400' : ''}
                    `}>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat, cIndex) => (
                        <SelectItem key={cIndex} value={cIndex.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {showCorrectAnswers && correctCategory >= 0 && (
                    <span className="text-green-600 text-xs">({categories[correctCategory]?.name})</span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {actualWords.map((word, wIndex) => (
              <div key={wIndex} className="bg-blue-100 px-3 py-1 rounded-md">
                {isEditing ? (
                  <input
                    type="text"
                    value={word || ''}
                    onChange={e => handleWordChange(wIndex, e.target.value)}
                    className="border p-1 editable-content w-20"
                  />
                ) : (
                  word || 'Word'
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Categories section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((category, cIndex) => (
          <div key={cIndex} className="border rounded-lg p-3">
            <h4 className="font-medium mb-2">
              {isEditing ? (
                <input
                  type="text"
                  value={category?.name || ''}
                  onChange={e => onCategoryChange(cIndex, 'name', e.target.value)}
                  className="border p-1 editable-content w-full"
                />
              ) : (
                category?.name || 'Category'
              )}
            </h4>
            <div className="min-h-[60px] border-2 border-dashed border-gray-300 rounded p-2">
              {viewMode === 'teacher' && (
                <div className="text-green-600 italic text-sm">
                  {isEditing ? (
                    <input
                      type="text"
                      value={category?.correct_items ? category.correct_items.join(', ') : (category?.words ? category.words.join(', ') : '')}
                      onChange={e => handleCategoryAnswerChange(cIndex, e.target.value)}
                      className="border p-1 editable-content w-full"
                      placeholder="word1, word2, word3"
                    />
                  ) : (
                    <span>({category?.correct_items ? category.correct_items.join(', ') : (category?.words ? category.words.join(', ') : 'No words')})</span>
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
