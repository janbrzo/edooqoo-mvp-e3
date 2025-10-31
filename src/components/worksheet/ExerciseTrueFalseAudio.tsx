import React from 'react';

interface Statement {
  text: string;
  isTrue: boolean;
}

interface ExerciseTrueFalseAudioProps {
  statements?: Statement[];
  audio_url?: string;
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onStatementChange: (sIndex: number, field: string, value: any) => void;
}

const ExerciseTrueFalseAudio: React.FC<ExerciseTrueFalseAudioProps> = ({
  statements = [],
  audio_url,
  isEditing,
  viewMode,
  onStatementChange
}) => {
  return (
    <div className="space-y-4">
      {!audio_url && (
        <div className="text-center text-sm text-muted-foreground py-2 bg-blue-50 border border-blue-200 rounded-lg mb-4">
          🎧 Listen to the audio in the Lesson Media section above before answering
        </div>
      )}
      
      <div className="space-y-3">
        {statements.map((statement, sIndex) => (
          <div 
            key={sIndex} 
            className={`p-3 rounded-lg border ${
              viewMode === 'teacher'
                ? statement.isTrue
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="font-medium text-gray-700 mt-0.5">{sIndex + 1}.</span>
              {isEditing ? (
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={statement.text}
                    onChange={e => onStatementChange(sIndex, 'text', e.target.value)}
                    className="w-full border p-2 rounded editable-content"
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-sm">
                      <input
                        type="checkbox"
                        checked={statement.isTrue}
                        onChange={e => onStatementChange(sIndex, 'isTrue', e.target.checked)}
                        className="mr-2 editable-content"
                      />
                      Is True
                    </label>
                  </div>
                </div>
              ) : (
                <div className="flex-1">
                  <p className="text-sm text-gray-800">{statement.text}</p>
                  {viewMode === 'teacher' && (
                    <p className="text-sm font-medium mt-2">
                      {statement.isTrue ? (
                        <span className="text-green-700">✓ TRUE</span>
                      ) : (
                        <span className="text-red-700">✗ FALSE</span>
                      )}
                    </p>
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

export default ExerciseTrueFalseAudio;
