import React from "react";

interface ExerciseDiscussionProps {
  questions: any[];
  isEditing: boolean;
  viewMode: "student" | "teacher";
  onQuestionChange: (qIndex: number, field: string, value: string) => void;
}

const ExerciseDiscussion: React.FC<ExerciseDiscussionProps> = ({
  questions, isEditing, viewMode, onQuestionChange
}) => {
  return (
    <div>
      <div className="space-y-4">
        {questions.map((questionItem, qIndex) => (
          <div key={qIndex} className="border-b pb-3">
            <div className="flex items-start gap-3">
              <span className="font-medium text-lg">{qIndex + 1}.</span>
              <div className="flex-grow space-y-2">
                {isEditing ? (
                  <>
                    <textarea
                      value={questionItem.question}
                      onChange={e => onQuestionChange(qIndex, 'question', e.target.value)}
                      className="w-full border p-2 editable-content resize-none"
                      rows={2}
                    />
                    <textarea
                      value={questionItem.follow_up}
                      onChange={e => onQuestionChange(qIndex, 'follow_up', e.target.value)}
                      className="w-full border p-2 editable-content resize-none text-sm"
                      rows={1}
                      placeholder="Follow-up question..."
                    />
                  </>
                ) : (
                  <>
                    <p className="text-base font-medium">{questionItem.question}</p>
                    <p className="text-sm text-gray-600 italic">Follow-up: {questionItem.follow_up}</p>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExerciseDiscussion;