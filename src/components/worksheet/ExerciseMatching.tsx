
import React, { useMemo } from "react";

interface ExerciseMatchingProps {
  items: any[];
  isEditing: boolean;
  viewMode: "student" | "teacher";
  getMatchedItems: (items: any[]) => any[];
  onItemChange: (iIndex: number, field: string, value: string) => void;
}

// Funkcja do tasowania (Fisher-Yates)
function shuffleArray(array: any[]) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

const ExerciseMatching: React.FC<ExerciseMatchingProps> = ({
  items, isEditing, viewMode, getMatchedItems, onItemChange
}) => {
  // Use useMemo to prevent re-shuffling on every render
  // Create a stable key based on the terms to ensure consistent shuffling
  const shuffledDefinitions = useMemo(() => {
    // Ensure all items have proper structure before processing
    const safeItems = items.map((item, index) => {
      if (!item || typeof item !== 'object') {
        return { term: `Term ${index + 1}`, definition: 'Definition' };
      }
      
      const safeTerm = typeof item.term === 'string' ? item.term : 
                       typeof item.word === 'string' ? item.word :
                       typeof item.phrase === 'string' ? item.phrase : 
                       `Term ${index + 1}`;
      
      const safeDefinition = typeof item.definition === 'string' ? item.definition :
                             typeof item.meaning === 'string' ? item.meaning :
                             'Definition';
      
      return { term: safeTerm, definition: safeDefinition };
    });
    
    return shuffleArray([...safeItems]);
  }, [items.map((item, index) => {
    const safeTerm = typeof item?.term === 'string' ? item.term : 
                     typeof item?.word === 'string' ? item.word :
                     typeof item?.phrase === 'string' ? item.phrase : 
                     `Term ${index + 1}`;
    const safeDefinition = typeof item?.definition === 'string' ? item.definition :
                           typeof item?.meaning === 'string' ? item.meaning :
                           'Definition';
    return `${safeTerm}|${safeDefinition}`;
  }).join('||')]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 vocabulary-matching-container">
      <div className="md:col-span-5 space-y-2">
        <h4 className="font-semibold bg-worksheet-purpleLight p-2 rounded-md">Terms</h4>
        {shuffledDefinitions.map((item, iIndex) => {
          // Use the safe item structure from shuffledDefinitions
          const originalIndex = iIndex;
          return (
            <div key={iIndex} className="p-2 border rounded-md bg-white">
              <span className="text-worksheet-purple font-medium mr-2">{iIndex + 1}.</span>
              {viewMode === 'teacher' ? (
                <span className="teacher-answer">{String.fromCharCode(65 + shuffledDefinitions.findIndex(i => i.term === item.term))}</span>
              ) : (
                <span className="student-answer-blank"></span>
              )}
              {isEditing ? (
                <input
                  type="text"
                  value={item.term || ''}
                  onChange={e => onItemChange(originalIndex, 'term', e.target.value)}
                  className="border p-1 editable-content w-full"
                />
              ) : (item.term || '')}
            </div>
          );
        })}
      </div>

      <div className="md:col-span-7 space-y-2">
        <h4 className="font-semibold bg-worksheet-purpleLight p-2 rounded-md">Definitions</h4>
        {shuffledDefinitions.map((item, iIndex) => (
          <div key={iIndex} className="p-2 border rounded-md bg-white">
            <span className="text-worksheet-purple font-medium mr-2">{String.fromCharCode(65 + iIndex)}.</span>
            {isEditing ? (
              <input
                type="text"
                value={item.definition || ''}
                onChange={e => {
                  const originalIndex = shuffledDefinitions.findIndex(i => i.term === item.term);
                  if (originalIndex !== -1) {
                    onItemChange(originalIndex, 'definition', e.target.value);
                  }
                }}
                className="border p-1 editable-content w-full"
              />
            ) : (item.definition || '')}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExerciseMatching;
