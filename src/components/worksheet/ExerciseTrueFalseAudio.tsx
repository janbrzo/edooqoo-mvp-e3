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
      
      <div className="space-y-2">
        {statements.map((statement, sIndex) => (
          <div key={sIndex} className="border-b pb-2">
            <div className="flex flex-row items-start">
              <div className="flex-grow">
                <p className="leading-snug">
                  {isEditing ? (
                    <input
                      type="text"
                      value={statement.text}
                      onChange={e => onStatementChange(sIndex, 'text', e.target.value)}
                      className="w-full border p-1 editable-content"
                    />
                  ) : (
                    <>{sIndex + 1}. {statement.text}</>
                  )}
                </p>
              </div>
              <div className="ml-4 flex space-x-4">
                {viewMode === 'student' ? (
                  <div className="flex space-x-4">
                    <label className="inline-flex items-center">
                      <input type="radio" name={`statement-audio-${sIndex}`} className="form-radio h-4 w-4" disabled={!isEditing} />
                      <span className="ml-2">True</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input type="radio" name={`statement-audio-${sIndex}`} className="form-radio h-4 w-4" disabled={!isEditing} />
                      <span className="ml-2">False</span>
                    </label>
                  </div>
                ) : (
                  <div className="text-green-600 italic ml-3 text-sm">
                    {isEditing ? (
                      <select
                        value={statement.isTrue ? "true" : "false"}
                        onChange={e => onStatementChange(sIndex, 'isTrue', e.target.value === "true")}
                        className="border p-1 editable-content"
                      >
                        <option value="true">True</option>
                        <option value="false">False</option>
                      </select>
                    ) : (
                      <span>({statement.isTrue ? "True" : "False"})</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExerciseTrueFalseAudio;
