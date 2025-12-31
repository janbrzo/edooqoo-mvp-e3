
import React from "react";
import { InteractiveExerciseProps } from "@/types/interactiveHomework";
import { Input } from "@/components/ui/input";

interface ExerciseReadingProps extends Partial<InteractiveExerciseProps> {
  questions: any[];
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onQuestionChange: (qIndex: number, field: string, value: string) => void;
  // PROBLEM 1: Live Session answer prop for displaying student answers in blue
  liveSessionAnswer?: Record<number, any>;
  disabled?: boolean;
}

const ExerciseReading: React.FC<ExerciseReadingProps> = ({
  questions, 
  isEditing, 
  viewMode, 
  onQuestionChange,
  // Interactive props
  isInteractive = false,
  studentAnswers = {},
  onAnswerChange,
  showCorrectAnswers = false,
  // PROBLEM 1: Live Session
  liveSessionAnswer,
  disabled = false
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
    {questions.map((question, qIndex) => {
      const studentAnswer = studentAnswers[qIndex] || '';
      const isEmpty = showCorrectAnswers && !studentAnswer;
      const liveAnswer = liveSessionAnswer?.[qIndex];
      
      return (
        <div key={qIndex} className="border rounded-lg p-3 bg-white">
          <div className="flex flex-col gap-2">
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
            {isInteractive && (
              <Input
                value={studentAnswer}
                onChange={(e) => onAnswerChange?.(qIndex, e.target.value)}
                placeholder="Type your answer..."
                disabled={disabled}
                className={`h-10 
                  ${isEmpty ? 'bg-red-100 border-2 border-red-400' : ''}
                  ${disabled ? 'bg-muted cursor-not-allowed opacity-70' : ''}
                `}
              />
            )}
            {(viewMode === 'teacher' || showCorrectAnswers) && (
              <div className="flex items-center gap-3">
                <span className="text-green-600 italic text-sm">
                  {isEditing ? (
                    <input
                      type="text"
                      value={question.answer}
                      onChange={e => onQuestionChange(qIndex, 'answer', e.target.value)}
                      className="border p-1 editable-content w-full"
                    />
                  ) : (
                    <>Suggested answer: {question.answer}</>
                  )}
                </span>
                {/* PROBLEM 1: Display live session answer in blue */}
                {liveAnswer && (
                  <span className="text-blue-600 font-medium text-sm">
                    [Student: {liveAnswer}]
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      );
    })}
  </div>
);

export default ExerciseReading;
