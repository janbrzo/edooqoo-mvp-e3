import React from "react";
import MediaDisplay from "./MediaDisplay";

interface ExerciseDescribeProps {
  image_url?: string;
  questions?: any[];
  prompts?: string[];
  useful_vocabulary?: string[];
  image_description?: string;
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onQuestionChange: (qIndex: number, field: string, value: string) => void;
  onImageUrlChange?: (url: string) => void;
  // Media props
  mediaUrl?: string;
  mediaDescription?: string;
  mediaPhotographer?: string;
  mediaPhotographerUrl?: string;
  isPendingMedia?: boolean;
}

const ExerciseDescribe: React.FC<ExerciseDescribeProps> = ({
  image_url,
  questions,
  prompts,
  useful_vocabulary,
  image_description,
  isEditing,
  viewMode,
  onQuestionChange,
  onImageUrlChange,
  mediaUrl,
  mediaDescription,
  mediaPhotographer,
  mediaPhotographerUrl,
  isPendingMedia
}) => {
  // Use media if available, otherwise fall back to image_url
  const displayImageUrl = mediaUrl || image_url;
  const displayDescription = mediaDescription || image_description;
  
  return (
    <div className="space-y-4">
      {/* Display media if present */}
      {(displayImageUrl || isPendingMedia) && (
        <MediaDisplay
          mediaUrl={displayImageUrl}
          mediaDescription={displayDescription}
          mediaPhotographer={mediaPhotographer}
          mediaPhotographerUrl={mediaPhotographerUrl}
          isPending={isPendingMedia}
          className="mb-4"
        />
      )}

      {/* Useful vocabulary if present */}
      {useful_vocabulary && useful_vocabulary.length > 0 && (
        <div className="bg-blue-50 p-3 rounded-md">
          <h4 className="font-medium text-gray-700 mb-2">Useful Vocabulary:</h4>
          <div className="flex flex-wrap gap-2">
            {useful_vocabulary.map((word, idx) => (
              <span key={idx} className="bg-white px-3 py-1 rounded-full text-sm border border-blue-200">
                {word}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Guiding prompts if present */}
      {prompts && prompts.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-700">Guiding prompts:</h4>
          {prompts.map((prompt, pIndex) => (
            <div key={pIndex} className="border-b pb-1">
              <p className="leading-snug text-sm text-gray-700">
                {pIndex + 1}. {prompt}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Optional guiding questions (legacy) */}
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