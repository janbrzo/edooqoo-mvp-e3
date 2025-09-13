import React from "react";

interface ExerciseErrorCorrectionProps {
  sentences: any[];
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onSentenceChange: (sIndex: number, field: string, value: string) => void;
}

const ExerciseErrorCorrection: React.FC<ExerciseErrorCorrectionProps> = ({
  sentences, isEditing, viewMode, onSentenceChange
}) => {
  return (
    <div>
      <div className="space-y-3">
        {sentences.map((sentence, sIndex) => (
          <div key={sIndex} className="border-b pb-2">
            <div className="flex items-center gap-3">
              <span className="font-medium">{sIndex + 1}.</span>
              
              {isEditing ? (
                <input
                  type="text"
                  value={sentence.incorrect}
                  onChange={e => onSentenceChange(sIndex, 'incorrect', e.target.value)}
                  className="flex-grow border p-1 editable-content"
                />
              ) : (
                <span className="flex-grow">{sentence.incorrect}</span>
              )}
              
              {viewMode === 'teacher' && (
                <div className="text-green-600 italic text-sm">
                  {isEditing ? (
                    <input
                      type="text"
                      value={sentence.correct}
                      onChange={e => onSentenceChange(sIndex, 'correct', e.target.value)}
                      className="border p-1 editable-content w-48"
                    />
                  ) : (
                    <span>✓ {sentence.correct}</span>
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

export default ExerciseErrorCorrection;