import React from "react";

interface ExerciseMatchingHalvesProps {
  sentence_halves: any[];
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onHalvesChange: (hIndex: number, field: string, value: any) => void;
}

const ExerciseMatchingHalves: React.FC<ExerciseMatchingHalvesProps> = ({
  sentence_halves, isEditing, viewMode, onHalvesChange
}) => {
  const handleFirstHalfChange = (hIndex: number, value: string) => {
    onHalvesChange(hIndex, 'first_half', value);
  };

  const handleSecondHalfChange = (hIndex: number, value: string) => {
    onHalvesChange(hIndex, 'second_half', value);
  };

  const handleCorrectMatchChange = (hIndex: number, value: string) => {
    onHalvesChange(hIndex, 'correct_match', value);
  };

  return (
    <div>
      <p className="mb-3 font-medium">Match the sentence halves:</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* First halves column */}
        <div>
          <h4 className="font-medium text-gray-700 mb-3">Sentence beginnings:</h4>
          <div className="space-y-2">
            {sentence_halves.map((item, hIndex) => (
              <div key={`first-${hIndex}`} className="flex items-start gap-2">
                <span className="font-medium text-sm mt-1">{String.fromCharCode(65 + hIndex)})</span>
                <div className="flex-grow">
                  {isEditing ? (
                    <input
                      type="text"
                      value={item.first_half}
                      onChange={e => handleFirstHalfChange(hIndex, e.target.value)}
                      className="w-full border p-1 editable-content"
                    />
                  ) : (
                    <span>{item.first_half}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Second halves column */}
        <div>
          <h4 className="font-medium text-gray-700 mb-3">Sentence endings:</h4>
          <div className="space-y-2">
            {sentence_halves.map((item, hIndex) => (
              <div key={`second-${hIndex}`} className="flex items-start gap-2">
                <span className="font-medium text-sm mt-1">{hIndex + 1})</span>
                <div className="flex-grow">
                  {isEditing ? (
                    <input
                      type="text"
                      value={item.second_half}
                      onChange={e => handleSecondHalfChange(hIndex, e.target.value)}
                      className="w-full border p-1 editable-content"
                    />
                  ) : (
                    <span>{item.second_half}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Teacher answers */}
      {viewMode === 'teacher' && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <h4 className="font-medium text-green-800 mb-2">Correct matches:</h4>
          <div className="text-green-600 italic text-sm">
            {isEditing ? (
              <div className="space-y-1">
                {sentence_halves.map((item, hIndex) => (
                  <div key={`match-${hIndex}`} className="flex items-center gap-2">
                    <span>{String.fromCharCode(65 + hIndex)} →</span>
                    <input
                      type="text"
                      value={item.correct_match || ''}
                      onChange={e => handleCorrectMatchChange(hIndex, e.target.value)}
                      className="border p-1 editable-content w-16"
                      placeholder="1"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <span>
                {sentence_halves.map((item, hIndex) => 
                  `${String.fromCharCode(65 + hIndex)}-${item.correct_match || (hIndex + 1)}`
                ).join(', ')}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseMatchingHalves;