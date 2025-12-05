
import React from "react";
import { InteractiveExerciseProps } from "@/types/interactiveHomework";
import { Input } from "@/components/ui/input";

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
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {questions.map((question, qIndex) => {
      const studentAnswer = studentAnswers[qIndex] || '';
      const hasNoAnswer = showCorrectAnswers && !studentAnswer;
      
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
                onBlur={(e) => onAnswerChange?.(qIndex, e.target.value)}
                placeholder="Type your answer..."
                className={`h-10 ${hasNoAnswer ? 'border-2 border-red-400 bg-red-100' : ''}`}
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
