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
    <div>
      <div className="space-y-3">
        {sentences.map((sentence, sIndex) => (
          <div key={sIndex} className="border-b pb-2">
            <div className="flex items-center gap-3">
              <span className="font-medium">{sIndex + 1}.</span>
              
              {isEditing ? (
                <input
                  type="text"
                  value={sentence.scrambled_words}
                  onChange={e => handleScrambledWordsChange(sIndex, e.target.value)}
                  className="border p-1 editable-content flex-grow"
                  placeholder="word1 / word2 / word3"
                />
              ) : (
                <div className="flex flex-wrap gap-2 flex-grow">
                  {sentence.scrambled_words.split(' / ').map((word: string, wIndex: number) => (
                    <span key={wIndex} className="bg-blue-100 px-2 py-1 rounded-md text-sm border">
                      {word.trim()}
                    </span>
                  ))}
                </div>
              )}
              
              {viewMode === 'teacher' && (
                <div className="text-green-600 italic text-sm">
                  {isEditing ? (
                    <input
                      type="text"
                      value={sentence.correct_order}
                      onChange={e => onSentenceChange(sIndex, 'correct_order', e.target.value)}
                      className="border p-1 editable-content w-48"
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
    </div>
  );
};

export default ExerciseWordOrder;