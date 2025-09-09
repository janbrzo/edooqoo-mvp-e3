import React from "react";

interface ExerciseOddOneOutProps {
  questions: any[];
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onQuestionChange: (qIndex: number, field: string, value: any) => void;
}

const ExerciseOddOneOut: React.FC<ExerciseOddOneOutProps> = ({
  questions, isEditing, viewMode, onQuestionChange
}) => {
  const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
    const question = questions[qIndex];
    const newOptions = [...question.options];
    newOptions[oIndex] = value;
    onQuestionChange(qIndex, 'options', newOptions);
  };

  const handleCorrectAnswerChange = (qIndex: number, value: string) => {
    onQuestionChange(qIndex, 'correct_answer', value);
  };

  return (
    <div className="space-y-0.5">
      {questions.map((question, qIndex) => (
        <div key={qIndex} className="border-b pb-1">
          <div className="flex flex-row items-start">
            <div className="flex-grow">
              <p className="font-medium leading-snug">
                {isEditing ? (
                  <input
                    type="text"
                    value={question.instruction || "Which word doesn't belong?"}
                    onChange={e => onQuestionChange(qIndex, 'instruction', e.target.value)}
                    className="w-full border p-1 editable-content"
                  />
                ) : (
                  <>{qIndex + 1}. {question.instruction || "Which word doesn't belong?"}</>
                )}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-2">
                {question.options?.map((option: string, oIndex: number) => (
                  <div key={oIndex} className="border rounded p-2 text-center bg-gray-50">
                    {isEditing ? (
                      <input
                        type="text"
                        value={option}
                        onChange={e => handleOptionChange(qIndex, oIndex, e.target.value)}
                        className="w-full border-0 bg-transparent text-center editable-content"
                      />
                    ) : (
                      <span>{option}</span>
                    )}
                  </div>
                ))}
              </div>
              {viewMode === 'student' && (
                <div className="mt-2 p-2 bg-gray-50 rounded border-dashed border-2 border-gray-300">
                  <p className="text-sm text-gray-600">Your answer: ________________</p>
                </div>
              )}
            </div>
            {viewMode === 'teacher' && (
              <div className="text-green-600 italic ml-3 text-sm">
                {isEditing ? (
                  <input
                    type="text"
                    value={question.correct_answer || ''}
                    onChange={e => handleCorrectAnswerChange(qIndex, e.target.value)}
                    className="border p-1 editable-content w-full"
                  />
                ) : (
                  <span>({question.correct_answer})</span>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ExerciseOddOneOut;