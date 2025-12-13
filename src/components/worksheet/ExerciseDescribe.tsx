import React from "react";
import { InteractiveExerciseProps } from "@/types/interactiveHomework";
import { Input } from "@/components/ui/input";

interface ExerciseDescribeProps extends Partial<InteractiveExerciseProps> {
  image_url?: string;
  questions?: any[];
  showImage?: boolean;
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onQuestionChange: (qIndex: number, field: string, value: string) => void;
  onImageUrlChange?: (url: string) => void;
  liveSessionAnswer?: Record<number, any>;
}

const ExerciseDescribe: React.FC<ExerciseDescribeProps> = ({
  image_url,
  questions,
  showImage = true,
  isEditing,
  viewMode,
  onQuestionChange,
  onImageUrlChange,
  liveSessionAnswer,
  // Interactive props
  isInteractive = false,
  studentAnswers = {},
  onAnswerChange,
  showCorrectAnswers = false
}) => {
  return (
    <div className="space-y-4">
      {/* Image is displayed in MediaSection above - no duplicate needed */}
      {showImage && !image_url && (
        <div className="text-center text-sm text-muted-foreground py-2">
          ℹ️ Refer to the image in the Lesson Media section above
        </div>
      )}

      {/* Guiding questions with interactive input under EACH question */}
      {questions && questions.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700">Guiding questions:</h4>
          {questions.map((question, qIndex) => {
            const questionText = typeof question === 'string' ? question : (question.text || question.question || '');
            const studentAnswer = studentAnswers[qIndex];
            const liveAnswer = liveSessionAnswer?.[qIndex];
            
            return (
              <div key={qIndex} className="border-b pb-2">
                <div className="flex items-start gap-2 flex-wrap">
                  <p className="leading-snug mb-1 flex-grow">
                    {isEditing ? (
                      <input
                        type="text"
                        value={questionText}
                        onChange={e => onQuestionChange(qIndex, 'text', e.target.value)}
                        className="w-full border p-1 editable-content"
                      />
                    ) : (
                      <>{qIndex + 1}. {questionText}</>
                    )}
                  </p>
                  {/* Live Session: show student answer in blue for teacher view */}
                  {viewMode === 'teacher' && liveAnswer !== undefined && (
                    <span className="text-blue-600 font-medium text-sm">
                      [Student: {liveAnswer}]
                    </span>
                  )}
                </div>
                
                {/* Interactive answer input under each question */}
                {isInteractive && (
                  <div className="ml-4 mt-1">
                    <Input
                      value={studentAnswer || ''}
                      onChange={(e) => onAnswerChange?.(qIndex, e.target.value)}
                      placeholder="Your answer..."
                      className="h-10"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* If no guiding questions, show single description field */}
      {isInteractive && (!questions || questions.length === 0) && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">Describe the image:</h4>
          <Input
            value={studentAnswers[0] || ''}
            onChange={(e) => onAnswerChange?.(0, e.target.value)}
            placeholder="Write your description here..."
            className="h-10"
          />
        </div>
      )}
    </div>
  );
};

export default ExerciseDescribe;
