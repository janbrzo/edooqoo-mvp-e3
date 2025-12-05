import React from "react";
import { InteractiveExerciseProps } from "@/types/interactiveHomework";
import { Input } from "@/components/ui/input";

interface ExerciseDialogueProps extends Partial<InteractiveExerciseProps> {
  dialogue: any[];
  expressions?: string[];
  expression_instruction?: string;
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onDialogueChange: (index: number, field: string, value: string) => void;
  onExpressionChange: (index: number, value: string) => void;
  onExpressionInstructionChange: (value: string) => void;
}

const ExerciseDialogue: React.FC<ExerciseDialogueProps> = ({
  dialogue,
  expressions,
  expression_instruction,
  isEditing,
  viewMode,
  onDialogueChange,
  onExpressionChange,
  onExpressionInstructionChange,
  // Interactive props
  isInteractive = false,
  studentAnswers = {},
  onAnswerChange,
  showCorrectAnswers = false
}) => {
  return (
    <div>
      {/* Dialogue section */}
      <div className="mb-4 p-4 bg-gray-50 rounded-md dialogue-section">
        {dialogue.map((line, lIndex) => (
          <div key={lIndex} className="mb-1 dialogue-line">
            <span className="font-semibold">
              {isEditing ? (
                <input
                  type="text"
                  value={line.speaker}
                  onChange={e => onDialogueChange(lIndex, 'speaker', e.target.value)}
                  className="border p-1 editable-content w-32"
                />
              ) : (
                <>{line.speaker}:</>
              )}
            </span>
            <span className="leading-snug">
              {isEditing ? (
                <input
                  type="text"
                  value={line.text}
                  onChange={e => onDialogueChange(lIndex, 'text', e.target.value)}
                  className="border p-1 editable-content ml-1 w-full"
                />
              ) : (
                <> {line.text}</>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Expressions section with 2-column grid and input under EACH expression */}
      {expressions && (
        <div>
          <p className="font-medium mb-2">
            {isEditing ? (
              <input
                type="text"
                value={expression_instruction || ""}
                onChange={e => onExpressionInstructionChange(e.target.value)}
                className="w-full border p-1 editable-content"
              />
            ) : expression_instruction}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {expressions.map((expr, eIndex) => {
              const studentAnswer = studentAnswers[eIndex] || '';
              const isEmpty = showCorrectAnswers && !studentAnswer;
              
              return (
                <div key={eIndex} className="p-3 border rounded-lg bg-white">
                  <div className="flex items-start">
                    <span className="text-worksheet-purple font-medium mr-2">{eIndex + 1}.</span>
                    <div className="flex-grow">
                      {isEditing ? (
                        <input
                          type="text"
                          value={expr}
                          onChange={e => onExpressionChange(eIndex, e.target.value)}
                          className="border p-1 editable-content w-full"
                        />
                      ) : (
                        <span className="font-medium">{expr}</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Interactive answer input under each expression */}
                  {isInteractive && (
                    <div className="mt-2">
                      <Input
                        value={studentAnswer}
                        onChange={(e) => onAnswerChange?.(eIndex, e.target.value)}
                        placeholder="Use this expression in a sentence..."
                        className={`h-10 ${isEmpty ? 'bg-red-100 border-2 border-red-400' : ''}`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseDialogue;
