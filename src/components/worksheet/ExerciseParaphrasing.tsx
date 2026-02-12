import React from "react";
import { InteractiveExerciseProps } from "@/types/interactiveHomework";
import { AutoResizeTextarea } from "@/components/ui/AutoResizeTextarea";
import { safeGetNanoSkill, safeGetText } from "@/utils/textObjectFixer";
import NanoSkillBadge, { NanoSkill } from "./NanoSkillBadge";
import { AiEvaluationBadge, AiEvaluation } from "@/components/homework/AiEvaluationBadge";

interface ExerciseParaphrasingProps extends Partial<InteractiveExerciseProps> {
  sentences: any[];
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onSentenceChange: (sIndex: number, field: string, value: string) => void;
  liveSessionAnswer?: Record<number, any>;
  // A3: Disable inputs after homework submission
  disabled?: boolean;
  // NanoSkill editing
  onNanoSkillChange?: (sIndex: number, nanoSkill: NanoSkill) => void;
  isSharedWorksheet?: boolean;
  // AI Evaluations per sentence
  aiEvaluations?: Record<number, AiEvaluation>;
  liveSessionContext?: { worksheetId: string; exerciseIndex: number; exerciseType: string; teacherId: string; };
}

// Helper to extract word_to_use from multiple possible data formats
// Format A: {word_to_use: "word"} or {word_to_use: {text: "word", nano_skill: {...}}}
// Format B: AI format with {paraphrase: "...", alternatives: [...]}
const getWordToUse = (sentence: any): string => {
  // First try direct word_to_use field
  if (sentence.word_to_use !== undefined && sentence.word_to_use !== null) {
    const rawText = safeGetText(sentence.word_to_use);
    // Filter out if it looks like a nano_skill name (contains dots or underscores in specific patterns)
    if (rawText && !rawText.match(/^ns\.|^[a-z]+\.[a-z]+\.|_[a-z]+_/)) {
      return rawText;
    }
  }
  // Format B: no word_to_use, return empty (optional field)
  return '';
};

// Helper to extract suggested answer from multiple possible data formats
// Format A: {answer: "..."}  
// Format B: AI format {paraphrase: "..."}
const getSuggestedAnswer = (sentence: any): string => {
  // First try direct answer field
  if (sentence.answer !== undefined && sentence.answer !== null) {
    return safeGetText(sentence.answer);
  }
  // Format B: AI uses 'paraphrase' field
  if (sentence.paraphrase !== undefined && sentence.paraphrase !== null) {
    return safeGetText(sentence.paraphrase);
  }
  return '';
};

const ExerciseParaphrasing: React.FC<ExerciseParaphrasingProps> = ({
  sentences, 
  isEditing, 
  viewMode, 
  onSentenceChange,
  liveSessionAnswer,
  // Interactive props
  isInteractive = false,
  studentAnswers = {},
  onAnswerChange,
  showCorrectAnswers = false,
  // A3: Disable inputs
  disabled = false,
  // NanoSkill props
  onNanoSkillChange,
  isSharedWorksheet = false,
  // AI Evaluations
  aiEvaluations,
  liveSessionContext
}) => {
  return (
    <div>
      <div className="space-y-3">
        {sentences.map((sentence, sIndex) => {
          const studentAnswer = studentAnswers[sIndex] || '';
          const isEmpty = showCorrectAnswers && !studentAnswer;
          const nanoSkill = safeGetNanoSkill(sentence);
          const showNanoSkill = viewMode === 'teacher' && !isSharedWorksheet && nanoSkill;
          
          // Extract values using helpers for multi-format support
          const wordToUse = getWordToUse(sentence);
          const suggestedAnswer = getSuggestedAnswer(sentence);

          return (
            <div key={sIndex} className="border rounded-lg p-3 bg-white">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{sIndex + 1}.</span>
                  
                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        value={sentence.original}
                        onChange={e => onSentenceChange(sIndex, 'original', e.target.value)}
                        className="flex-grow border p-1 editable-content"
                      />
                      <input
                        type="text"
                        value={wordToUse}
                        onChange={e => onSentenceChange(sIndex, 'word_to_use', e.target.value)}
                        className="w-32 border p-1 editable-content text-sm"
                        placeholder="Word to use..."
                      />
                    </>
                  ) : (
                    <>
                      <span className="flex-grow">{sentence.original}</span>
                      {wordToUse && (
                        <span className="text-sm text-gray-600">Use: <strong>{wordToUse}</strong></span>
                      )}
                    </>
                  )}
                  {/* NanoSkill Badge */}
                  {showNanoSkill && (
                    <NanoSkillBadge
                      nanoSkill={nanoSkill}
                      isEditing={isEditing}
                      onEdit={onNanoSkillChange ? (ns) => onNanoSkillChange(sIndex, ns) : undefined}
                    />
                  )}
                </div>

                {/* PROBLEM 3 FIX: Auto-resize textarea */}
                {isInteractive && (
                  <>
                    <AutoResizeTextarea
                      value={studentAnswer}
                      onChange={(e) => onAnswerChange?.(sIndex, e.target.value)}
                      placeholder="Write your paraphrased sentence..."
                      className={`min-h-[40px] ${isEmpty ? 'bg-red-100 border-2 border-red-400' : ''} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                      rows={1}
                      disabled={disabled}
                    />
                    {/* AI Evaluation badge per sentence */}
                    {aiEvaluations?.[sIndex] && (disabled || isSharedWorksheet) && (
                      <AiEvaluationBadge 
                        evaluation={aiEvaluations[sIndex]} 
                        showFeedback={true}
                      />
                    )}
                  </>
                )}
                {(viewMode === 'teacher' || showCorrectAnswers) && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="text-green-600 italic text-sm">
                      {isEditing ? (
                        <input
                          type="text"
                          value={suggestedAnswer}
                          onChange={e => onSentenceChange(sIndex, 'answer', e.target.value)}
                          className="border p-1 editable-content w-full"
                          placeholder="Suggested answer..."
                        />
                      ) : (
                        suggestedAnswer && <span>Suggested answer: {suggestedAnswer}</span>
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
                {/* AI Evaluation badge - AFTER suggested answer and student answer */}
                {!isInteractive && aiEvaluations?.[sIndex] && isSharedWorksheet && (
                  <AiEvaluationBadge evaluation={aiEvaluations[sIndex]} showFeedback={true}
                    isLiveSession={!!liveSessionContext} worksheetId={liveSessionContext?.worksheetId}
                    exerciseIndex={liveSessionContext?.exerciseIndex} exerciseType={liveSessionContext?.exerciseType}
                    teacherId={liveSessionContext?.teacherId} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ExerciseParaphrasing;
