import React, { useEffect, useCallback, forwardRef } from "react";
import { toast } from "@/hooks/use-toast";
import { updateWorksheet } from "@/services/worksheetService";
import { useExerciseRegeneration } from "@/hooks/useExerciseRegeneration";
import TeacherTipSection from "./TeacherTipSection";
import ExerciseRegenerateModal from "./ExerciseRegenerateModal";
import ExerciseHeader from "./ExerciseHeader";
import ExerciseContent from "./ExerciseContent";
import MediaDisplay from "./MediaDisplay";
import ExerciseReading from "./ExerciseReading";
import ExerciseMatching from "./ExerciseMatching";
import ExerciseFillInBlanks from "./ExerciseFillInBlanks";
import ExerciseMultipleChoice from "./ExerciseMultipleChoice";
import ExerciseOddOneOut from "./ExerciseOddOneOut";
import ExerciseDialogue from "./ExerciseDialogue";
import ExerciseDescribe from "./ExerciseDescribe";
import ExerciseAnswerQuestions from "./ExerciseAnswerQuestions";
import ExerciseGapText from "./ExerciseGapText";
import ExerciseMatchingHalves from "./ExerciseMatchingHalves";
import ExerciseCompleteWord from "./ExerciseCompleteWord";
import ExerciseCategorize from "./ExerciseCategorize";
import ExerciseParaphrasing from "./ExerciseParaphrasing";
import ExerciseSentenceTransformation from "./ExerciseSentenceTransformation";
import ExerciseNegativePrefixes from "./ExerciseNegativePrefixes";
import ExerciseWordOrder from "./ExerciseWordOrder";
import ExerciseSynonymsAntonyms from "./ExerciseSynonymsAntonyms";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
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
  // Soft delete support
  deleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
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
  worksheetId?: string;
  originalFormData?: any;
  userId?: string;
  // Exercise management props
  totalExercises?: number;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDeleteExercise?: () => void;
  // New collapse functionality
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const ExerciseSection = forwardRef<HTMLDivElement, ExerciseSectionProps>(({
  exercise,
  index,
  isEditing,
  viewMode,
  editableWorksheet,
  setEditableWorksheet,
  worksheetId,
  originalFormData,
  userId,
  totalExercises = 0,
  onMoveUp,
  onMoveDown,
  onDeleteExercise,
  isCollapsed = false,
  onToggleCollapse,
}, ref) => {
  const {
    isModalOpen,
    isLoading,
    loadingExerciseIndex,
    guidelines,
    openModal,
    closeModal,
    setGuidelines,
    regenerateExercise
  } = useExerciseRegeneration();

  const handleRegenerateClick = () => {
    openModal(index);
  };

  const handleRegenerateConfirm = async () => {
    if (!worksheetId || !originalFormData || !userId) {
      console.error('Missing required data for regeneration');
      return;
    }

    await regenerateExercise(
      worksheetId,
      index,
      originalFormData,
      exercise,
      editableWorksheet,
      setEditableWorksheet,
      userId
    );
  };

  const isRegenerating = isLoading && loadingExerciseIndex === index;
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
    <>
      <div ref={ref} className="mb-4 bg-white border rounded-lg overflow-hidden shadow-sm relative">
        <ExerciseHeader
          icon={exercise.icon}
          title={exercise.title}
          isEditing={isEditing}
          time={exercise.time}
          onTitleChange={val => handleExerciseChangeLocal('title', val)}
          canRegenerate={!!(worksheetId && originalFormData && userId)}
          isRegenerating={isRegenerating}
          onRegenerateClick={handleRegenerateClick}
          canMoveUp={index > 0}
          canMoveDown={index < totalExercises - 1}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onDelete={onDeleteExercise}
        />

        <Collapsible open={!isCollapsed} onOpenChange={() => onToggleCollapse?.()}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start px-5 pb-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ChevronDown className={cn("h-4 w-4 mr-2 transition-transform", isCollapsed && "rotate-180")} />
              {isCollapsed ? 'Expand exercise content' : 'Collapse exercise content'}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="animate-accordion-down data-[state=closed]:animate-accordion-up">
            <div className="p-5 pt-0">
        {/* Media Display for picture exercises */}
        {exercise.media?.type === 'picture' && exercise.media.url && (
          <MediaDisplay
            imageUrl={exercise.media.url}
            photographer={exercise.media.photographer}
            photographerUrl={exercise.media.photographerUrl}
            description={exercise.media.description}
          />
        )}
        
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

        {(exercise.type === 'error-correction' || exercise.type === 'word-formation') && 
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
            items={exercise.items}
            words={exercise.words}
            categories={exercise.categories}
            isEditing={isEditing}
            viewMode={viewMode}
            onWordsChange={(words) => {
              const updatedExercises = [...editableWorksheet.exercises];
              updatedExercises[index] = {
                ...updatedExercises[index],
                words: words,
                items: words
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

        {/* New additional exercise types */}
        {exercise.type === 'describe' && (
          <ExerciseDescribe
            image_url={exercise.image_url}
            questions={exercise.questions}
            isEditing={isEditing}
            viewMode={viewMode}
            onQuestionChange={handleQuestionChangeLocal}
            onImageUrlChange={(url) => handleExerciseChangeLocal('image_url', url)}
          />
        )}

        {exercise.type === 'answer-questions' && exercise.questions && (
          <ExerciseAnswerQuestions
            media_url={exercise.media_url}
            media_type={exercise.media_type}
            questions={exercise.questions}
            isEditing={isEditing}
            viewMode={viewMode}
            onQuestionChange={handleQuestionChangeLocal}
            onMediaUrlChange={(url) => handleExerciseChangeLocal('media_url', url)}
            onMediaTypeChange={(type) => handleExerciseChangeLocal('media_type', type)}
          />
        )}

        {/* Poprawione wywołanie komponentu TeacherTipSection z dodanym parametrem viewMode */}
        <TeacherTipSection
          tip={exercise.teacher_tip}
          isEditing={isEditing}
          onChange={handleTeacherTipChangeLocal}
          viewMode={viewMode}
        />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Regeneration Modal */}
      <ExerciseRegenerateModal
        isOpen={isModalOpen && loadingExerciseIndex === index}
        onClose={closeModal}
        onConfirm={handleRegenerateConfirm}
        guidelines={guidelines}
        onGuidelinesChange={setGuidelines}
        exerciseType={exercise.type}
        exerciseTitle={exercise.title}
      />
    </>
  );
});

ExerciseSection.displayName = "ExerciseSection";

export default ExerciseSection;
