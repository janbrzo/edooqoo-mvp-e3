import React from 'react';

interface ExerciseFillInBlanksAudioProps {
  word_bank?: string[];
  sentences?: any[];
  transcript_with_blanks?: string;
  answers?: string[];
  audio_url?: string;
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onTranscriptChange?: (value: string) => void;
  onAnswersChange?: (value: string) => void;
  onWordBankChange?: (wIndex: number, value: string) => void;
  onSentenceChange?: (sIndex: number, field: string, value: string) => void;
}

const ExerciseFillInBlanksAudio: React.FC<ExerciseFillInBlanksAudioProps> = ({
  word_bank,
  sentences,
  transcript_with_blanks = "",
  answers = [],
  audio_url,
  isEditing,
  viewMode,
  onTranscriptChange,
  onAnswersChange,
  onWordBankChange,
  onSentenceChange
}) => {
  // Use new structure if available, fallback to old
  const useNewStructure = sentences && sentences.length > 0;

  // NEW STRUCTURE (sentences + word_bank) - like basic Fill in Blanks
  if (useNewStructure) {
    return (
      <div>
        {!audio_url && (
          <div className="text-center text-sm text-muted-foreground py-2 bg-blue-50 border border-blue-200 rounded-lg mb-4">
            🎧 Listen to the audio in the Lesson Media section above before answering
          </div>
        )}
        
        {word_bank && (
          <div className="mb-4 p-3 bg-worksheet-purpleLight rounded-md word-bank-container">
            <p className="font-medium mb-2">Word Bank:</p>
            <div className="flex flex-wrap gap-2">
              {word_bank.map((word, wIndex) => (
                <span key={wIndex} className="bg-white px-2 py-1 rounded-md text-sm">
                  {isEditing && onWordBankChange ? (
                    <input
                      type="text"
                      value={word}
                      onChange={e => onWordBankChange(wIndex, e.target.value)}
                      className="border-0 bg-transparent p-0 w-full focus:outline-none focus:ring-0"
                    />
                  ) : word}
                </span>
              ))}
            </div>
          </div>
        )}
        
        <div className="space-y-0.5">
          {sentences!.map((sentence, sIndex) => (
            <div key={sIndex} className="border-b pb-1">
              <div className="flex flex-row items-start">
                <div className="flex-grow">
                  <p className="leading-snug">
                    {isEditing && onSentenceChange ? (
                      <input
                        type="text"
                        value={sentence.text}
                        onChange={e => onSentenceChange(sIndex, 'text', e.target.value)}
                        className="w-full border p-1 editable-content"
                      />
                    ) : (
                      <>{sIndex + 1}. {sentence.text.replace(/_+/g, "_______________")}</>
                    )}
                  </p>
                </div>
                {viewMode === 'teacher' && (
                  <div className="text-green-600 italic ml-3 text-sm">
                    {isEditing && onSentenceChange ? (
                      <input
                        type="text"
                        value={sentence.answer}
                        onChange={e => onSentenceChange(sIndex, 'answer', e.target.value)}
                        className="border p-1 editable-content w-full"
                      />
                    ) : (
                      <span>({sentence.answer})</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // OLD STRUCTURE (transcript_with_blanks) - backward compatibility
  return (
    <div className="space-y-4">
      {!audio_url && (
        <div className="text-center text-sm text-muted-foreground py-2 bg-blue-50 border border-blue-200 rounded-lg mb-4">
          🎧 Listen to the audio in the Lesson Media section above before answering
        </div>
      )}

      {isEditing ? (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">
              Transcript with Blanks (use [blank] for gaps):
            </label>
            <textarea
              value={transcript_with_blanks}
              onChange={e => onTranscriptChange && onTranscriptChange(e.target.value)}
              className="w-full border p-2 rounded min-h-[150px] editable-content"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Answers (comma-separated):
            </label>
            <input
              type="text"
              value={answers.join(', ')}
              onChange={e => onAnswersChange && onAnswersChange(e.target.value)}
              className="w-full border p-2 rounded editable-content"
            />
          </div>
        </>
      ) : (
        <>
          {viewMode === 'student' ? (
            <div className="space-y-3">
              {transcript_with_blanks.split('[blank]').map((part, index, arr) => (
                <span key={index}>
                  {part}
                  {index < arr.length - 1 && (
                    <input
                      type="text"
                      className="inline-block mx-1 border-b-2 border-gray-400 w-32 px-1 focus:border-worksheet-purple focus:outline-none"
                      placeholder="..."
                    />
                  )}
                </span>
              ))}
            </div>
          ) : (
            <>
              <div className="space-y-2 p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="font-medium text-sm text-green-800">Answers:</p>
                <div className="flex flex-wrap gap-2">
                  {answers.map((answer, idx) => (
                    <span key={idx} className="bg-white px-2 py-1 rounded text-sm font-medium">
                      {idx + 1}. {answer}
                    </span>
                  ))}
                </div>
              </div>
              
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-worksheet-purple">
                  Show Full Transcript
                </summary>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg border text-sm">
                  {transcript_with_blanks.replace(/\[blank\]/g, () => {
                    const answer = answers.shift();
                    return answer ? `[${answer}]` : '[___]';
                  })}
                </div>
              </details>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ExerciseFillInBlanksAudio;
