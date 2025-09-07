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
    <div className="space-y-4">
      <h3 className="font-medium text-gray-700 mb-3">Transform the sentences as instructed:</h3>
      
      {sentences.map((sentence: any, sIndex: number) => (
        <div key={sIndex} className="p-4 border rounded-lg bg-gray-50">
          <div className="mb-3">
            <strong className="text-gray-700">Sentence {sIndex + 1}:</strong>
            <div className="mt-1">
              <strong>Instruction:</strong>
              {isEditing ? (
                <input
                  type="text"
                  value={sentence.instruction}
                  onChange={e => onSentenceChange(sIndex, 'instruction', e.target.value)}
                  className="w-full mt-1 border p-2 editable-content"
                  placeholder="Transformation instruction (e.g., 'Rewrite in passive voice')"
                />
              ) : (
                <span className="ml-2 italic text-gray-600">{sentence.instruction}</span>
              )}
            </div>
          </div>

          <div className="mb-3">
            <strong>Original:</strong>
            {isEditing ? (
              <input
                type="text"
                value={sentence.original}
                onChange={e => onSentenceChange(sIndex, 'original', e.target.value)}
                className="w-full mt-1 border p-2 editable-content"
                placeholder="Original sentence"
              />
            ) : (
              <div className="mt-1 p-2 bg-white border rounded">{sentence.original}</div>
            )}
          </div>

          {viewMode === 'teacher' && (
            <div className="mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
              <strong className="text-blue-700">Transformed:</strong>
              {isEditing ? (
                <textarea
                  value={sentence.transformed}
                  onChange={e => onSentenceChange(sIndex, 'transformed', e.target.value)}
                  className="w-full mt-1 border p-2 bg-white editable-content"
                  rows={2}
                  placeholder="Correct transformation"
                />
              ) : (
                <div className="mt-1 text-blue-700 font-medium">{sentence.transformed}</div>
              )}
            </div>
          )}

          {viewMode === 'student' && (
            <div className="mt-3">
              <strong>Your answer:</strong>
              <div className="mt-1 p-2 border-2 border-dashed border-gray-300 rounded min-h-[40px] bg-white">
                <span className="text-gray-400 italic">Write your transformation here...</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ExerciseSentenceTransformation;