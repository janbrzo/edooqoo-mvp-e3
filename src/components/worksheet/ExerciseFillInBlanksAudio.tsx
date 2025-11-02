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

  // OLD STRUCTURE (backward compatibility only)
  if (!useNewStructure) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          ⚠️ This exercise uses an old data format. Please regenerate the exercise to see the updated layout.
        </p>
      </div>
    );
  }

  // This should never be reached as useNewStructure check handles it above
  return null;
};

export default ExerciseFillInBlanksAudio;
