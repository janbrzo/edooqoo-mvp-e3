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
    <div className="space-y-4">
      <h3 className="font-medium text-gray-700 mb-3">Which word does NOT belong?</h3>
      {questions.map((question: any, qIndex: number) => (
        <div key={qIndex} className="p-4 border rounded-lg bg-gray-50">
          <div className="mb-3">
            <strong>Question {qIndex + 1}:</strong>
            {isEditing ? (
              <input
                type="text"
                value={question.instruction || `Which word does NOT belong in set ${qIndex + 1}?`}
                onChange={e => onQuestionChange(qIndex, 'instruction', e.target.value)}
                className="w-full mt-1 border p-2 editable-content"
                placeholder="Question instruction"
              />
            ) : (
              <span className="ml-2">{question.instruction || `Which word does NOT belong in set ${qIndex + 1}?`}</span>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
            {question.options?.map((option: string, oIndex: number) => (
              <div key={oIndex} className="flex items-center">
                <span className="mr-2 font-medium">{String.fromCharCode(65 + oIndex)})</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={option}
                    onChange={e => handleOptionChange(qIndex, oIndex, e.target.value)}
                    className="flex-1 border p-1 editable-content"
                    placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                  />
                ) : (
                  <span>{option}</span>
                )}
              </div>
            ))}
          </div>

          {viewMode === 'teacher' && (
            <div className="mt-3 p-2 bg-blue-50 rounded border-l-4 border-blue-400">
              <strong className="text-blue-700">Answer:</strong>
              {isEditing ? (
                <input
                  type="text"
                  value={question.correct_answer}
                  onChange={e => handleCorrectAnswerChange(qIndex, e.target.value)}
                  className="ml-2 border p-1 bg-white editable-content"
                  placeholder="Correct answer (e.g., D)"
                />
              ) : (
                <span className="ml-2 text-blue-700 font-medium">{question.correct_answer}</span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ExerciseOddOneOut;