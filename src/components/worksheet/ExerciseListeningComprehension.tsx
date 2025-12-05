import React from 'react';
import { InteractiveExerciseProps } from "@/types/interactiveHomework";
import { Input } from "@/components/ui/input";

interface ExerciseListeningComprehensionProps extends Partial<InteractiveExerciseProps> {
  questions?: Array<{ text: string; answer: string }>;
  audio_url?: string;
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onQuestionChange: (qIndex: number, field: string, value: string) => void;
}

const ExerciseListeningComprehension: React.FC<ExerciseListeningComprehensionProps> = ({
  questions = [],
  audio_url,
  isEditing,
  viewMode,
  onQuestionChange,
  // Interactive props
  isInteractive = false,
  studentAnswers = {},
  onAnswerChange,
  showCorrectAnswers = false
}) => {
  return (
    <div className="space-y-2">
      {!audio_url && (
        <div className="text-center text-sm text-muted-foreground py-2 bg-blue-50 border border-blue-200 rounded-lg mb-2">
          🎧 Listen to the audio in the Lesson Media section above before answering
        </div>
      )}
      
      {questions.map((q, qIndex) => {
        const studentAnswer = studentAnswers[qIndex] || '';
        const isEmpty = showCorrectAnswers && !studentAnswer;

        return (
          <div key={qIndex} className="border rounded-lg p-3 bg-white">
            <div className="flex flex-col gap-2">
              <div className="flex-grow">
                <p className="font-medium leading-snug">
                  {isEditing ? (
                    <input
                      type="text"
                      value={q.text}
                      onChange={e => onQuestionChange(qIndex, 'text', e.target.value)}
                      className="w-full border p-1 editable-content"
                    />
                  ) : (
                    <>{qIndex + 1}. {q.text}</>
                  )}
                </p>
              </div>
              {isInteractive && (
                <Input
                  value={studentAnswer}
                  onChange={(e) => onAnswerChange?.(qIndex, e.target.value)}
                  placeholder="Type your answer..."
                  className={`h-10 ${isEmpty ? 'bg-red-100 border-2 border-red-400' : ''}`}
                />
              )}
              {(viewMode === 'teacher' || showCorrectAnswers) && (
                <div className="text-green-600 italic text-sm">
                  {isEditing ? (
                    <input
                      type="text"
                      value={q.answer}
                      onChange={e => onQuestionChange(qIndex, 'answer', e.target.value)}
                      className="border p-1 editable-content w-full"
                    />
                  ) : (
                    <span>Suggested answer: {q.answer}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ExerciseListeningComprehension;
