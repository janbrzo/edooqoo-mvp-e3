import React, { useMemo } from "react";

interface ExerciseSynonymsAntonymsProps {
  items: any[];
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onItemChange: (iIndex: number, field: string, value: string) => void;
}

// Shuffle function for matching exercise
function shuffleArray(array: any[]) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

const ExerciseSynonymsAntonyms: React.FC<ExerciseSynonymsAntonymsProps> = ({
  items, isEditing, viewMode, onItemChange
}) => {
  // Safely convert items to consistent structure
  const safeItems = useMemo(() => {
    if (!Array.isArray(items)) return [];
    
    return items.map((item, index) => {
      if (!item || typeof item !== 'object') {
        console.warn(`🔧 ExerciseSynonymsAntonyms: Invalid item at index ${index}:`, item);
        return { term: `Term ${index + 1}`, definition: 'Definition' };
      }
      
      // Extract term with multiple fallbacks
      let safeTerm: string;
      if (typeof item.term === 'string') {
        safeTerm = item.term;
      } else if (typeof item.word === 'string') {
        safeTerm = item.word;
      } else if (typeof item.phrase === 'string') {
        safeTerm = item.phrase;
      } else {
        console.warn(`🔧 ExerciseSynonymsAntonyms: No valid term found at index ${index}:`, item);
        safeTerm = `Term ${index + 1}`;
      }
      
      // Extract definition with multiple fallbacks
      let safeDefinition: string;
      if (typeof item.definition === 'string') {
        safeDefinition = item.definition;
      } else if (typeof item.meaning === 'string') {
        safeDefinition = item.meaning;
      } else {
        console.warn(`🔧 ExerciseSynonymsAntonyms: No valid definition found at index ${index}:`, item);
        safeDefinition = 'Definition';
      }
      
      return { 
        term: String(safeTerm).trim() || `Term ${index + 1}`, 
        definition: String(safeDefinition).trim() || 'Definition' 
      };
    });
  }, [items]);

  // Use useMemo to prevent re-shuffling on every render
  const shuffledDefinitions = useMemo(() => {
    return shuffleArray([...safeItems]);
  }, [safeItems.map(item => `${item.term}|${item.definition}`).join('||')]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 vocabulary-matching-container">
      <div className="md:col-span-5 space-y-2">
        <h4 className="font-semibold bg-worksheet-purpleLight p-2 rounded-md">Words</h4>
        {safeItems.map((item, iIndex) => (
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
                value={item.term}
                onChange={e => onItemChange(iIndex, 'term', e.target.value)}
                className="border p-1 editable-content w-full"
              />
            ) : item.term}
          </div>
        ))}
      </div>

      <div className="md:col-span-7 space-y-2">
        <h4 className="font-semibold bg-worksheet-purpleLight p-2 rounded-md">Synonyms/Antonyms</h4>
        {shuffledDefinitions.map((item, iIndex) => (
          <div key={iIndex} className="p-2 border rounded-md bg-white">
            <span className="text-worksheet-purple font-medium mr-2">{String.fromCharCode(65 + iIndex)}.</span>
            {isEditing ? (
              <input
                type="text"
                value={item.definition}
                onChange={e => {
                  const originalIndex = safeItems.findIndex(i => i.term === item.term);
                  if (originalIndex !== -1) {
                    onItemChange(originalIndex, 'definition', e.target.value);
                  }
                }}
                className="border p-1 editable-content w-full"
              />
            ) : item.definition}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExerciseSynonymsAntonyms;