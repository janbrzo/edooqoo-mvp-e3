import React from "react";

interface ExerciseDescribeProps {
  image_url?: string;
  questions?: any[];
  showImage?: boolean;
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onQuestionChange: (qIndex: number, field: string, value: string) => void;
  onImageUrlChange?: (url: string) => void;
}

const ExerciseDescribe: React.FC<ExerciseDescribeProps> = ({
  image_url,
  questions,
  showImage = true,
  isEditing,
  viewMode,
  onQuestionChange,
  onImageUrlChange
}) => {
  return (
    <div className="space-y-4">
      {/* Image section - only show if showImage is true */}
      {showImage && (
        <div className="flex justify-center">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
          {isEditing && onImageUrlChange ? (
            <div className="space-y-2">
              <input
                type="text"
                value={image_url || ""}
                onChange={e => onImageUrlChange(e.target.value)}
                placeholder="Enter image URL"
                className="w-full border p-2 editable-content"
              />
              <p className="text-xs text-gray-500">Enter image URL for the picture description exercise</p>
            </div>
          ) : (
            <>
              {image_url ? (
                <img src={image_url} alt="Description exercise" className="max-w-full max-h-64 mx-auto rounded" />
              ) : (
                <div className="w-64 h-48 bg-gray-200 rounded flex items-center justify-center">
                  <p className="text-gray-500">📷 Picture for description</p>
                </div>
              )}
            </>
          )}
        </div>
        </div>
      )}

      {/* Optional guiding questions */}
      {questions && questions.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-700">Guiding questions:</h4>
          {questions.map((question, qIndex) => (
            <div key={qIndex} className="border-b pb-1">
              <p className="leading-snug">
                {isEditing ? (
                  <input
                    type="text"
                    value={question.text || question}
                    onChange={e => onQuestionChange(qIndex, 'text', e.target.value)}
                    className="w-full border p-1 editable-content"
                  />
                ) : (
                  <>{qIndex + 1}. {question.text || question}</>
                )}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExerciseDescribe;