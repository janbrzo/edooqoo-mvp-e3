import React, { useRef } from "react";
import { InteractiveExerciseProps } from "@/types/interactiveHomework";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { safeGetNanoSkill } from "@/utils/textObjectFixer";
import NanoSkillBadge, { NanoSkill } from "./NanoSkillBadge";

interface ExerciseSynonymsAntonymsProps extends Partial<InteractiveExerciseProps> {
  items: any[];
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onItemChange: (iIndex: number, field: string, value: string) => void;
  exerciseType?: string;
  worksheetId?: string;
  liveSessionAnswer?: Record<number, any>;
  disabled?: boolean;
  // NanoSkill editing
  onNanoSkillChange?: (iIndex: number, nanoSkill: NanoSkill) => void;
  isSharedWorksheet?: boolean;
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

function shuffleArrayWithSeed(array: any[], seed: string) {
  const newArray = [...array];
  const random = seededRandom(seed);
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

const ExerciseSynonymsAntonyms: React.FC<ExerciseSynonymsAntonymsProps> = ({
  items,
  isEditing,
  viewMode,
  onItemChange,
  exerciseType = 'synonyms-antonyms',
  worksheetId,
  liveSessionAnswer,
  // Interactive props
  isInteractive = false,
  studentAnswers = {},
  onAnswerChange,
  showCorrectAnswers = false,
  disabled = false,
  // NanoSkill props
  onNanoSkillChange,
  isSharedWorksheet = false
}) => {
  // PROBLEM 8 FIX: Use useRef with seeded random for deterministic shuffle
  const itemsKey = items.map(item => item.term).join('|');
  const shuffledRef = useRef<any[] | null>(null);
  
  if (!shuffledRef.current || shuffledRef.current.length !== items.length) {
    const seed = worksheetId ? `${worksheetId}-syn-${itemsKey}` : `syn-${itemsKey}`;
    shuffledRef.current = shuffleArrayWithSeed([...items], seed);
  }
  
  const shuffledDefinitions = shuffledRef.current;

  // Determine the title based on exercise type
  const rightColumnTitle = exerciseType === 'synonyms' ? 'Synonyms' 
                          : exerciseType === 'antonyms' ? 'Antonyms'
                          : 'Synonyms/Antonyms';

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 vocabulary-matching-container">
      <div className="md:col-span-5 space-y-2">
        <h4 className="font-semibold bg-worksheet-purpleLight p-2 rounded-md">Words</h4>
        {items.map((item, iIndex) => {
          const correctAnswer = String.fromCharCode(65 + shuffledDefinitions.findIndex(i => i.term === item.term));
          const liveAnswer = liveSessionAnswer?.[iIndex];
          const nanoSkill = safeGetNanoSkill(item);
          const showNanoSkill = viewMode === 'teacher' && !isSharedWorksheet && nanoSkill;
          
          return (
            <div key={iIndex} className="p-2 border rounded-md bg-white">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-worksheet-purple font-medium">{iIndex + 1}.</span>
                {viewMode === 'teacher' ? (
                  <>
                    <span className="teacher-answer">{correctAnswer}</span>
                    {/* Live Session: show student answer in blue */}
                    {liveAnswer !== undefined && (
                      <span className="text-blue-600 font-medium text-sm">
                        [Student: {liveAnswer}]
                      </span>
                    )}
                  </>
                ) : (
                  <span className="student-answer-blank"></span>
                )}
                <span className="flex-grow">
                  {isEditing ? (
                    <input
                      type="text"
                      value={item.term}
                      onChange={e => onItemChange(iIndex, 'term', e.target.value)}
                      className="border p-1 editable-content w-full"
                    />
                  ) : item.term}
                </span>
                {/* NanoSkill Badge */}
                {showNanoSkill && (
                  <NanoSkillBadge
                    nanoSkill={nanoSkill}
                    isEditing={isEditing}
                    onEdit={onNanoSkillChange ? (ns) => onNanoSkillChange(iIndex, ns) : undefined}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="md:col-span-7 space-y-2">
        <h4 className="font-semibold bg-worksheet-purpleLight p-2 rounded-md">{rightColumnTitle}</h4>
        {isInteractive ? (
          items.map((item, iIndex) => {
            const studentAnswer = studentAnswers[iIndex];
            const correctAnswer = String.fromCharCode(65 + shuffledDefinitions.findIndex(d => d.definition === item.definition));
            const isCorrect = showCorrectAnswers && studentAnswer === correctAnswer;
            const isIncorrect = showCorrectAnswers && studentAnswer && studentAnswer !== correctAnswer;
            const isEmpty = showCorrectAnswers && !studentAnswer;

            return (
              <div key={iIndex} className="p-2 border rounded-md bg-white flex items-center gap-2">
                <span className="text-worksheet-purple font-medium">{iIndex + 1}.</span>
                <span className="flex-grow">{item.term}</span>
                <Select
                  value={studentAnswer || ''}
                  onValueChange={(value) => onAnswerChange?.(iIndex, value)}
                  disabled={disabled}
                >
                  <SelectTrigger className={`w-20 
                    ${isCorrect ? 'bg-green-200 border-2 border-green-600' : ''} 
                    ${isIncorrect ? 'bg-red-200 border-2 border-red-600' : ''}
                    ${isEmpty ? 'bg-red-100 border-2 border-red-400' : ''}
                    ${disabled ? 'opacity-70' : ''}
                  `}>
                    <SelectValue placeholder="?" />
                  </SelectTrigger>
                  <SelectContent>
                    {shuffledDefinitions.map((_, idx) => (
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
          shuffledDefinitions.map((item, iIndex) => (
            <div key={iIndex} className="p-2 border rounded-md bg-white">
              <span className="text-worksheet-purple font-medium mr-2">{String.fromCharCode(65 + iIndex)}.</span>
              {isEditing ? (
                <input
                  type="text"
                  value={item.definition}
                  onChange={e => {
                    const originalIndex = items.findIndex(i => i.term === item.term);
                    if (originalIndex !== -1) {
                      onItemChange(originalIndex, 'definition', e.target.value);
                    }
                  }}
                  className="border p-1 editable-content w-full"
                />
              ) : item.definition}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ExerciseSynonymsAntonyms;
