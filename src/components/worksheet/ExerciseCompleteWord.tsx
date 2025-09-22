import React from "react";

interface ExerciseCompleteWordProps {
  words: any[];
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onWordChange: (wIndex: number, field: string, value: string) => void;
}

const ExerciseCompleteWord: React.FC<ExerciseCompleteWordProps> = ({
  words = [], isEditing, viewMode, onWordChange
}) => {
  if (!words || words.length === 0) {
    return <div className="text-gray-500 italic">No words available for this exercise.</div>;
  }

  return (
    <div>
      <p className="mb-3 font-medium">Complete the words using the definitions:</p>
      
      <div className="space-y-2">
        {words.map((wordItem, wIndex) => (
          <div key={wIndex} className="border-b pb-1">
            <div className="flex flex-row items-start gap-4">
              <div className="flex-grow">
                <p className="leading-snug">
                  <span className="font-medium">{wIndex + 1}. </span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={wordItem?.incomplete_word || ''}
                      onChange={e => onWordChange(wIndex, 'incomplete_word', e.target.value)}
                      className="border p-1 editable-content font-mono"
                    />
                  ) : (
                    <span className="font-mono font-bold text-lg">{wordItem?.incomplete_word || 'Missing word'}</span>
                  )}
                  <span className="ml-2">–</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={wordItem?.definition || ''}
                      onChange={e => onWordChange(wIndex, 'definition', e.target.value)}
                      className="ml-2 border p-1 editable-content flex-grow"
                    />
                  ) : (
                    <span className="ml-2 text-gray-600">{wordItem?.definition || 'Missing definition'}</span>
                  )}
                </p>
              </div>
              
              {viewMode === 'teacher' && (
                <div className="text-green-600 italic text-sm min-w-0 flex-shrink-0">
                  {isEditing ? (
                    <input
                      type="text"
                      value={wordItem?.complete_word || ''}
                      onChange={e => onWordChange(wIndex, 'complete_word', e.target.value)}
                      className="border p-1 editable-content w-full"
                    />
                  ) : (
                    <span>({wordItem?.complete_word || 'No answer'})</span>
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

export default ExerciseCompleteWord;