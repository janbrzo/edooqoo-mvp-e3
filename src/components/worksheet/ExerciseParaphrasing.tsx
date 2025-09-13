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
      <div className="space-y-3">
        {sentences.map((sentence, sIndex) => (
          <div key={sIndex} className="border-b pb-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">{sIndex + 1}.</span>
              
              {isEditing ? (
                <>
                  <input
                    type="text"
                    value={sentence.original}
                    onChange={e => onSentenceChange(sIndex, 'original', e.target.value)}
                    className="flex-grow border p-1 editable-content"
                  />
                  <input
                    type="text"
                    value={sentence.word_to_use}
                    onChange={e => onSentenceChange(sIndex, 'word_to_use', e.target.value)}
                    className="w-32 border p-1 editable-content text-sm"
                  />
                </>
              ) : (
                <>
                  <span className="flex-grow">{sentence.original}</span>
                  <span className="text-sm text-gray-600">Use: <strong>{sentence.word_to_use}</strong></span>
                </>
              )}
              
              <span>→ ___________________________</span>
              
              {viewMode === 'teacher' && (
                <div className="text-green-600 italic text-sm">
                  {isEditing ? (
                    <input
                      type="text"
                      value={sentence.answer}
                      onChange={e => onSentenceChange(sIndex, 'answer', e.target.value)}
                      className="border p-1 editable-content w-48"
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