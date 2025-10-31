import React from "react";

interface ExerciseOddOneOutProps {
  questions: any[];
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onQuestionChange: (qIndex: number, field: string, value: any) => void;
}

const ExerciseOddOneOut: React.FC<ExerciseOddOneOutProps> = ({
  questions = [], isEditing, viewMode, onQuestionChange
}) => {
  // Randomize options for student view (not in edit mode or teacher view)
  const questionsWithShuffledOptions = React.useMemo(() => {
    if (isEditing || viewMode === 'teacher') {
      return questions; // Don't shuffle in edit mode or teacher view
    }
    
    return questions.map(question => {
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
  }, [questions, isEditing, viewMode]);
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
        {questionsWithShuffledOptions.map((question, qIndex) => (
          <div key={qIndex} className="border-b pb-2">
            <div className="flex items-center gap-3">
              <span className="font-medium">{qIndex + 1}.</span>
              
              <div className="flex flex-wrap gap-2 flex-grow">
                {(question?.options || []).map((option: string, oIndex: number) => (
                  <div key={oIndex} className="border rounded px-3 py-1 text-center bg-gray-50">
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
                ))}
              </div>

              {viewMode === 'teacher' && (
                <div className="text-green-600 italic text-sm">
                  {isEditing ? (
                    <input
                      type="text"
                      value={question?.correct_answer || ''}
                      onChange={e => handleCorrectAnswerChange(qIndex, e.target.value)}
                      className="border p-1 editable-content w-20"
                    />
                  ) : (
                    <span>({question?.correct_answer || 'No answer'})</span>
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