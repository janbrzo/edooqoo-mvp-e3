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
    <div className="space-y-0.5">
      {!audio_url && (
        <div className="text-center text-sm text-muted-foreground py-2 bg-blue-50 border border-blue-200 rounded-lg mb-2">
          🎧 Listen to the audio in the Lesson Media section above before answering
        </div>
      )}
      
      {questions.map((q, qIndex) => (
        <div key={qIndex} className="border-b pb-1">
          <div className="flex flex-row items-start">
            <div className="flex-grow">
              <p className="font-medium leading-snug">
                {isEditing ? (
                  <input
                    type="text"
                    value={q.question}
                    onChange={e => onQuestionChange(qIndex, 'question', e.target.value)}
                    className="w-full border p-1 editable-content"
                  />
                ) : (
                  <>{qIndex + 1}. {q.question}</>
                )}
              </p>
            </div>
            {viewMode === 'teacher' && (
              <div className="text-green-600 italic ml-3 text-sm">
                {isEditing ? (
                  <input
                    type="text"
                    value={q.focus}
                    onChange={e => onQuestionChange(qIndex, 'focus', e.target.value)}
                    className="border p-1 editable-content w-full"
                  />
                ) : (
                  <span>Focus: {q.focus}</span>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ExerciseAnswerQuestionsAudio;
