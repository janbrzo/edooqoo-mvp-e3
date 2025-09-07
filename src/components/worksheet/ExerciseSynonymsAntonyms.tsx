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
  const title = type === 'synonyms' ? 'Match the words with their synonyms:' : 'Match the words with their antonyms:';

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-700 mb-3">{title}</h3>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left column - Words */}
        <div>
          <h4 className="font-medium text-gray-600 mb-2">Words:</h4>
          <div className="space-y-2">
            {items.map((item: any, index: number) => (
              <div key={index} className="flex items-center p-2 border rounded">
                <span className="font-medium mr-2">{String.fromCharCode(65 + index)})</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={item.word}
                    onChange={e => onItemChange(index, 'word', e.target.value)}
                    className="flex-1 border p-1 editable-content"
                    placeholder="Word"
                  />
                ) : (
                  <span>{item.word}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right column - Matches */}
        <div>
          <h4 className="font-medium text-gray-600 mb-2">{type === 'synonyms' ? 'Synonyms:' : 'Antonyms:'}</h4>
          <div className="space-y-2">
            {items.map((item: any, index: number) => (
              <div key={index} className="flex items-center p-2 border rounded">
                <span className="font-medium mr-2">{index + 1})</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={item.match}
                    onChange={e => onItemChange(index, 'match', e.target.value)}
                    className="flex-1 border p-1 editable-content"
                    placeholder={type === 'synonyms' ? 'Synonym' : 'Antonym'}
                  />
                ) : (
                  <span>{item.match}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {viewMode === 'teacher' && (
        <div className="mt-4 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
          <h4 className="font-medium text-blue-700 mb-2">Answer Key:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            {items.map((item: any, index: number) => (
              <div key={index} className="text-blue-700">
                {String.fromCharCode(65 + index)}-{index + 1}: {item.word} ↔ {item.match}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseSynonymsAntonyms;