import React from "react";

interface ExerciseGapTextProps {
  sentences: any[];
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onSentenceChange: (sIndex: number, field: string, value: string) => void;
}

const ExerciseGapText: React.FC<ExerciseGapTextProps> = ({
  sentences = [],
  isEditing,
  viewMode,
  onSentenceChange
}) => {
  if (!sentences || sentences.length === 0) {
    return <div className="text-gray-500 italic">No sentences available for this exercise.</div>;
  }

  return (
    <div className="space-y-0.5">
      {sentences.map((sentence, sIndex) => (
        <div key={sIndex} className="border-b pb-1">
          <div className="flex flex-row items-start">
            <div className="flex-grow">
              <p className="leading-snug">
                {isEditing ? (
                  <input
                    type="text"
                    value={sentence?.text || ''}
                    onChange={e => onSentenceChange(sIndex, 'text', e.target.value)}
                    className="w-full border p-1 editable-content"
                  />
                ) : (
                  <>{sIndex + 1}. {(sentence?.text || 'Missing text').replace(/_+/g, "_______________")}</>
                )}
              </p>
            </div>
            {viewMode === 'teacher' && (
              <div className="text-green-600 italic ml-3 text-sm">
                {isEditing ? (
                  <input
                    type="text"
                    value={sentence?.answer || ''}
                    onChange={e => onSentenceChange(sIndex, 'answer', e.target.value)}
                    className="border p-1 editable-content w-full"
                  />
                ) : (
                  <span>({sentence?.answer || 'No answer'})</span>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ExerciseGapText;