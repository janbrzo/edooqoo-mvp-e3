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
      {/* Image is displayed in MediaSection above - no duplicate needed */}
      {showImage && !image_url && (
        <div className="text-center text-sm text-muted-foreground py-2">
          ℹ️ Refer to the image in the Lesson Media section above
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