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
    <div className="space-y-0.5">
      {sentences.map((sentence, sIndex) => (
        <div key={sIndex} className="border-b pb-1">
          <div className="flex flex-row items-start">
            <div className="flex-grow">
              <p className="leading-snug">
                {sIndex + 1}. Arrange these words:
              </p>
              
              {/* Scrambled words as tiles */}
              <div className="mt-2">
                {isEditing ? (
                  <input
                    type="text"
                    value={sentence.scrambled_words}
                    onChange={e => handleScrambledWordsChange(sIndex, e.target.value)}
                    className="border p-1 editable-content w-full"
                    placeholder="word1 / word2 / word3"
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {sentence.scrambled_words.split(' / ').map((word: string, wIndex: number) => (
                      <span key={wIndex} className="bg-blue-100 px-2 py-1 rounded-md text-sm border">
                        {word.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {viewMode === 'teacher' && (
              <div className="text-green-600 italic ml-3 text-sm">
                {isEditing ? (
                  <input
                    type="text"
                    value={sentence.correct_order}
                    onChange={e => onSentenceChange(sIndex, 'correct_order', e.target.value)}
                    className="border p-1 editable-content w-full"
                  />
                ) : (
                  <span>({sentence.correct_order})</span>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ExerciseWordOrder;