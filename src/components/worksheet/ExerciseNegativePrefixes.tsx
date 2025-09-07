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
    <div className="space-y-4">
      <h3 className="font-medium text-gray-700 mb-3">Add the correct negative prefix:</h3>
      
      <div className="grid md:grid-cols-2 gap-4">
        {words.map((word: any, wIndex: number) => (
          <div key={wIndex} className="p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <strong className="text-gray-700">Word {wIndex + 1}:</strong>
            </div>

            <div className="mb-3">
              <div className="text-lg font-medium text-gray-800">
                {isEditing ? (
                  <input
                    type="text"
                    value={word.base_word}
                    onChange={e => onWordChange(wIndex, 'base_word', e.target.value)}
                    className="border p-2 editable-content mr-2"
                    placeholder="Base word (e.g., happy)"
                  />
                ) : (
                  <span>{word.base_word}</span>
                )}
                <span className="text-gray-600"> → </span>
                <span className="border-b-2 border-gray-400 min-w-[100px] inline-block text-center">
                  _____
                </span>
                {word.base_word && !isEditing && (
                  <span>{word.base_word}</span>
                )}
              </div>
            </div>

            {word.hint && (
              <div className="mb-2 text-sm text-gray-600 italic">
                {isEditing ? (
                  <input
                    type="text"
                    value={word.hint}
                    onChange={e => onWordChange(wIndex, 'hint', e.target.value)}
                    className="w-full border p-1 editable-content"
                    placeholder="Hint (optional)"
                  />
                ) : (
                  <span>Hint: {word.hint}</span>
                )}
              </div>
            )}

            {viewMode === 'teacher' && (
              <div className="mt-3 p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                <strong className="text-blue-700">Answer:</strong>
                {isEditing ? (
                  <div className="mt-1 flex gap-2">
                    <input
                      type="text"
                      value={word.prefix}
                      onChange={e => onWordChange(wIndex, 'prefix', e.target.value)}
                      className="border p-1 bg-white editable-content"
                      placeholder="Prefix (un-, in-, dis-, etc.)"
                    />
                    <span className="self-center">+</span>
                    <span className="self-center">{word.base_word}</span>
                    <span className="self-center">=</span>
                    <span className="self-center font-medium text-blue-700">{word.prefix}{word.base_word}</span>
                  </div>
                ) : (
                  <span className="ml-2 text-blue-700 font-medium">{word.prefix}{word.base_word}</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Prefix reference for teachers */}
      {viewMode === 'teacher' && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-medium text-yellow-800 mb-2">Common Negative Prefixes:</h4>
          <div className="text-sm text-yellow-700 grid grid-cols-2 md:grid-cols-4 gap-2">
            <div><strong>un-</strong> (happy → unhappy)</div>
            <div><strong>in-</strong> (complete → incomplete)</div>
            <div><strong>dis-</strong> (agree → disagree)</div>
            <div><strong>im-</strong> (possible → impossible)</div>
            <div><strong>ir-</strong> (regular → irregular)</div>
            <div><strong>il-</strong> (legal → illegal)</div>
            <div><strong>mis-</strong> (understand → misunderstand)</div>
            <div><strong>non-</strong> (fiction → non-fiction)</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseNegativePrefixes;