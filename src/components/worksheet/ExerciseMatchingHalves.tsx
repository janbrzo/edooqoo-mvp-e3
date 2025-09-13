import React, { useMemo } from "react";

interface ExerciseMatchingHalvesProps {
  sentence_halves: any[];
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onHalvesChange: (hIndex: number, field: string, value: any) => void;
}

// Shuffle function for matching exercise
function shuffleArray(array: any[]) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

const ExerciseMatchingHalves: React.FC<ExerciseMatchingHalvesProps> = ({
  sentence_halves, isEditing, viewMode, onHalvesChange
}) => {
  // Use useMemo to prevent re-shuffling on every render
  const shuffledSecondHalves = useMemo(() => {
    return shuffleArray([...sentence_halves]);
  }, [sentence_halves.map(item => `${item.first_half}|${item.second_half}`).join('||')]);

  const handleFirstHalfChange = (hIndex: number, value: string) => {
    onHalvesChange(hIndex, 'first_half', value);
  };

  const handleSecondHalfChange = (hIndex: number, value: string) => {
    onHalvesChange(hIndex, 'second_half', value);
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
                <span className="teacher-answer">{String.fromCharCode(65 + shuffledSecondHalves.findIndex(i => i.first_half === item.first_half))}</span>
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
          {shuffledSecondHalves.map((item, hIndex) => (
            <div key={hIndex} className="p-2 border rounded-md bg-white">
              <span className="text-worksheet-purple font-medium mr-2">{String.fromCharCode(65 + hIndex)}.</span>
              {isEditing ? (
                <input
                  type="text"
                  value={item.second_half}
                  onChange={e => {
                    const originalIndex = sentence_halves.findIndex(i => i.first_half === item.first_half);
                    if (originalIndex !== -1) {
                      handleSecondHalfChange(originalIndex, e.target.value);
                    }
                  }}
                  className="border p-1 editable-content w-full"
                />
              ) : item.second_half}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExerciseMatchingHalves;