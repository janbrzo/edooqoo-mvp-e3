import React from 'react';

interface Question {
  question: string;
  focus: string;
}

interface ExerciseAnswerQuestionsAudioProps {
  questions?: Question[];
  audio_url?: string;
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onQuestionChange: (qIndex: number, field: string, value: string) => void;
}

const ExerciseAnswerQuestionsAudio: React.FC<ExerciseAnswerQuestionsAudioProps> = ({
  questions = [],
  audio_url,
  isEditing,
  viewMode,
  onQuestionChange
}) => {
  return (
    <div className="space-y-4">
      {!audio_url && (
        <div className="text-center text-sm text-muted-foreground py-2 bg-blue-50 border border-blue-200 rounded-lg mb-4">
          🎧 Listen to the audio in the Lesson Media section above before answering
        </div>
      )}
      
      <div className="space-y-4">
        {questions.map((q, qIndex) => (
          <div key={qIndex} className="border-b pb-4">
            <p className="font-medium text-gray-800 mb-2">
              {isEditing ? (
                <input
                  type="text"
                  value={q.question}
                  onChange={e => onQuestionChange(qIndex, 'question', e.target.value)}
                  className="w-full border p-2 rounded editable-content"
                />
              ) : (
                <>{qIndex + 1}. {q.question}</>
              )}
            </p>
            
            {viewMode === 'teacher' && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-800 mb-1">Focus:</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={q.focus}
                    onChange={e => onQuestionChange(qIndex, 'focus', e.target.value)}
                    className="w-full border p-2 rounded text-sm editable-content"
                  />
                ) : (
                  <p className="text-sm text-gray-700 italic">{q.focus}</p>
                )}
              </div>
            )}
            
            {viewMode === 'student' && (
              <div className="mt-3">
                <textarea
                  placeholder="Your answer..."
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm min-h-[80px] focus:outline-none focus:border-worksheet-purple"
                  rows={3}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExerciseAnswerQuestionsAudio;
