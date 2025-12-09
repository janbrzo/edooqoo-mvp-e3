import React, { useRef, useEffect } from "react";
import { InteractiveExerciseProps } from "@/types/interactiveHomework";

interface ExerciseOddOneOutProps extends Partial<InteractiveExerciseProps> {
  questions: any[];
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onQuestionChange: (qIndex: number, field: string, value: any) => void;
}

const ExerciseOddOneOut: React.FC<ExerciseOddOneOutProps> = ({
  questions = [], 
  isEditing, 
  viewMode, 
  onQuestionChange,
  // Interactive props
  isInteractive = false,
  studentAnswers = {},
  onAnswerChange,
  showCorrectAnswers = false
}) => {
  // CRITICAL FIX: Use useRef to store shuffled options ONCE and never reshuffle
  // This prevents the shuffle from happening on every re-render when student clicks
  const shuffledQuestionsRef = useRef<any[] | null>(null);
  const questionsKeyRef = useRef<string>('');
  
  // Create a stable key based on questions structure (not the options order)
  const currentQuestionsKey = JSON.stringify(questions.map(q => ({
    options: q.options?.length || 0,
    correct: q.correct_answer
  })));
  
  // Only shuffle on initial mount or if questions structure actually changes
  if (!isEditing && (shuffledQuestionsRef.current === null || questionsKeyRef.current !== currentQuestionsKey)) {
    questionsKeyRef.current = currentQuestionsKey;
    shuffledQuestionsRef.current = questions.map(question => {
      if (!question.options || question.options.length === 0) return question;
      
      // Fisher-Yates shuffle for options
      const shuffled = [...question.options];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      
      return {
        ...question,
        options: shuffled
      };
    });
  }
  
  // Use original questions in edit mode, shuffled otherwise
  const questionsWithShuffledOptions = isEditing ? questions : (shuffledQuestionsRef.current || questions);

  const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
    const question = questions[qIndex];
    if (!question) return;
    const newOptions = [...(question.options || [])];
    newOptions[oIndex] = value;
    onQuestionChange(qIndex, 'options', newOptions);
  };

  const handleCorrectAnswerChange = (qIndex: number, value: string) => {
    onQuestionChange(qIndex, 'correct_answer', value);
  };

  if (!questions || questions.length === 0) {
    return <div className="text-gray-500 italic">No questions available for this exercise.</div>;
  }

  return (
    <div>
      <div className="space-y-3">
        {questionsWithShuffledOptions.map((question, qIndex) => {
          const selectedAnswer = studentAnswers[qIndex];
          const correctAnswer = question?.correct_answer;
          const hasAnswered = selectedAnswer !== undefined;
          const isEmpty = showCorrectAnswers && !hasAnswered;

          return (
            <div key={qIndex} className="border-b pb-2">
              <div className="flex items-center gap-3">
                <span className="font-medium">{qIndex + 1}.</span>
                
                <div className="flex flex-wrap gap-2 flex-grow">
                  {(question?.options || []).map((option: string, oIndex: number) => {
                    const isSelected = isInteractive && selectedAnswer === option;
                    const showAsCorrect = showCorrectAnswers && option === correctAnswer;
                    const showAsIncorrect = showCorrectAnswers && isSelected && option !== correctAnswer;

                    return (
                      <div 
                        key={oIndex} 
                        onClick={() => isInteractive && onAnswerChange?.(qIndex, option)}
                        className={`
                          border rounded px-3 py-1 text-center
                          ${isInteractive ? 'cursor-pointer hover:bg-gray-100' : 'bg-gray-50'}
                          ${isSelected && !showCorrectAnswers ? 'bg-blue-100 border-blue-500' : ''}
                          ${showAsCorrect ? 'bg-green-200 border-2 border-green-600' : ''}
                          ${showAsIncorrect ? 'bg-red-200 border-2 border-red-600' : ''}
                          ${isEmpty ? 'border-red-400' : ''}
                        `}
                      >
                        {isEditing ? (
                          <input
                            type="text"
                            value={option || ''}
                            onChange={e => handleOptionChange(qIndex, oIndex, e.target.value)}
                            className="w-16 border-0 bg-transparent text-center editable-content"
                          />
                        ) : (
                          <span>{option || 'Option'}</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {(viewMode === 'teacher' || showCorrectAnswers) && (
                  <div className="text-green-600 italic text-sm">
                    {isEditing ? (
                      <input
                        type="text"
                        value={correctAnswer || ''}
                        onChange={e => handleCorrectAnswerChange(qIndex, e.target.value)}
                        className="border p-1 editable-content w-20"
                      />
                    ) : (
                      <span>({correctAnswer || 'No answer'})</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ExerciseOddOneOut;
