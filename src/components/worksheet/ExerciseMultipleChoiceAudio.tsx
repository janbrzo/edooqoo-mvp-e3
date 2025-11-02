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
    <div>
      {!audio_url && (
        <div className="text-center text-sm text-muted-foreground py-2 bg-blue-50 border border-blue-200 rounded-lg mb-4">
          🎧 Listen to the audio in the Lesson Media section above before answering
        </div>
      )}
      
      <div className="space-y-2">
        {questions.map((question, qIndex) => (
          <div key={qIndex} className="border-b pb-2 multiple-choice-question">
            <p className="font-medium mb-1 leading-snug">
              {isEditing ? (
                <input
                  type="text"
                  value={question.text}
                  onChange={e => onQuestionChange(qIndex, 'text', e.target.value)}
                  className="w-full border p-1 editable-content"
                />
              ) : (
                <>{qIndex + 1}. {question.text}</>
              )}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
              {question.options?.map((option: any, oIndex: number) => (
                <div
                  key={oIndex}
                  className={`
                    p-2 border rounded-md flex items-center gap-2 multiple-choice-option
                    ${viewMode === 'teacher' && option.correct ? 'bg-green-50 border-green-200' : 'bg-white'}
                  `}
                >
                  <div
                    className={`
                      w-5 h-5 rounded-md border flex items-center justify-center option-icon
                      ${viewMode === 'teacher' && option.correct ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'}
                    `}
                  >
                    {viewMode === 'teacher' && option.correct && <span>✓</span>}
                  </div>
                  <span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={option.text}
                        onChange={e => {
                          const newOptions = [...question.options];
                          newOptions[oIndex] = { ...option, text: e.target.value };
                          onQuestionChange(qIndex, 'options', newOptions);
                        }}
                        className="border p-1 editable-content ml-1"
                      />
                    ) : (
                      <>{option.label}. {option.text}</>
                    )}
                  </span>
                  {isEditing && (
                    <input
                      type="checkbox"
                      checked={option.correct}
                      onChange={e => {
                        const newOptions = [...question.options];
                        newOptions[oIndex] = { ...option, correct: e.target.checked };
                        onQuestionChange(qIndex, 'options', newOptions);
                      }}
                      className="ml-auto"
                    />
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
