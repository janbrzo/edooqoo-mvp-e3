import React from 'react';
import { InteractiveExerciseProps } from "@/types/interactiveHomework";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface Statement {
  text: string;
  isTrue: boolean;
}

interface ExerciseTrueFalseAudioProps extends Partial<InteractiveExerciseProps> {
  statements?: Statement[];
  audio_url?: string;
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onStatementChange: (sIndex: number, field: string, value: any) => void;
  liveSessionAnswer?: Record<number, any>;
}

const ExerciseTrueFalseAudio: React.FC<ExerciseTrueFalseAudioProps> = ({
  statements = [],
  audio_url,
  isEditing,
  viewMode,
  onStatementChange,
  liveSessionAnswer,
  // Interactive props
  isInteractive = false,
  studentAnswers = {},
  onAnswerChange,
  showCorrectAnswers = false
}) => {
  return (
    <div className="space-y-4">
      {!audio_url && (
        <div className="text-center text-sm text-muted-foreground py-2 bg-blue-50 border border-blue-200 rounded-lg mb-4">
          🎧 Listen to the audio in the Lesson Media section above before answering
        </div>
      )}
      
      <div className="space-y-2">
        {statements.map((statement, sIndex) => {
          const studentAnswer = studentAnswers[sIndex];
          const isCorrect = showCorrectAnswers && studentAnswer !== undefined && studentAnswer === statement.isTrue;
          const isIncorrect = showCorrectAnswers && studentAnswer !== undefined && studentAnswer !== statement.isTrue;

          return (
            <div key={sIndex} className="border-b pb-2">
              <div className="flex flex-col gap-2">
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
                {isInteractive ? (
                  <RadioGroup
                    value={studentAnswer === true ? 'true' : studentAnswer === false ? 'false' : ''}
                    onValueChange={(value) => onAnswerChange?.(sIndex, value === 'true')}
                    className="flex gap-4"
                  >
                    <div className={`flex items-center space-x-2 ${isCorrect && studentAnswer === true ? 'text-green-600' : isIncorrect && studentAnswer === true ? 'text-red-600' : ''}`}>
                      <RadioGroupItem value="true" id={`true-${sIndex}`} />
                      <Label htmlFor={`true-${sIndex}`}>True</Label>
                    </div>
                    <div className={`flex items-center space-x-2 ${isCorrect && studentAnswer === false ? 'text-green-600' : isIncorrect && studentAnswer === false ? 'text-red-600' : ''}`}>
                      <RadioGroupItem value="false" id={`false-${sIndex}`} />
                      <Label htmlFor={`false-${sIndex}`}>False</Label>
                    </div>
                  </RadioGroup>
                ) : (
                  <div className="ml-4 flex items-center space-x-4">
                    {/* Show radio buttons for all views (including Teacher View and Live Session) */}
                    <div className="flex space-x-4">
                      <label className={`inline-flex items-center ${
                        liveSessionAnswer?.[sIndex] === true ? 'bg-blue-100 px-2 py-1 rounded' : ''
                      }`}>
                        <input 
                          type="radio" 
                          name={`statement-audio-${sIndex}`} 
                          className="form-radio h-4 w-4" 
                          disabled={true}
                          checked={statement.isTrue === true}
                        />
                        <span className="ml-2">True</span>
                        {liveSessionAnswer?.[sIndex] === true && (
                          <span className="ml-1 text-blue-600 font-medium text-xs">(Student)</span>
                        )}
                      </label>
                      <label className={`inline-flex items-center ${
                        liveSessionAnswer?.[sIndex] === false ? 'bg-blue-100 px-2 py-1 rounded' : ''
                      }`}>
                        <input 
                          type="radio" 
                          name={`statement-audio-${sIndex}`} 
                          className="form-radio h-4 w-4"
                          disabled={true}
                          checked={statement.isTrue === false}
                        />
                        <span className="ml-2">False</span>
                        {liveSessionAnswer?.[sIndex] === false && (
                          <span className="ml-1 text-blue-600 font-medium text-xs">(Student)</span>
                        )}
                      </label>
                    </div>
                    {viewMode === 'teacher' && (
                      <span className="text-green-600 italic text-sm">
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
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ExerciseTrueFalseAudio;
