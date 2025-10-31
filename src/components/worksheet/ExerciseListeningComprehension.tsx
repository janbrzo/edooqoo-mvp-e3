import React from 'react';

interface ExerciseListeningComprehensionProps {
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
  onQuestionChange
}) => {
  return (
    <div className="space-y-4">
      {!audio_url && (
        <div className="text-center text-sm text-muted-foreground py-2 bg-blue-50 border border-blue-200 rounded-lg">
          🎧 Listen to the audio in the Lesson Media section above before answering
        </div>
      )}
      
      <div className="space-y-4">
        {questions.map((q, qIndex) => (
          <div key={qIndex} className="border-b pb-3">
            <p className="font-medium text-gray-800 mb-2">
              {isEditing ? (
                <input
                  type="text"
                  value={q.text}
                  onChange={e => onQuestionChange(qIndex, 'text', e.target.value)}
                  className="w-full border p-2 rounded editable-content"
                />
              ) : (
                <>{qIndex + 1}. {q.text}</>
              )}
            </p>
            
            {viewMode === 'teacher' && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-800 mb-1">Answer:</p>
                {isEditing ? (
                  <textarea
                    value={q.answer}
                    onChange={e => onQuestionChange(qIndex, 'answer', e.target.value)}
                    className="w-full border p-2 rounded text-sm editable-content"
                    rows={2}
                  />
                ) : (
                  <p className="text-sm text-gray-700">{q.answer}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExerciseListeningComprehension;
