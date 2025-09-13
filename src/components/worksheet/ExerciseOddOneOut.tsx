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
    <div>
      <div className="space-y-3">
        {questions.map((question, qIndex) => (
          <div key={qIndex} className="border-b pb-2">
            <div className="flex items-center gap-3">
              <span className="font-medium">{qIndex + 1}.</span>
              
              <div className="flex flex-wrap gap-2 flex-grow">
                {question.options?.map((option: string, oIndex: number) => (
                  <div key={oIndex} className="border rounded px-3 py-1 text-center bg-gray-50">
                    {isEditing ? (
                      <input
                        type="text"
                        value={option}
                        onChange={e => handleOptionChange(qIndex, oIndex, e.target.value)}
                        className="w-16 border-0 bg-transparent text-center editable-content"
                      />
                    ) : (
                      <span>{option}</span>
                    )}
                  </div>
                ))}
              </div>

              {viewMode === 'teacher' && (
                <div className="text-green-600 italic text-sm">
                  {isEditing ? (
                    <input
                      type="text"
                      value={question.correct_answer || ''}
                      onChange={e => handleCorrectAnswerChange(qIndex, e.target.value)}
                      className="border p-1 editable-content w-20"
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
    </div>
  );
};

export default ExerciseOddOneOut;