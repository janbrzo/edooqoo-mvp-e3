import React from 'react';

interface Option {
  label: string;
  text: string;
  correct: boolean;
}

interface Question {
  text: string;
  options: Option[];
}

interface ExerciseMultipleChoiceAudioProps {
  questions?: Question[];
  audio_url?: string;
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onQuestionChange: (qIndex: number, field: string, value: any) => void;
}

const ExerciseMultipleChoiceAudio: React.FC<ExerciseMultipleChoiceAudioProps> = ({
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
      
      <div className="space-y-6">
        {questions.map((q, qIndex) => (
          <div key={qIndex} className="border-b pb-4">
            <p className="font-medium text-gray-800 mb-3">
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
            
            <div className="space-y-2 pl-4">
              {q.options.map((option, oIndex) => (
                <div 
                  key={oIndex} 
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'teacher' && option.correct
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-gray-50'
                  }`}
                >
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{option.label}.</span>
                      <input
                        type="text"
                        value={option.text}
                        onChange={e => {
                          const newOptions = [...q.options];
                          newOptions[oIndex] = { ...option, text: e.target.value };
                          onQuestionChange(qIndex, 'options', newOptions);
                        }}
                        className="flex-1 border p-1 rounded editable-content"
                      />
                      <input
                        type="checkbox"
                        checked={option.correct}
                        onChange={e => {
                          const newOptions = [...q.options];
                          newOptions[oIndex] = { ...option, correct: e.target.checked };
                          onQuestionChange(qIndex, 'options', newOptions);
                        }}
                        className="editable-content"
                      />
                    </div>
                  ) : (
                    <span className="text-sm">
                      <span className="font-medium">{option.label}.</span> {option.text}
                      {viewMode === 'teacher' && option.correct && (
                        <span className="ml-2 text-green-600 font-medium">✓ Correct</span>
                      )}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExerciseMultipleChoiceAudio;
