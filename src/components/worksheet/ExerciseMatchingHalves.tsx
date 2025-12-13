import React, { useRef } from "react";
import { InteractiveExerciseProps } from "@/types/interactiveHomework";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ExerciseMatchingHalvesProps extends Partial<InteractiveExerciseProps> {
  sentence_halves: any[];
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onHalvesChange: (hIndex: number, field: string, value: any) => void;
  worksheetId?: string;
  liveSessionAnswer?: Record<number, any>;
}

// PROBLEM 8 FIX: Seeded random for deterministic shuffle
function seededRandom(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return function() {
    hash = (hash * 1103515245 + 12345) & 0x7fffffff;
    return (hash % 1000) / 1000;
  };
}

function shuffleIndicesWithSeed(length: number, seed: string): number[] {
  const indices = Array.from({ length }, (_, i) => i);
  const random = seededRandom(seed);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
}

const ExerciseMatchingHalves: React.FC<ExerciseMatchingHalvesProps> = ({
  sentence_halves = [],
  isEditing,
  viewMode,
  onHalvesChange,
  worksheetId,
  liveSessionAnswer,
  // Interactive props
  isInteractive = false,
  studentAnswers = {},
  onAnswerChange,
  showCorrectAnswers = false
}) => {
  // Process sentence halves to add dots if missing
  const processedHalves = React.useMemo(() => {
    return sentence_halves.map(item => {
      let firstHalf = item.first_half || '';
      let secondHalf = item.second_half || '';
      
      // Add ...... at the end of first_half if not present
      if (firstHalf && !firstHalf.trim().endsWith('......')) {
        firstHalf = firstHalf.trim() + ' ......';
      }
      
      // Add ...... at the beginning of second_half if not present
      if (secondHalf && !secondHalf.trim().startsWith('......')) {
        secondHalf = '...... ' + secondHalf.trim();
      }
      
      return {
        ...item,
        first_half: firstHalf,
        second_half: secondHalf
      };
    });
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

  // PROBLEM 8 FIX: Use useRef with seeded random for deterministic shuffle
  const halvesKey = sentence_halves.map(h => h.first_half).join('|');
  const shuffledIndicesRef = useRef<number[] | null>(null);
  
  if (!shuffledIndicesRef.current || shuffledIndicesRef.current.length !== processedHalves.length) {
    const seed = worksheetId ? `${worksheetId}-halves-${halvesKey}` : `halves-${halvesKey}`;
    shuffledIndicesRef.current = shuffleIndicesWithSeed(processedHalves.length, seed);
  }
  
  const shuffledIndices = shuffledIndicesRef.current;

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
          {processedHalves.map((item, hIndex) => {
            const correctAnswer = String.fromCharCode(65 + shuffledSecondHalves.findIndex(shuffled => shuffled.second_half === item.second_half));
            const liveAnswer = liveSessionAnswer?.[hIndex];
            
            return (
              <div key={hIndex} className="p-2 border rounded-md bg-white">
                <span className="text-worksheet-purple font-medium mr-2">{hIndex + 1}.</span>
                {viewMode === 'student' ? (
                  <span className="inline-block w-8 h-6 border-b border-gray-400 mr-2"></span>
                ) : (
                  <>
                    <span className="teacher-answer">{correctAnswer}</span>
                    {/* Live Session: show student answer in blue */}
                    {liveAnswer !== undefined && (
                      <span className="text-blue-600 font-medium text-sm ml-2">
                        [Student: {liveAnswer}]
                      </span>
                    )}
                  </>
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
            );
          })}
        </div>

        <div className="md:col-span-7 space-y-2">
          <h4 className="font-semibold bg-worksheet-purpleLight p-2 rounded-md">Sentence endings</h4>
          {isInteractive ? (
            processedHalves.map((half, hIndex) => {
              const studentAnswer = studentAnswers[hIndex];
              const correctAnswer = String.fromCharCode(65 + shuffledSecondHalves.findIndex(s => s.second_half === half.second_half));
              const isCorrect = showCorrectAnswers && studentAnswer === correctAnswer;
              const isIncorrect = showCorrectAnswers && studentAnswer && studentAnswer !== correctAnswer;
              const isEmpty = showCorrectAnswers && !studentAnswer;

              return (
                <div key={hIndex} className={`p-2 border rounded-md bg-white flex items-center gap-2
                  ${isCorrect ? 'bg-green-200 border-2 border-green-600' : ''}
                  ${isIncorrect ? 'bg-red-200 border-2 border-red-600' : ''}
                  ${isEmpty ? 'bg-red-100 border-2 border-red-400' : ''}
                `}>
                  <span className="text-worksheet-purple font-medium">{hIndex + 1}.</span>
                  <span className="flex-grow">{half.first_half}</span>
                  <Select
                    value={studentAnswer || ''}
                    onValueChange={(value) => onAnswerChange?.(hIndex, value)}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue placeholder="?" />
                    </SelectTrigger>
                    <SelectContent>
                      {shuffledSecondHalves.map((_, idx) => (
                        <SelectItem key={idx} value={String.fromCharCode(65 + idx)}>
                          {String.fromCharCode(65 + idx)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {showCorrectAnswers && (
                    <span className="text-green-600 text-sm">({correctAnswer})</span>
                  )}
                </div>
              );
            })
          ) : (
            shuffledIndices.map((originalIndex, displayIndex) => {
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
            })
          )}
        </div>
      </div>

      {/* Teacher answers in editing mode */}
      {viewMode === 'teacher' && isEditing && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <h4 className="font-medium text-green-800 mb-2">Correct matches:</h4>
          <div className="space-y-1">
            {processedHalves.map((item, hIndex) => (
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
