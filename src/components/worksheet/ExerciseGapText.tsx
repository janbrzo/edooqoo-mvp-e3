import React from "react";
import { InteractiveExerciseProps } from "@/types/interactiveHomework";
import { Input } from "@/components/ui/input";
import { safeGetText, safeGetNanoSkill, safeGetAllNanoSkills } from "@/utils/textObjectFixer";
import NanoSkillBadge, { NanoSkill } from "./NanoSkillBadge";

interface ExerciseGapTextProps extends Partial<InteractiveExerciseProps> {
  sentences: any[];
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onSentenceChange: (sIndex: number, field: string, value: string) => void;
  liveSessionAnswer?: Record<number, any>;
  disabled?: boolean;
  // NanoSkill editing
  onNanoSkillChange?: (sIndex: number, nanoSkill: NanoSkill, skillIndex?: number) => void;
  isSharedWorksheet?: boolean;
}

const ExerciseGapText: React.FC<ExerciseGapTextProps> = ({
  sentences = [],
  isEditing,
  viewMode,
  onSentenceChange,
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
  if (!sentences || sentences.length === 0) {
    return <div className="text-gray-500 italic">No sentences available for this exercise.</div>;
  }

  return (
    <div className="space-y-2">
      {sentences.map((sentence, sIndex) => {
        const studentAnswer = studentAnswers[sIndex] || '';
        const correctAnswer = sentence?.answer || '';
        const isCorrect = showCorrectAnswers && studentAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
        const isIncorrect = showCorrectAnswers && studentAnswer && !isCorrect;
        const isEmpty = showCorrectAnswers && !studentAnswer;
        const sentenceText = safeGetText(sentence?.text || sentence);
        const nanoSkill = safeGetNanoSkill(sentence);
        const showNanoSkill = viewMode === 'teacher' && nanoSkill;

        return (
          <div key={sIndex} className="border rounded-lg p-3 bg-white">
            <div className="flex flex-col gap-2">
              <div className="flex-grow">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="leading-snug flex-grow">
                    {isEditing ? (
                      <input
                        type="text"
                        value={sentence?.text || ''}
                        onChange={e => onSentenceChange(sIndex, 'text', e.target.value)}
                        className="w-full border p-1 editable-content"
                      />
                    ) : (
                      <>{sIndex + 1}. {sentenceText.replace(/_+/g, "_______________")}</>
                    )}
                  </p>
                  {/* NanoSkill Badge */}
                  {showNanoSkill && (
                  <NanoSkillBadge
                    nanoSkill={nanoSkill}
                    allNanoSkills={safeGetAllNanoSkills(sentence)}
                    isEditing={isEditing}
                    onEdit={onNanoSkillChange ? (ns, idx) => onNanoSkillChange(sIndex, ns, idx) : undefined}
                    />
                  )}
                </div>
              </div>
              {isInteractive && (
                <Input
                  type="text"
                  value={studentAnswer}
                  onChange={(e) => onAnswerChange?.(sIndex, e.target.value)}
                  placeholder="Type your answer..."
                  disabled={disabled}
                  className={`h-10
                    ${isCorrect ? 'bg-green-200 border-2 border-green-600' : ''}
                    ${isIncorrect ? 'bg-red-200 border-2 border-red-600' : ''}
                    ${isEmpty ? 'bg-red-100 border-2 border-red-400' : ''}
                    ${disabled ? 'bg-muted cursor-not-allowed opacity-70' : ''}
                  `}
                />
              )}
              {(viewMode === 'teacher' || showCorrectAnswers) && (
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="text-green-600 italic text-sm">
                    {isEditing ? (
                      <input
                        type="text"
                        value={sentence?.answer || ''}
                        onChange={e => onSentenceChange(sIndex, 'answer', e.target.value)}
                        className="border p-1 editable-content w-full"
                      />
                    ) : (
                      <span>({correctAnswer})</span>
                    )}
                  </div>
                  {/* Live Session: show student answer in blue */}
                  {liveSessionAnswer?.[sIndex] !== undefined && (
                    <span className="text-blue-600 font-medium text-sm">
                      [Student: {liveSessionAnswer[sIndex]}]
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ExerciseGapText;
