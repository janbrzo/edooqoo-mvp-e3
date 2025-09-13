import React from "react";
import ExerciseHeader from "./ExerciseHeader";
import ExerciseContent from "./ExerciseContent";
import ExerciseReading from "./ExerciseReading";
import ExerciseMatching from "./ExerciseMatching";
import ExerciseFillInBlanks from "./ExerciseFillInBlanks";
import ExerciseMultipleChoice from "./ExerciseMultipleChoice";
import TeacherTipSection from "./TeacherTipSection";
import ExerciseDialogue from "./ExerciseDialogue";
// New Phase 1 exercise components
import ExerciseOddOneOut from "./ExerciseOddOneOut";
import ExerciseSynonymsAntonyms from "./ExerciseSynonymsAntonyms";
import ExerciseSentenceTransformation from "./ExerciseSentenceTransformation";
import ExerciseWordOrder from "./ExerciseWordOrder";
import ExerciseGapText from "./ExerciseGapText";
import ExerciseNegativePrefixes from "./ExerciseNegativePrefixes";
// New Phase 2 exercise components
import ExerciseCategorize from "./ExerciseCategorize";
import ExerciseParaphrasing from "./ExerciseParaphrasing";
import ExerciseCompleteWord from "./ExerciseCompleteWord";
import ExerciseMatchingHalves from "./ExerciseMatchingHalves";
import ExerciseDiscussion from "./ExerciseDiscussion";
import ExerciseErrorCorrection from "./ExerciseErrorCorrection";
import {
  handleExerciseChange,
  handleQuestionChange,
  handleItemChange,
  handleSentenceChange,
  handleExpressionChange,
  handleTeacherTipChange,
  handleDialogueChange,
  handleStatementChange,
  getMatchedItems,
  renderOtherExerciseTypes,
  renderTrueFalseExercise
} from "./ExerciseSectionUtils";

interface Exercise {
  type: string;
  title: string;
  icon: string;
  time: number;
  instructions: string;
  content?: string;
  questions?: any[];
  items?: any[];
  sentences?: any[];
  dialogue?: any[];
  statements?: any[];
  word_bank?: string[];
  expressions?: string[];
  expression_instruction?: string;
  teacher_tip: string;
}

export interface Worksheet {
  title: string;
  subtitle: string;
  introduction: string;
  exercises: Exercise[];
  vocabulary_sheet: {
    term: string;
    meaning: string;
  }[];
}

interface ExerciseSectionProps {
  exercise: any;
  index: number;
  isEditing: boolean;
  viewMode: "student" | "teacher";
  editableWorksheet: any;
  setEditableWorksheet: React.Dispatch<React.SetStateAction<any>>;
}

const ExerciseSection: React.FC<ExerciseSectionProps> = ({
  exercise,
  index,
  isEditing,
  viewMode,
  editableWorksheet,
  setEditableWorksheet
}) => {
  // Exercise update handlers using the utility functions
  const handleExerciseChangeLocal = (field: string, value: string) => {
    handleExerciseChange(editableWorksheet, setEditableWorksheet, index, field, value);
  };

  const handleQuestionChangeLocal = (questionIndex: number, field: string, value: string) => {
    handleQuestionChange(editableWorksheet, setEditableWorksheet, index, questionIndex, field, value);
  };

  const handleItemChangeLocal = (itemIndex: number, field: string, value: string) => {
    handleItemChange(editableWorksheet, setEditableWorksheet, index, itemIndex, field, value);
  };

  const handleSentenceChangeLocal = (sentenceIndex: number, field: string, value: string) => {
    handleSentenceChange(editableWorksheet, setEditableWorksheet, index, sentenceIndex, field, value);
  };

  const handleExpressionChangeLocal = (expressionIndex: number, value: string) => {
    handleExpressionChange(editableWorksheet, setEditableWorksheet, index, expressionIndex, value);
  };

  const handleTeacherTipChangeLocal = (value: string) => {
    handleTeacherTipChange(editableWorksheet, setEditableWorksheet, index, value);
  };

  const handleDialogueChangeLocal = (dialogueIndex: number, field: string, value: string) => {
    handleDialogueChange(editableWorksheet, setEditableWorksheet, index, dialogueIndex, field, value);
  };
  
  const handleStatementChangeLocal = (statementIndex: number, field: string, value: string | boolean) => {
    handleStatementChange(editableWorksheet, setEditableWorksheet, index, statementIndex, field, value);
  };

  return (
    <div className="mb-4 bg-white border rounded-lg overflow-hidden shadow-sm">
      <ExerciseHeader
        icon={exercise.icon}
        title={exercise.title}
        isEditing={isEditing}
        time={exercise.time}
        onTitleChange={val => handleExerciseChangeLocal('title', val)}
      />

      <div className="p-5">
        <ExerciseContent
          instructions={exercise.instructions}
          isEditing={isEditing}
          onInstructionsChange={val => handleExerciseChangeLocal('instructions', val)}
          content={exercise.content}
          onContentChange={val => handleExerciseChangeLocal('content', val)}
        />

        {exercise.type === 'reading' && exercise.questions && (
          <ExerciseReading
            questions={exercise.questions}
            isEditing={isEditing}
            viewMode={viewMode}
            onQuestionChange={handleQuestionChangeLocal}
          />
        )}

        {exercise.type === 'matching' && exercise.items && (
          <ExerciseMatching
            items={exercise.items}
            isEditing={isEditing}
            viewMode={viewMode}
            getMatchedItems={() => getMatchedItems(exercise.items, viewMode)}
            onItemChange={handleItemChangeLocal}
          />
        )}

        {exercise.type === 'fill-in-blanks' && exercise.sentences && (
          <ExerciseFillInBlanks
            word_bank={exercise.word_bank}
            sentences={exercise.sentences}
            isEditing={isEditing}
            viewMode={viewMode}
            onWordBankChange={(wIndex, value) => {
              const newWordBank = [...exercise.word_bank!];
              newWordBank[wIndex] = value;
              const updatedExercises = [...editableWorksheet.exercises];
              updatedExercises[index] = {
                ...updatedExercises[index],
                word_bank: newWordBank
              };
              setEditableWorksheet({
                ...editableWorksheet,
                exercises: updatedExercises
              });
            }}
            onSentenceChange={handleSentenceChangeLocal}
          />
        )}

        {exercise.type === 'multiple-choice' && exercise.questions && (
          <ExerciseMultipleChoice
            questions={exercise.questions}
            isEditing={isEditing}
            viewMode={viewMode}
            onQuestionTextChange={(qIndex, value) => handleQuestionChangeLocal(qIndex, 'text', value)}
            onOptionTextChange={(qIndex, oIndex, value) => {
              const updatedExercises = [...editableWorksheet.exercises];
              const question = updatedExercises[index].questions[qIndex];
              const newOptions = [...question.options];
              newOptions[oIndex] = {
                ...newOptions[oIndex],
                text: value
              };
              updatedExercises[index].questions[qIndex] = {
                ...question,
                options: newOptions
              };
              setEditableWorksheet({
                ...editableWorksheet,
                exercises: updatedExercises
              });
            }}
          />
        )}

        {exercise.type === 'dialogue' && exercise.dialogue && (
          <ExerciseDialogue
            dialogue={exercise.dialogue}
            expressions={exercise.expressions}
            expression_instruction={exercise.expression_instruction}
            isEditing={isEditing}
            viewMode={viewMode}
            onDialogueChange={handleDialogueChangeLocal}
            onExpressionChange={handleExpressionChangeLocal}
            onExpressionInstructionChange={val => handleExerciseChangeLocal('expression_instruction', val)}
          />
        )}

        {exercise.type === 'discussion' && exercise.questions && (
          <div className="space-y-0.5">
            <h3 className="font-medium text-gray-700 mb-2">Discussion Questions:</h3>
            {exercise.questions.map((question: string, qIndex: number) => (
              <div key={qIndex} className="p-1 border-b">
                <p className="leading-snug">
                  {isEditing ? (
                    <input
                      type="text"
                      value={question}
                      onChange={e => {
                        const updatedExercises = [...editableWorksheet.exercises];
                        const newQuestions = [...exercise.questions!];
                        newQuestions[qIndex] = e.target.value;
                        updatedExercises[index] = {
                          ...updatedExercises[index],
                          questions: newQuestions
                        };
                        setEditableWorksheet({
                          ...editableWorksheet,
                          exercises: updatedExercises
                        });
                      }}
                      className="w-full border p-1 editable-content"
                    />
                  ) : (
                    <>{qIndex + 1}. {question}</>
                  )}
                </p>
              </div>
            ))}
          </div>
        )}

        {(exercise.type === 'error-correction' || exercise.type === 'word-formation' || exercise.type === 'word-order') && 
          exercise.sentences && renderOtherExerciseTypes(exercise, isEditing, viewMode, handleSentenceChangeLocal)}
        
        {exercise.type === 'true-false' && exercise.statements && 
          renderTrueFalseExercise(exercise, isEditing, viewMode, handleStatementChangeLocal)}

        {/* New Phase 1 exercises */}
        {exercise.type === 'odd-one-out' && exercise.questions && (
          <ExerciseOddOneOut
            questions={exercise.questions}
            isEditing={isEditing}
            viewMode={viewMode}
            onQuestionChange={handleQuestionChangeLocal}
          />
        )}

        {(exercise.type === 'synonyms-antonyms' || exercise.type === 'matching-synonyms' || exercise.type === 'matching-antonyms') && exercise.items && (
          <ExerciseSynonymsAntonyms
            items={exercise.items}
            isEditing={isEditing}
            viewMode={viewMode}
            onItemChange={handleItemChangeLocal}
          />
        )}

        {exercise.type === 'sentence-transformation' && exercise.sentences && (
          <ExerciseSentenceTransformation
            sentences={exercise.sentences}
            isEditing={isEditing}
            viewMode={viewMode}
            onSentenceChange={handleSentenceChangeLocal}
          />
        )}

        {exercise.type === 'word-order' && exercise.sentences && (
          <ExerciseWordOrder
            sentences={exercise.sentences}
            isEditing={isEditing}
            viewMode={viewMode}
            onSentenceChange={handleSentenceChangeLocal}
          />
        )}

        {exercise.type === 'gap-text' && exercise.sentences && (
          <ExerciseGapText
            sentences={exercise.sentences}
            isEditing={isEditing}
            viewMode={viewMode}
            onSentenceChange={handleSentenceChangeLocal}
          />
        )}

        {exercise.type === 'negative-prefixes' && exercise.words && (
          <ExerciseNegativePrefixes
            words={exercise.words}
            isEditing={isEditing}
            viewMode={viewMode}
            onWordChange={(wIndex, field, value) => {
              const updatedExercises = [...editableWorksheet.exercises];
              const newWords = [...exercise.words];
              newWords[wIndex] = {
                ...newWords[wIndex],
                [field]: value
              };
              updatedExercises[index] = {
                ...updatedExercises[index],
                words: newWords
              };
              setEditableWorksheet({
                ...editableWorksheet,
                exercises: updatedExercises
              });
            }}
          />
        )}

        {/* New Phase 2 exercises */}
        {exercise.type === 'categorize' && (
          <ExerciseCategorize
            words={exercise.words}
            categories={exercise.categories}
            isEditing={isEditing}
            viewMode={viewMode}
            onWordsChange={(words) => {
              const updatedExercises = [...editableWorksheet.exercises];
              updatedExercises[index] = {
                ...updatedExercises[index],
                words: words
              };
              setEditableWorksheet({
                ...editableWorksheet,
                exercises: updatedExercises
              });
            }}
            onCategoryChange={(cIndex, field, value) => {
              const updatedExercises = [...editableWorksheet.exercises];
              const newCategories = [...exercise.categories];
              newCategories[cIndex] = {
                ...newCategories[cIndex],
                [field]: value
              };
              updatedExercises[index] = {
                ...updatedExercises[index],
                categories: newCategories
              };
              setEditableWorksheet({
                ...editableWorksheet,
                exercises: updatedExercises
              });
            }}
          />
        )}

        {exercise.type === 'paraphrasing' && exercise.sentences && (
          <ExerciseParaphrasing
            sentences={exercise.sentences}
            isEditing={isEditing}
            viewMode={viewMode}
            onSentenceChange={handleSentenceChangeLocal}
          />
        )}

        {exercise.type === 'complete-word' && exercise.words && (
          <ExerciseCompleteWord
            words={exercise.words}
            isEditing={isEditing}
            viewMode={viewMode}
            onWordChange={(wIndex, field, value) => {
              const updatedExercises = [...editableWorksheet.exercises];
              const newWords = [...exercise.words];
              newWords[wIndex] = {
                ...newWords[wIndex],
                [field]: value
              };
              updatedExercises[index] = {
                ...updatedExercises[index],
                words: newWords
              };
              setEditableWorksheet({
                ...editableWorksheet,
                exercises: updatedExercises
              });
            }}
          />
        )}

        {exercise.type === 'matching-halves' && exercise.sentence_halves && (
          <ExerciseMatchingHalves
            sentence_halves={exercise.sentence_halves}
            isEditing={isEditing}
            viewMode={viewMode}
            onHalvesChange={(hIndex, field, value) => {
              const updatedExercises = [...editableWorksheet.exercises];
              const newHalves = [...exercise.sentence_halves];
              newHalves[hIndex] = {
                ...newHalves[hIndex],
                [field]: value
              };
              updatedExercises[index] = {
                ...updatedExercises[index],
                sentence_halves: newHalves
              };
              setEditableWorksheet({
                ...editableWorksheet,
                exercises: updatedExercises
              });
            }}
          />
        )}

        {exercise.type === 'discussion' && exercise.questions && (
          <ExerciseDiscussion
            questions={exercise.questions}
            isEditing={isEditing}
            viewMode={viewMode}
            onQuestionChange={(qIndex, field, value) => {
              const updatedExercises = [...editableWorksheet.exercises];
              const newQuestions = [...exercise.questions];
              newQuestions[qIndex] = {
                ...newQuestions[qIndex],
                [field]: value
              };
              updatedExercises[index] = {
                ...updatedExercises[index],
                questions: newQuestions
              };
              setEditableWorksheet({
                ...editableWorksheet,
                exercises: updatedExercises
              });
            }}
          />
        )}

        {exercise.type === 'error-correction' && exercise.sentences && (
          <ExerciseErrorCorrection
            sentences={exercise.sentences}
            isEditing={isEditing}
            viewMode={viewMode}
            onSentenceChange={(sIndex, field, value) => {
              const updatedExercises = [...editableWorksheet.exercises];
              const newSentences = [...exercise.sentences];
              newSentences[sIndex] = {
                ...newSentences[sIndex],
                [field]: value
              };
              updatedExercises[index] = {
                ...updatedExercises[index],
                sentences: newSentences
              };
              setEditableWorksheet({
                ...editableWorksheet,
                exercises: updatedExercises
              });
            }}
          />
        )}

        {/* Use existing components for basic exercise types */}
        {exercise.type === 'reading' && exercise.content && (
          <div className="prose max-w-none">
            {isEditing ? (
              <textarea
                value={exercise.content}
                onChange={e => handleExerciseChangeLocal('content', e.target.value)}
                className="w-full border p-2 editable-content resize-none"
                rows={6}
              />
            ) : (
              <div className="whitespace-pre-wrap">{exercise.content}</div>
            )}
            {exercise.questions && (
              <div className="mt-4 space-y-2">
                {exercise.questions.map((question: any, qIndex: number) => (
                  <div key={qIndex} className="flex items-start gap-2">
                    <span>{qIndex + 1}.</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={question}
                        onChange={e => {
                          const updatedExercises = [...editableWorksheet.exercises];
                          const newQuestions = [...exercise.questions];
                          newQuestions[qIndex] = e.target.value;
                          updatedExercises[index] = {
                            ...updatedExercises[index],
                            questions: newQuestions
                          };
                          setEditableWorksheet({
                            ...editableWorksheet,
                            exercises: updatedExercises
                          });
                        }}
                        className="flex-grow border p-1 editable-content"
                      />
                    ) : (
                      <span>{question}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {exercise.type === 'true-false' && exercise.statements && (
          <div className="space-y-2">
            {exercise.statements.map((statement: any, sIndex: number) => (
              <div key={sIndex} className="flex items-center gap-3">
                <span>{sIndex + 1}.</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={statement.text}
                    onChange={e => {
                      const updatedExercises = [...editableWorksheet.exercises];
                      const newStatements = [...exercise.statements];
                      newStatements[sIndex] = { ...newStatements[sIndex], text: e.target.value };
                      updatedExercises[index] = {
                        ...updatedExercises[index],
                        statements: newStatements
                      };
                      setEditableWorksheet({
                        ...editableWorksheet,
                        exercises: updatedExercises
                      });
                    }}
                    className="flex-grow border p-1 editable-content"
                  />
                ) : (
                  <span className="flex-grow">{statement.text}</span>
                )}
                <span className="text-sm text-gray-500">T / F</span>
                {viewMode === 'teacher' && (
                  <span className="text-green-600 font-medium">
                    {statement.answer ? 'T' : 'F'}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {exercise.type === 'vocabulary_matching' && exercise.items && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Column A</h4>
              {exercise.items.slice(0, Math.ceil(exercise.items.length / 2)).map((item: any, iIndex: number) => (
                <div key={iIndex} className="flex items-center gap-2 mb-1">
                  <span>{iIndex + 1}.</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={item.term}
                      onChange={e => handleItemChangeLocal(iIndex, 'term', e.target.value)}
                      className="flex-grow border p-1 editable-content"
                    />
                  ) : (
                    <span>{item.term}</span>
                  )}
                </div>
              ))}
            </div>
            <div>
              <h4 className="font-medium mb-2">Column B</h4>
              {exercise.items.slice(0, Math.ceil(exercise.items.length / 2)).map((item: any, iIndex: number) => (
                <div key={iIndex} className="flex items-center gap-2 mb-1">
                  <span>{String.fromCharCode(65 + iIndex)}.</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={item.definition}
                      onChange={e => handleItemChangeLocal(iIndex, 'definition', e.target.value)}
                      className="flex-grow border p-1 editable-content"
                    />
                  ) : (
                    <span>{item.definition}</span>
                  )}
                  {viewMode === 'teacher' && (
                    <span className="text-green-600 text-sm">({iIndex + 1})</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {exercise.type === 'fill_in_the_blanks' && exercise.sentences && (
          <div>
            {exercise.word_bank && (
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <h4 className="font-medium mb-2">Word Bank:</h4>
                <div className="flex flex-wrap gap-2">
                  {exercise.word_bank.map((word: string, wIndex: number) => (
                    <span key={wIndex} className="bg-blue-100 px-2 py-1 rounded text-sm">
                      {isEditing ? (
                        <input
                          type="text"
                          value={word}
                          onChange={e => {
                            const updatedExercises = [...editableWorksheet.exercises];
                            const newWordBank = [...exercise.word_bank];
                            newWordBank[wIndex] = e.target.value;
                            updatedExercises[index] = {
                              ...updatedExercises[index],
                              word_bank: newWordBank
                            };
                            setEditableWorksheet({
                              ...editableWorksheet,
                              exercises: updatedExercises
                            });
                          }}
                          className="border p-1 editable-content w-16"
                        />
                      ) : (
                        word
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-2">
              {exercise.sentences.map((sentence: any, sIndex: number) => (
                <div key={sIndex} className="flex items-center gap-2">
                  <span>{sIndex + 1}.</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={sentence}
                      onChange={e => handleSentenceChangeLocal(sIndex, 'text', e.target.value)}
                      className="flex-grow border p-1 editable-content"
                    />
                  ) : (
                    <span className="flex-grow">{sentence}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {exercise.type === 'multiple_choice' && exercise.questions && (
          <div className="space-y-4">
            {exercise.questions.map((question: any, qIndex: number) => (
              <div key={qIndex} className="border-b pb-3">
                <div className="flex items-start gap-2 mb-2">
                  <span className="font-medium">{qIndex + 1}.</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={question.question}
                      onChange={e => {
                        const updatedExercises = [...editableWorksheet.exercises];
                        const newQuestions = [...exercise.questions];
                        newQuestions[qIndex] = { ...newQuestions[qIndex], question: e.target.value };
                        updatedExercises[index] = {
                          ...updatedExercises[index],
                          questions: newQuestions
                        };
                        setEditableWorksheet({
                          ...editableWorksheet,
                          exercises: updatedExercises
                        });
                      }}
                      className="flex-grow border p-1 editable-content"
                    />
                  ) : (
                    <span className="flex-grow">{question.question}</span>
                  )}
                </div>
                <div className="ml-6 space-y-1">
                  {question.options.map((option: string, oIndex: number) => (
                    <div key={oIndex} className="flex items-center gap-2">
                      <span>{String.fromCharCode(97 + oIndex)})</span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={option}
                          onChange={e => {
                            const updatedExercises = [...editableWorksheet.exercises];
                            const newQuestions = [...exercise.questions];
                            const newOptions = [...newQuestions[qIndex].options];
                            newOptions[oIndex] = e.target.value;
                            newQuestions[qIndex] = { ...newQuestions[qIndex], options: newOptions };
                            updatedExercises[index] = {
                              ...updatedExercises[index],
                              questions: newQuestions
                            };
                            setEditableWorksheet({
                              ...editableWorksheet,
                              exercises: updatedExercises
                            });
                          }}
                          className="flex-grow border p-1 editable-content"
                        />
                      ) : (
                        <span>{option}</span>
                      )}
                      {viewMode === 'teacher' && question.correct === oIndex && (
                        <span className="text-green-600 font-bold">✓</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {exercise.type === 'dialogue' && exercise.dialogue && (
          <div className="space-y-3">
            {exercise.dialogue.map((line: any, dIndex: number) => (
              <div key={dIndex} className="flex items-start gap-3">
                <span className="font-medium text-blue-600">{line.speaker}:</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={line.text}
                    onChange={e => {
                      const updatedExercises = [...editableWorksheet.exercises];
                      const newDialogue = [...exercise.dialogue];
                      newDialogue[dIndex] = { ...newDialogue[dIndex], text: e.target.value };
                      updatedExercises[index] = {
                        ...updatedExercises[index],
                        dialogue: newDialogue
                      };
                      setEditableWorksheet({
                        ...editableWorksheet,
                        exercises: updatedExercises
                      });
                    }}
                    className="flex-grow border p-1 editable-content"
                  />
                ) : (
                  <span className="flex-grow">{line.text}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Poprawione wywołanie komponentu TeacherTipSection z dodanym parametrem viewMode */}
        <TeacherTipSection
          tip={exercise.teacher_tip}
          isEditing={isEditing}
          onChange={handleTeacherTipChangeLocal}
          viewMode={viewMode}
        />
      </div>
    </div>
  );
};

export default ExerciseSection;
