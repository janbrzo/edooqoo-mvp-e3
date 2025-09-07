import React from "react";

interface ExerciseWordOrderProps {
  sentences: any[];
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onSentenceChange: (sIndex: number, field: string, value: string) => void;
}

const ExerciseWordOrder: React.FC<ExerciseWordOrderProps> = ({
  sentences, isEditing, viewMode, onSentenceChange
}) => {
  const handleScrambledWordsChange = (sIndex: number, value: string) => {
    onSentenceChange(sIndex, 'scrambled_words', value);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-700 mb-3">Put the words in the correct order:</h3>
      
      {sentences.map((sentence: any, sIndex: number) => (
        <div key={sIndex} className="p-4 border rounded-lg bg-gray-50">
          <div className="mb-3">
            <strong className="text-gray-700">Sentence {sIndex + 1}:</strong>
          </div>

          <div className="mb-3">
            <strong>Scrambled words:</strong>
            {isEditing ? (
              <input
                type="text"
                value={sentence.scrambled_words}
                onChange={e => handleScrambledWordsChange(sIndex, e.target.value)}
                className="w-full mt-1 border p-2 editable-content"
                placeholder="Words separated by / (e.g., yesterday / went / cinema / to / we / the)"
              />
            ) : (
              <div className="mt-1 flex flex-wrap gap-2">
                {sentence.scrambled_words?.split(' / ').map((word: string, wIndex: number) => (
                  <span key={wIndex} className="px-3 py-1 bg-blue-100 border border-blue-300 rounded-md text-blue-800 font-medium">
                    {word.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>

          {viewMode === 'teacher' && (
            <div className="mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
              <strong className="text-blue-700">Correct order:</strong>
              {isEditing ? (
                <input
                  type="text"
                  value={sentence.correct_order}
                  onChange={e => onSentenceChange(sIndex, 'correct_order', e.target.value)}
                  className="w-full mt-1 border p-2 bg-white editable-content"
                  placeholder="Correct sentence"
                />
              ) : (
                <div className="mt-1 text-blue-700 font-medium">{sentence.correct_order}</div>
              )}
            </div>
          )}

          {viewMode === 'student' && (
            <div className="mt-3">
              <strong>Your answer:</strong>
              <div className="mt-1 p-2 border-2 border-dashed border-gray-300 rounded min-h-[40px] bg-white">
                <span className="text-gray-400 italic">Write the sentence in correct order here...</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ExerciseWordOrder;