
import React from "react";
import MediaDisplay from "./MediaDisplay";

interface ExerciseMultipleChoiceProps {
  questions: any[];
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onQuestionTextChange: (qIndex: number, value: string) => void;
  onOptionTextChange: (qIndex: number, oIndex: number, value: string) => void;
  mediaUrl?: string;
  mediaDescription?: string;
  mediaPhotographer?: string;
  mediaPhotographerUrl?: string;
  isPendingMedia?: boolean;
}

const ExerciseMultipleChoice: React.FC<ExerciseMultipleChoiceProps> = ({
  questions, isEditing, viewMode, onQuestionTextChange, onOptionTextChange,
  mediaUrl, mediaDescription, mediaPhotographer, mediaPhotographerUrl, isPendingMedia
}) => {
  return (
    <div className="space-y-2">
      {/* Display media if present */}
      {(mediaUrl || isPendingMedia) && (
        <MediaDisplay
          mediaUrl={mediaUrl}
          mediaDescription={mediaDescription}
          mediaPhotographer={mediaPhotographer}
          mediaPhotographerUrl={mediaPhotographerUrl}
          isPending={isPendingMedia}
          className="mb-4"
        />
      )}
      
      {questions.map((question, qIndex) => (
        <div key={qIndex} className="border-b pb-2 multiple-choice-question">
          <p className="font-medium mb-1 leading-snug">
            {isEditing ? (
              <input
                type="text"
                value={question.text}
                onChange={e => onQuestionTextChange(qIndex, e.target.value)}
                className="w-full border p-1 editable-content"
              />
            ) : (
              <>{qIndex + 1}. {question.text}</>
            )}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
            {question.options?.map((option: any, oIndex: number) => (
              <div
                key={oIndex}
                className={`
                  p-2 border rounded-md flex items-center gap-2 multiple-choice-option
                  ${viewMode === 'teacher' && option.correct ? 'bg-green-50 border-green-200' : 'bg-white'}
                `}
              >
                <div
                  className={`
                    w-5 h-5 rounded-md border flex items-center justify-center option-icon
                    ${viewMode === 'teacher' && option.correct ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'}
                  `}
                >
                  {viewMode === 'teacher' && option.correct && <span>✓</span>}
                </div>
                <span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={option.text}
                      onChange={e => onOptionTextChange(qIndex, oIndex, e.target.value)}
                      className="border p-1 editable-content ml-1"
                    />
                  ) : (
                    <>{option.label}. {option.text}</>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ExerciseMultipleChoice;
