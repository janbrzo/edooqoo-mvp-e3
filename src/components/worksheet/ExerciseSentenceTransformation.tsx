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
    <div>
      <p className="mb-3 font-medium">Transform these sentences using the instructions:</p>
      
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
                    value={sentence.instruction}
                    onChange={e => onSentenceChange(sIndex, 'instruction', e.target.value)}
                    className="w-48 border p-1 editable-content text-sm"
                  />
                </>
              ) : (
                <>
                  <span className="flex-grow">{sentence.original}</span>
                  <span className="text-sm text-gray-600">({sentence.instruction})</span>
                </>
              )}
              
              <span>→ ___________________________</span>
              
              {viewMode === 'teacher' && (
                <div className="text-green-600 italic text-sm">
                  {isEditing ? (
                    <input
                      type="text"
                      value={sentence.transformed}
                      onChange={e => onSentenceChange(sIndex, 'transformed', e.target.value)}
                      className="border p-1 editable-content w-48"
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
    </div>
  );
};

export default ExerciseSentenceTransformation;