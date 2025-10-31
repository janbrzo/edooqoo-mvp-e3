import React from 'react';

interface ExerciseFillInBlanksAudioProps {
  transcript_with_blanks?: string;
  answers?: string[];
  full_transcript?: string;
  audio_url?: string;
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onTranscriptChange?: (value: string) => void;
  onAnswersChange?: (answers: string[]) => void;
}

const ExerciseFillInBlanksAudio: React.FC<ExerciseFillInBlanksAudioProps> = ({
  transcript_with_blanks = "",
  answers = [],
  full_transcript = "",
  audio_url,
  isEditing,
  viewMode,
  onTranscriptChange,
  onAnswersChange
}) => {
  // Split transcript by [blank] markers
  const parts = transcript_with_blanks.split(/\[blank\]/gi);
  
  return (
    <div className="space-y-4">
      {!audio_url && (
        <div className="text-center text-sm text-muted-foreground py-2 bg-blue-50 border border-blue-200 rounded-lg">
          🎧 Listen to the audio carefully and fill in the missing words
        </div>
      )}
      
      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Transcript with blanks:</label>
            <textarea
              value={transcript_with_blanks}
              onChange={e => onTranscriptChange?.(e.target.value)}
              className="w-full border p-3 rounded editable-content font-mono text-sm"
              rows={6}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Answers (comma-separated):</label>
            <input
              type="text"
              value={answers.join(', ')}
              onChange={e => onAnswersChange?.(e.target.value.split(',').map(s => s.trim()))}
              className="w-full border p-2 rounded editable-content"
            />
          </div>
        </div>
      ) : (
        <>
          <div className="p-4 bg-gray-50 rounded-lg border">
            <div className="space-y-2 text-sm leading-relaxed">
              {parts.map((part, index) => (
                <span key={index}>
                  {part}
                  {index < answers.length && (
                    <span className="inline-block mx-1">
                      <input
                        type="text"
                        placeholder="___________"
                        className="border-b-2 border-worksheet-purple bg-transparent px-2 py-1 text-center focus:outline-none focus:border-worksheet-purple/70"
                        style={{ width: '120px' }}
                      />
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
          
          {viewMode === 'teacher' && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="font-medium text-green-800 mb-2">Answers:</p>
              <div className="flex flex-wrap gap-2">
                {answers.map((answer, index) => (
                  <span key={index} className="bg-white px-3 py-1 rounded-full text-sm font-medium border">
                    {index + 1}. {answer}
                  </span>
                ))}
              </div>
              
              {full_transcript && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700">
                    Show Full Transcript
                  </summary>
                  <p className="mt-2 text-sm text-gray-700 leading-relaxed">
                    {full_transcript}
                  </p>
                </details>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ExerciseFillInBlanksAudio;
