import React from "react";

interface ExerciseParaphrasingProps {
  sentences: any[];
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onSentenceChange: (sIndex: number, field: string, value: string) => void;
}

const ExerciseParaphrasing: React.FC<ExerciseParaphrasingProps> = ({
  sentences, isEditing, viewMode, onSentenceChange
}) => {
  return (
    <div>
      <p className="mb-3 font-medium">Rewrite each sentence using the word in brackets:</p>
      
      <div className="space-y-3">
        {sentences.map((sentence, sIndex) => (
          <div key={sIndex} className="border-b pb-2">
            <div className="flex flex-row items-start gap-4">
              <div className="flex-grow">
                <p className="leading-snug mb-1">
                  <span className="font-medium">{sIndex + 1}. </span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={sentence.original}
                      onChange={e => onSentenceChange(sIndex, 'original', e.target.value)}
                      className="w-full border p-1 editable-content"
                    />
                  ) : (
                    <span>{sentence.original}</span>
                  )}
                </p>
                
                <p className="text-sm text-gray-600 mb-2">
                  {isEditing ? (
                    <input
                      type="text"
                      value={sentence.word_to_use}
                      onChange={e => onSentenceChange(sIndex, 'word_to_use', e.target.value)}
                      className="border p-1 editable-content"
                    />
                  ) : (
                    <span>Use: <strong>{sentence.word_to_use}</strong></span>
                  )}
                </p>
                
                <div className="mt-2">
                  <span>→ ___________________________</span>
                </div>
              </div>
              
              {viewMode === 'teacher' && (
                <div className="text-green-600 italic text-sm min-w-0 flex-shrink-0">
                  {isEditing ? (
                    <input
                      type="text"
                      value={sentence.answer}
                      onChange={e => onSentenceChange(sIndex, 'answer', e.target.value)}
                      className="border p-1 editable-content w-full"
                    />
                  ) : (
                    <span>({sentence.answer})</span>
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

export default ExerciseParaphrasing;