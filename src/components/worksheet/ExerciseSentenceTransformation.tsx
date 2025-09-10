import React from "react";

interface ExerciseSentenceTransformationProps {
  sentences: any[];
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onSentenceChange: (sIndex: number, field: string, value: string) => void;
}

const ExerciseSentenceTransformation: React.FC<ExerciseSentenceTransformationProps> = ({
  sentences, isEditing, viewMode, onSentenceChange
}) => {
  return (
    <div className="space-y-0.5">
      {sentences.map((sentence, sIndex) => (
        <div key={sIndex} className="border-b pb-1">
          <div className="flex flex-row items-start">
            <div className="flex-grow">
              <p className="font-medium leading-snug">
                {sIndex + 1}. Transform this sentence:
              </p>
              <div className="bg-blue-50 p-2 rounded mt-1 mb-2">
                {isEditing ? (
                  <input
                    type="text"
                    value={sentence.original}
                    onChange={e => onSentenceChange(sIndex, 'original', e.target.value)}
                    className="w-full border p-1 editable-content"
                  />
                ) : (
                  <p className="font-medium text-sm">{sentence.original}</p>
                )}
              </div>
              {sentence.instruction && (
                <p className="text-sm text-gray-600 mb-2 italic">
                  {isEditing ? (
                    <input
                      type="text"
                      value={sentence.instruction}
                      onChange={e => onSentenceChange(sIndex, 'instruction', e.target.value)}
                      className="w-full border p-1 editable-content"
                    />
                  ) : (
                    sentence.instruction
                  )}
                </p>
              )}
            </div>
            {viewMode === 'teacher' && (
              <div className="text-green-600 italic ml-3 text-sm">
                {isEditing ? (
                  <input
                    type="text"
                    value={sentence.transformed}
                    onChange={e => onSentenceChange(sIndex, 'transformed', e.target.value)}
                    className="border p-1 editable-content w-full"
                  />
                ) : (
                  <span>({sentence.transformed})</span>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ExerciseSentenceTransformation;