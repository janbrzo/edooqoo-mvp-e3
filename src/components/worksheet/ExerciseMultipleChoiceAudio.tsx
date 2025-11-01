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
        <div className="text-center text-sm text-muted-foreground py-2 bg-blue-50 border border-blue-200 rounded-lg mb-2">
          🎧 Listen to the audio in the Lesson Media section above before answering
        </div>
      )}
      
      <div className="space-y-3">
        {questions.map((question, qIndex) => (
          <div key={qIndex} className="border-b pb-2">
            <p className="font-medium mb-1">
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
            <div className="pl-4 space-y-0.5">
              {question.options.map((option, oIndex) => (
                <div key={oIndex}>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{option.label}.</span>
                      <input
                        type="text"
                        value={option.text}
                        onChange={e => {
                          const newOptions = [...question.options];
                          newOptions[oIndex] = { ...option, text: e.target.value };
                          onQuestionChange(qIndex, 'options', newOptions);
                        }}
                        className="flex-1 border p-1 editable-content"
                      />
                      <input
                        type="checkbox"
                        checked={option.correct}
                        onChange={e => {
                          const newOptions = [...question.options];
                          newOptions[oIndex] = { ...option, correct: e.target.checked };
                          onQuestionChange(qIndex, 'options', newOptions);
                        }}
                      />
                    </div>
                  ) : (
                    <div className={viewMode === 'teacher' && option.correct ? 'text-green-600 font-medium' : ''}>
                      <span className="font-medium">{option.label}.</span> {option.text}
                    </div>
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
