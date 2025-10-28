import React from "react";

interface ExerciseMatchingHalvesProps {
  sentence_halves: any[];
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onHalvesChange: (hIndex: number, field: string, value: any) => void;
}

const ExerciseMatchingHalves: React.FC<ExerciseMatchingHalvesProps> = ({
  sentence_halves = [], isEditing, viewMode, onHalvesChange
}) => {
  // ✅ AUTO-APPEND dots if AI forgot them (frontend failsafe)
  const processedHalves = React.useMemo(() => {
    return sentence_halves.map(item => ({
      ...item,
      first_half: item.first_half?.trim().endsWith('......') 
        ? item.first_half 
        : `${item.first_half?.trim()} ......`,
      second_half: item.second_half?.trim().startsWith('......')
        ? item.second_half
        : `...... ${item.second_half?.trim()}`
    }));
  }, [sentence_halves]);

  const handleFirstHalfChange = (hIndex: number, value: string) => {
    onHalvesChange(hIndex, 'first_half', value);
  };

  const handleSecondHalfChange = (hIndex: number, value: string) => {
    onHalvesChange(hIndex, 'second_half', value);
  };

  const handleCorrectMatchChange = (hIndex: number, value: string) => {
    onHalvesChange(hIndex, 'correct_match', value);
  };

  // Shuffle the second halves for display (but keep original order for teacher view)
  const shuffledIndices = React.useMemo(() => {
    const indices = sentence_halves.map((_, index) => index);
    // Simple shuffle algorithm
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
  }, [sentence_halves.length]);

  // Create shuffled second halves array for consistent indexing
  const shuffledSecondHalves = React.useMemo(() => {
    return shuffledIndices.map(originalIndex => processedHalves[originalIndex]);
  }, [shuffledIndices, processedHalves]);

  if (!processedHalves || processedHalves.length === 0) {
    return <div className="text-gray-500 italic">No sentence halves available for this exercise.</div>;
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 vocabulary-matching-container">
        <div className="md:col-span-5 space-y-2">
          <h4 className="font-semibold bg-worksheet-purpleLight p-2 rounded-md">Sentence beginnings</h4>
          {processedHalves.map((item, hIndex) => (
            <div key={hIndex} className="p-2 border rounded-md bg-white">
              <span className="text-worksheet-purple font-medium mr-2">{hIndex + 1}.</span>
              {viewMode === 'student' ? (
                <span className="inline-block w-8 h-6 border-b border-gray-400 mr-2"></span>
              ) : (
                <span className="teacher-answer">{String.fromCharCode(65 + shuffledSecondHalves.findIndex(shuffled => shuffled.second_half === item.second_half))}</span>
              )}
              {isEditing ? (
                <input
                  type="text"
                  value={item?.first_half || ''}
                  onChange={e => handleFirstHalfChange(hIndex, e.target.value)}
                  className="border p-1 editable-content w-full"
                />
              ) : (item?.first_half || 'Missing first half')}
            </div>
          ))}
        </div>

        <div className="md:col-span-7 space-y-2">
          <h4 className="font-semibold bg-worksheet-purpleLight p-2 rounded-md">Sentence endings</h4>
          {shuffledIndices.map((originalIndex, displayIndex) => {
            const item = processedHalves[originalIndex];
            return (
              <div key={`shuffled-${displayIndex}`} className="p-2 border rounded-md bg-white">
                <span className="text-worksheet-purple font-medium mr-2">{String.fromCharCode(65 + displayIndex)}.</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={item?.second_half || ''}
                    onChange={e => handleSecondHalfChange(originalIndex, e.target.value)}
                    className="border p-1 editable-content w-full"
                  />
                ) : (item?.second_half || 'Missing second half')}
              </div>
            );
          })}
        </div>
      </div>

      {/* Teacher answers in editing mode */}
      {viewMode === 'teacher' && isEditing && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <h4 className="font-medium text-green-800 mb-2">Correct matches:</h4>
          <div className="space-y-1">
            {sentence_halves.map((item, hIndex) => (
              <div key={`match-${hIndex}`} className="flex items-center gap-2">
                <span className="text-sm">{hIndex + 1} →</span>
                <input
                  type="text"
                  value={item?.correct_match || String.fromCharCode(65 + hIndex)}
                  onChange={e => handleCorrectMatchChange(hIndex, e.target.value)}
                  className="border p-1 editable-content w-16 text-sm"
                  placeholder={String.fromCharCode(65 + hIndex)}
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