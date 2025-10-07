import React from "react";
import MediaDisplay from "./MediaDisplay";

interface ExerciseAnswerQuestionsProps {
  questions: any[];
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onQuestionChange: (qIndex: number, field: string, value: string) => void;
  mediaUrl?: string;
  mediaDescription?: string;
  mediaPhotographer?: string;
  mediaPhotographerUrl?: string;
  isPendingMedia?: boolean;
}

const ExerciseAnswerQuestions: React.FC<ExerciseAnswerQuestionsProps> = ({
  questions,
  isEditing,
  viewMode,
  onQuestionChange,
  mediaUrl,
  mediaDescription,
  mediaPhotographer,
  mediaPhotographerUrl,
  isPendingMedia
}) => {
  return (
    <div className="space-y-4">
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

      {/* Questions */}
      <div className="space-y-2">
        {questions.map((question, qIndex) => (
          <div key={qIndex} className="border-b pb-2">
            <div className="flex flex-row items-start">
              <div className="flex-grow">
                <p className="font-medium leading-snug">
                  {isEditing ? (
                    <input
                      type="text"
                      value={question.text}
                      onChange={e => onQuestionChange(qIndex, 'text', e.target.value)}
                      className="w-full border p-1 editable-content"
                    />
                  ) : (
                    <>{qIndex + 1}. {question.text}</>
                  )}
                </p>
              </div>
              {viewMode === 'teacher' && (
                <div className="text-green-600 italic ml-3 text-sm">
                  {isEditing ? (
                    <input
                      type="text"
                      value={question.answer}
                      onChange={e => onQuestionChange(qIndex, 'answer', e.target.value)}
                      className="border p-1 editable-content w-full"
                    />
                  ) : (
                    <span>({question.answer})</span>
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

export default ExerciseAnswerQuestions;