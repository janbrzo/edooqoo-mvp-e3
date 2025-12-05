
import React from "react";
import { InteractiveExerciseProps } from "@/types/interactiveHomework";

interface ExerciseReadingProps extends Partial<InteractiveExerciseProps> {
  questions: any[];
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onQuestionChange: (qIndex: number, field: string, value: string) => void;
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
  showCorrectAnswers = false
}) => (
  <div className="space-y-0.5">
    {questions.map((question, qIndex) => {
      const studentAnswer = studentAnswers[qIndex] || '';
      
      return (
        <div key={qIndex} className="border-b pb-1">
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
              <textarea
                value={studentAnswer}
                onChange={(e) => onAnswerChange?.(qIndex, e.target.value)}
                onBlur={(e) => onAnswerChange?.(qIndex, e.target.value)}
                placeholder="Type your answer..."
                className="w-full border p-2 rounded min-h-[60px]"
                rows={2}
              />
            )}
            {(viewMode === 'teacher' || showCorrectAnswers) && (
              <div className="text-green-600 italic text-sm">
                {isEditing ? (
                  <input
                    type="text"
                    value={question.answer}
                    onChange={e => onQuestionChange(qIndex, 'answer', e.target.value)}
                    className="border p-1 editable-content w-full"
                  />
                ) : (
                  <span>Suggested answer: {question.answer}</span>
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
