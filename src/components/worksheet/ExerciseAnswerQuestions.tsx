import React from "react";

interface Question {
  text?: string;          // Old format (reading exercises)
  question?: string;      // New format (picture exercises)
  answer?: string;        // Old format (sample answers)
  focus?: string;         // New format (grammar focus)
}

interface ExerciseAnswerQuestionsProps {
  media_url?: string;
  media_type?: "video" | "audio" | "image";
  questions: Question[];
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onQuestionChange: (qIndex: number, field: string, value: string) => void;
  onMediaUrlChange?: (url: string) => void;
  onMediaTypeChange?: (type: "video" | "audio" | "image") => void;
}

const ExerciseAnswerQuestions: React.FC<ExerciseAnswerQuestionsProps> = ({
  media_url,
  media_type = "image",
  questions,
  isEditing,
  viewMode,
  onQuestionChange,
  onMediaUrlChange,
  onMediaTypeChange
}) => {
  return (
    <div className="space-y-4">
      {/* Media section */}
      <div className="flex justify-center">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
          {isEditing && onMediaUrlChange && onMediaTypeChange ? (
            <div className="space-y-3">
              <select
                value={media_type}
                onChange={e => onMediaTypeChange(e.target.value as "video" | "audio" | "image")}
                className="border p-2 rounded"
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="audio">Audio</option>
              </select>
              <input
                type="text"
                value={media_url || ""}
                onChange={e => onMediaUrlChange(e.target.value)}
                placeholder={`Enter ${media_type} URL`}
                className="w-full border p-2 editable-content"
              />
              <p className="text-xs text-gray-500">
                Enter {media_type} URL for students to {media_type === "audio" ? "listen to" : "watch/view"}
              </p>
            </div>
          ) : (
            <>
              {media_url ? (
                <div className="max-w-full">
                  {media_type === "image" && (
                    <img src={media_url} alt="Exercise media" className="max-w-full max-h-64 mx-auto rounded" />
                  )}
                  {media_type === "video" && (
                    <video controls className="max-w-full max-h-64 mx-auto rounded">
                      <source src={media_url} />
                      Your browser does not support video.
                    </video>
                  )}
                  {media_type === "audio" && (
                    <audio controls className="w-full max-w-md">
                      <source src={media_url} />
                      Your browser does not support audio.
                    </audio>
                  )}
                </div>
              ) : (
                <div className="w-64 h-48 bg-gray-200 rounded flex items-center justify-center">
                  <p className="text-gray-500">
                    {media_type === "video" && "🎥 Video content"}
                    {media_type === "audio" && "🎵 Audio content"}
                    {media_type === "image" && "📷 Image content"}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

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
                    <>{qIndex + 1}. {question.text || question.question}</>
                  )}
                </p>
              </div>
              {viewMode === 'teacher' && (question.answer || question.focus) && (
                <div className="text-green-600 italic ml-3 text-sm">
                  {isEditing ? (
                    <input
                      type="text"
                      value={question.answer || question.focus || ''}
                      onChange={e => onQuestionChange(qIndex, question.answer ? 'answer' : 'focus', e.target.value)}
                      className="border p-1 editable-content w-full"
                    />
                  ) : (
                    <span>
                      {question.answer 
                        ? `(${question.answer})` 
                        : question.focus 
                        ? `Focus: ${question.focus}` 
                        : ''}
                    </span>
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