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
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 vocabulary-matching-container">
        <div className="md:col-span-5 space-y-2">
          <h4 className="font-semibold bg-worksheet-purpleLight p-2 rounded-md">Sentence beginnings</h4>
          {sentence_halves.map((item, hIndex) => (
            <div key={hIndex} className="p-2 border rounded-md bg-white">
              <span className="text-worksheet-purple font-medium mr-2">{hIndex + 1}.</span>
              {viewMode === 'teacher' ? (
                <span className="teacher-answer">{String.fromCharCode(65 + hIndex)}</span>
              ) : (
                <span className="student-answer-blank"></span>
              )}
              {isEditing ? (
                <input
                  type="text"
                  value={item.first_half}
                  onChange={e => handleFirstHalfChange(hIndex, e.target.value)}
                  className="border p-1 editable-content w-full"
                />
              ) : item.first_half}
            </div>
          ))}
        </div>

        <div className="md:col-span-7 space-y-2">
          <h4 className="font-semibold bg-worksheet-purpleLight p-2 rounded-md">Sentence endings</h4>
          {sentence_halves.map((item, hIndex) => (
            <div key={hIndex} className="p-2 border rounded-md bg-white">
              <span className="text-worksheet-purple font-medium mr-2">{String.fromCharCode(65 + hIndex)}.</span>
              {isEditing ? (
                <input
                  type="text"
                  value={item.second_half}
                  onChange={e => handleSecondHalfChange(hIndex, e.target.value)}
                  className="border p-1 editable-content w-full"
                />
              ) : item.second_half}
            </div>
          ))}
        </div>
      </div>

      {/* Teacher answers in editing mode */}
      {viewMode === 'teacher' && isEditing && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <h4 className="font-medium text-green-800 mb-2">Correct matches:</h4>
          <div className="space-y-1">
            {sentence_halves.map((item, hIndex) => (
              <div key={`match-${hIndex}`} className="flex items-center gap-2">
                <span className="text-sm">{String.fromCharCode(65 + hIndex)} →</span>
                <input
                  type="text"
                  value={item.correct_match || ''}
                  onChange={e => handleCorrectMatchChange(hIndex, e.target.value)}
                  className="border p-1 editable-content w-16 text-sm"
                  placeholder="1"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseMatchingHalves;