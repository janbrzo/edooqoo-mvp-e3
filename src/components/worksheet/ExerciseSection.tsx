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
import ExerciseListeningComprehension from "./ExerciseListeningComprehension";
import ExerciseMultipleChoiceAudio from "./ExerciseMultipleChoiceAudio";
import ExerciseTrueFalseAudio from "./ExerciseTrueFalseAudio";
import ExerciseFillInBlanksAudio from "./ExerciseFillInBlanksAudio";
import ExerciseAnswerQuestionsAudio from "./ExerciseAnswerQuestionsAudio";
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
  renderOtherExerciseTypes
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
  originalIndex?: number;
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
  // New: Hide exercise-level media if Lesson Media section exists
  hideExerciseMedia?: boolean;
  // Interactive homework props
  isInteractive?: boolean;
  studentAnswers?: Record<number, any>;
  onAnswerChange?: (questionIndex: number, value: any) => void;
  showCorrectAnswers?: boolean;
}

// Helper function to normalize exercise type (removes -picture suffix for rendering logic)
const normalizeExerciseType = (type: string): string => {
  return type.replace('-picture', '');
};

// Helper function to update exercise number in title for display
const updateExerciseNumber = (title: string, newNumber: number): string => {
  // Match "Exercise X:" at the start of the title
  const match = title.match(/^Exercise\s+\d+:\s*(.*)$/i);
  if (match) {
    // Replace with new number, keeping the rest of the title
    return `Exercise ${newNumber}: ${match[1]}`;
  }
  // If no match, return title as is
  return title;
};

const ExerciseSection = forwardRef<HTMLDivElement, ExerciseSectionProps>(({
  exercise,
  index,
  originalIndex,
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
  hideExerciseMedia = false,
  // Interactive props
  isInteractive = false,
  studentAnswers = {},
  onAnswerChange,
  showCorrectAnswers = false,
}, ref) => {
  // Use originalIndex for array operations, index for display
  const arrayIndex = originalIndex !== undefined ? originalIndex : index - 1;
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

  // Normalize exercise type for conditional rendering (handle both standard and -picture types)
  const normalizedType = normalizeExerciseType(exercise.type);
  
  // DEBUG: Log structure for answer-questions-picture to diagnose editing issues
  if (exercise.type === 'answer-questions-picture') {
    console.log('[DEBUG] Answer Questions Picture exercise structure:', {
      type: exercise.type,
      hasQuestions: !!exercise.questions,
      questionsType: Array.isArray(exercise.questions) ? 'array' : typeof exercise.questions,
      questionsSample: Array.isArray(exercise.questions) ? exercise.questions[0] : exercise.questions,
      keys: Object.keys(exercise),
      fullExercise: exercise
    });
  }
  
  // ✅ Check BOTH sources for selected image (Unsplash OR AI-generated)
  const hasSelectedImage = originalFormData?.selectedImage || editableWorksheet?.selected_image;

  // Calculate showImage: hide if hideExerciseMedia=true OR hasSelectedImage
  const showImage = !hideExerciseMedia && !hasSelectedImage;

  const handleRegenerateClick = () => {
    console.log('🔄 [REGENERATE] Opening modal:', { 
      displayIndex: index, 
      arrayIndex, 
      exerciseType: exercise.type,
      worksheetId,
      hasOriginalFormData: !!originalFormData,
      hasUserId: !!userId
    });
    openModal(arrayIndex); // FIXED: Use arrayIndex instead of index
  };

  const handleRegenerateConfirm = async () => {
    if (!worksheetId || !originalFormData || !userId) {
      console.error('Missing required data for regeneration');
      return;
    }

    await regenerateExercise(
      worksheetId,
      arrayIndex,
      originalFormData,
      exercise,
      editableWorksheet,
      setEditableWorksheet,
      userId
    );
  };

  const isRegenerating = isLoading && loadingExerciseIndex === arrayIndex;
  // Exercise update handlers using the utility functions
  const handleExerciseChangeLocal = (field: string, value: string) => {
    handleExerciseChange(editableWorksheet, setEditableWorksheet, arrayIndex, field, value);
  };

  const handleQuestionChangeLocal = (questionIndex: number, field: string, value: string) => {
    handleQuestionChange(editableWorksheet, setEditableWorksheet, arrayIndex, questionIndex, field, value);
  };

  const handleItemChangeLocal = (itemIndex: number, field: string, value: string) => {
    handleItemChange(editableWorksheet, setEditableWorksheet, arrayIndex, itemIndex, field, value);
  };

  const handleSentenceChangeLocal = (sentenceIndex: number, field: string, value: string) => {
    handleSentenceChange(editableWorksheet, setEditableWorksheet, arrayIndex, sentenceIndex, field, value);
  };

  const handleExpressionChangeLocal = (expressionIndex: number, value: string) => {
    handleExpressionChange(editableWorksheet, setEditableWorksheet, arrayIndex, expressionIndex, value);
  };

  const handleTeacherTipChangeLocal = (value: string) => {
    handleTeacherTipChange(editableWorksheet, setEditableWorksheet, arrayIndex, value);
  };

  const handleDialogueChangeLocal = (dialogueIndex: number, field: string, value: string) => {
    handleDialogueChange(editableWorksheet, setEditableWorksheet, arrayIndex, dialogueIndex, field, value);
  };
  
  const handleStatementChangeLocal = (statementIndex: number, field: string, value: string | boolean) => {
    handleStatementChange(editableWorksheet, setEditableWorksheet, arrayIndex, statementIndex, field, value);
  };

  return (
    <>
      <div ref={ref} className="mb-4 bg-white border rounded-lg overflow-hidden shadow-sm relative">
        <ExerciseHeader
          icon={exercise.icon}
          title={updateExerciseNumber(exercise.title, index)}
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
        
        <ExerciseContent
          instructions={exercise.instructions}
          isEditing={isEditing}
          onInstructionsChange={val => handleExerciseChangeLocal('instructions', val)}
          content={exercise.content}
          onContentChange={val => handleExerciseChangeLocal('content', val)}
        />

        {normalizedType === 'reading' && exercise.questions && (
          <ExerciseReading
            questions={exercise.questions}
            isEditing={isEditing}
            viewMode={viewMode}
            onQuestionChange={handleQuestionChangeLocal}
            isInteractive={isInteractive}
            studentAnswers={studentAnswers}
            onAnswerChange={onAnswerChange}
            showCorrectAnswers={showCorrectAnswers}
          />
        )}

        {normalizedType === 'matching' && exercise.items && (
          <ExerciseMatching
            items={exercise.items}
            isEditing={isEditing}
            viewMode={viewMode}
            getMatchedItems={() => getMatchedItems(exercise.items, viewMode)}
            onItemChange={handleItemChangeLocal}
            isInteractive={isInteractive}
            studentAnswers={studentAnswers}
            onAnswerChange={onAnswerChange}
            showCorrectAnswers={showCorrectAnswers}
          />
        )}

        {normalizedType === 'fill-in-blanks' && exercise.sentences && (
          <ExerciseFillInBlanks
            word_bank={exercise.word_bank}
            sentences={exercise.sentences}
            isEditing={isEditing}
            viewMode={viewMode}
            onWordBankChange={(wIndex, value) => {
              const newWordBank = [...exercise.word_bank!];
              newWordBank[wIndex] = value;
              const updatedExercises = [...editableWorksheet.exercises];
              updatedExercises[arrayIndex] = {
                ...updatedExercises[arrayIndex],
                word_bank: newWordBank
              };
              setEditableWorksheet({
                ...editableWorksheet,
                exercises: updatedExercises
              });
            }}
            onSentenceChange={handleSentenceChangeLocal}
            isInteractive={isInteractive}
            studentAnswers={studentAnswers}
            onAnswerChange={onAnswerChange}
            showCorrectAnswers={showCorrectAnswers}
          />
        )}

        {normalizedType === 'multiple-choice' && exercise.questions && (
          <ExerciseMultipleChoice
            questions={exercise.questions}
            isEditing={isEditing}
            viewMode={viewMode}
            onQuestionTextChange={(qIndex, value) => handleQuestionChangeLocal(qIndex, 'text', value)}
            onOptionTextChange={(qIndex, oIndex, value) => {
              const updatedExercises = [...editableWorksheet.exercises];
              const question = updatedExercises[arrayIndex].questions[qIndex];
              const newOptions = [...question.options];
              newOptions[oIndex] = {
                ...newOptions[oIndex],
                text: value
              };
              updatedExercises[arrayIndex].questions[qIndex] = {
                ...question,
                options: newOptions
              };
              setEditableWorksheet({
                ...editableWorksheet,
                exercises: updatedExercises
              });
            }}
            isInteractive={isInteractive}
            studentAnswers={studentAnswers}
            onAnswerChange={onAnswerChange}
            showCorrectAnswers={showCorrectAnswers}
          />
        )}

        {normalizedType === 'dialogue' && exercise.dialogue && (
          <ExerciseDialogue
            dialogue={exercise.dialogue}
            expressions={exercise.expressions}
            expression_instruction={exercise.expression_instruction}
            isEditing={isEditing}
            viewMode={viewMode}
            onDialogueChange={handleDialogueChangeLocal}
            onExpressionChange={handleExpressionChangeLocal}
            onExpressionInstructionChange={val => handleExerciseChangeLocal('expression_instruction', val)}
            isInteractive={isInteractive}
            studentAnswers={studentAnswers}
            onAnswerChange={onAnswerChange}
            showCorrectAnswers={showCorrectAnswers}
          />
        )}

        {normalizedType === 'discussion' && exercise.questions && (
          <div className="space-y-2">
            <h3 className="font-medium text-gray-700 mb-2">Discussion Questions:</h3>
            {exercise.questions.map((question: string, qIndex: number) => {
              const studentAnswer = studentAnswers[qIndex] || '';
              const hasNoAnswer = showCorrectAnswers && !studentAnswer;
              
              return (
                <div key={qIndex} className="p-2 border rounded-lg bg-white">
                  <p className="leading-snug font-medium mb-2">
                    {isEditing ? (
                      <input
                        type="text"
                        value={question}
                        onChange={e => {
                          const updatedExercises = [...editableWorksheet.exercises];
                          const newQuestions = [...exercise.questions!];
                          newQuestions[qIndex] = e.target.value;
                          updatedExercises[arrayIndex] = {
                            ...updatedExercises[arrayIndex],
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
                  {isInteractive && (
                    <input
                      type="text"
                      value={studentAnswer}
                      onChange={(e) => onAnswerChange?.(qIndex, e.target.value)}
                      placeholder="Type your answer..."
                      className={`w-full border p-2 rounded h-10 ${hasNoAnswer ? 'border-2 border-red-400 bg-red-100' : ''}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {(normalizedType === 'error-correction' || normalizedType === 'word-formation') && 
          exercise.sentences && renderOtherExerciseTypes(exercise, isEditing, viewMode, handleSentenceChangeLocal)}
        
        {normalizedType === 'true-false' && exercise.statements && (
          <ExerciseTrueFalseAudio
            statements={exercise.statements}
            audio_url={undefined}
            isEditing={isEditing}
            viewMode={viewMode}
            onStatementChange={handleStatementChangeLocal}
            isInteractive={isInteractive}
            studentAnswers={studentAnswers}
            onAnswerChange={onAnswerChange}
            showCorrectAnswers={showCorrectAnswers}
          />
        )}

        {/* New Phase 1 exercises */}
        {normalizedType === 'odd-one-out' && exercise.questions && (
          <ExerciseOddOneOut
            questions={exercise.questions}
            isEditing={isEditing}
            viewMode={viewMode}
            onQuestionChange={handleQuestionChangeLocal}
            isInteractive={isInteractive}
            studentAnswers={studentAnswers}
            onAnswerChange={onAnswerChange}
            showCorrectAnswers={showCorrectAnswers}
          />
        )}

      {(normalizedType === 'synonyms-antonyms' || normalizedType === 'synonyms' || normalizedType === 'antonyms') && exercise.items && (
          <ExerciseSynonymsAntonyms
            items={exercise.items}
            isEditing={isEditing}
            viewMode={viewMode}
            onItemChange={handleItemChangeLocal}
            exerciseType={normalizedType}
            isInteractive={isInteractive}
            studentAnswers={studentAnswers}
            onAnswerChange={onAnswerChange}
            showCorrectAnswers={showCorrectAnswers}
          />
        )}

        {normalizedType === 'sentence-transformation' && exercise.sentences && (
          <ExerciseSentenceTransformation
            sentences={exercise.sentences}
            isEditing={isEditing}
            viewMode={viewMode}
            onSentenceChange={handleSentenceChangeLocal}
            isInteractive={isInteractive}
            studentAnswers={studentAnswers}
            onAnswerChange={onAnswerChange}
            showCorrectAnswers={showCorrectAnswers}
          />
        )}

        {normalizedType === 'word-order' && exercise.sentences && (
          <ExerciseWordOrder
            sentences={exercise.sentences}
            isEditing={isEditing}
            viewMode={viewMode}
            onSentenceChange={handleSentenceChangeLocal}
            isInteractive={isInteractive}
            studentAnswers={studentAnswers}
            onAnswerChange={onAnswerChange}
            showCorrectAnswers={showCorrectAnswers}
          />
        )}

        {normalizedType === 'gap-text' && exercise.sentences && (
          <ExerciseGapText
            sentences={exercise.sentences}
            isEditing={isEditing}
            viewMode={viewMode}
            onSentenceChange={handleSentenceChangeLocal}
            isInteractive={isInteractive}
            studentAnswers={studentAnswers}
            onAnswerChange={onAnswerChange}
            showCorrectAnswers={showCorrectAnswers}
          />
        )}

        {normalizedType === 'negative-prefixes' && exercise.words && (
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
              updatedExercises[arrayIndex] = {
                ...updatedExercises[arrayIndex],
                words: newWords
              };
              setEditableWorksheet({
                ...editableWorksheet,
                exercises: updatedExercises
              });
            }}
            isInteractive={isInteractive}
            studentAnswers={studentAnswers}
            onAnswerChange={onAnswerChange}
            showCorrectAnswers={showCorrectAnswers}
          />
        )}

        {/* New Phase 2 exercises */}
        {normalizedType === 'categorize' && (
          <ExerciseCategorize
            items={exercise.items}
            words={exercise.words}
            categories={exercise.categories}
            isEditing={isEditing}
            viewMode={viewMode}
            onWordsChange={(words) => {
              const updatedExercises = [...editableWorksheet.exercises];
              updatedExercises[arrayIndex] = {
                ...updatedExercises[arrayIndex],
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
              updatedExercises[arrayIndex] = {
                ...updatedExercises[arrayIndex],
                categories: newCategories
              };
              setEditableWorksheet({
                ...editableWorksheet,
                exercises: updatedExercises
              });
            }}
            isInteractive={isInteractive}
            studentAnswers={studentAnswers}
            onAnswerChange={onAnswerChange}
            showCorrectAnswers={showCorrectAnswers}
          />
        )}

        {normalizedType === 'paraphrasing' && exercise.sentences && (
          <ExerciseParaphrasing
            sentences={exercise.sentences}
            isEditing={isEditing}
            viewMode={viewMode}
            onSentenceChange={handleSentenceChangeLocal}
            isInteractive={isInteractive}
            studentAnswers={studentAnswers}
            onAnswerChange={onAnswerChange}
            showCorrectAnswers={showCorrectAnswers}
          />
        )}

        {normalizedType === 'complete-word' && exercise.words && (
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
              updatedExercises[arrayIndex] = {
                ...updatedExercises[arrayIndex],
                words: newWords
              };
              setEditableWorksheet({
                ...editableWorksheet,
                exercises: updatedExercises
              });
            }}
            isInteractive={isInteractive}
            studentAnswers={studentAnswers}
            onAnswerChange={onAnswerChange}
            showCorrectAnswers={showCorrectAnswers}
          />
        )}

        {normalizedType === 'matching-halves' && exercise.sentence_halves && (
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
              updatedExercises[arrayIndex] = {
                ...updatedExercises[arrayIndex],
                sentence_halves: newHalves
              };
              setEditableWorksheet({
                ...editableWorksheet,
                exercises: updatedExercises
              });
            }}
            isInteractive={isInteractive}
            studentAnswers={studentAnswers}
            onAnswerChange={onAnswerChange}
            showCorrectAnswers={showCorrectAnswers}
          />
        )}

        {/* New additional exercise types */}
        {normalizedType === 'describe-picture' && (
          <ExerciseDescribe
            image_url={exercise.image_url || hasSelectedImage?.unsplash_url || hasSelectedImage?.ai_generated_url}
            questions={exercise.prompts || exercise.questions || []}
            isEditing={isEditing}
            viewMode={viewMode}
            showImage={true}
            onQuestionChange={(qIndex, field, value) => {
              const updatedExercises = [...editableWorksheet.exercises];
              const newPrompts = [...(exercise.prompts || exercise.questions || [])];
              
              if (field === 'text' || field === 'question') {
                newPrompts[qIndex] = value;
              }
              
              updatedExercises[arrayIndex] = {
                ...updatedExercises[arrayIndex],
                prompts: newPrompts
              };
              
              setEditableWorksheet({
                ...editableWorksheet,
                exercises: updatedExercises
              });
            }}
            onImageUrlChange={(url) => handleExerciseChangeLocal('image_url', url)}
            isInteractive={isInteractive}
            studentAnswers={studentAnswers}
            onAnswerChange={onAnswerChange}
            showCorrectAnswers={showCorrectAnswers}
          />
        )}

        {normalizedType === 'answer-questions' && exercise.questions && (
          <ExerciseAnswerQuestions
            media_url={hasSelectedImage ? undefined : exercise.media_url}
            media_type={exercise.media_type}
            questions={exercise.questions}
            isEditing={isEditing}
            viewMode={viewMode}
            showImage={showImage}
            hideExerciseMedia={hideExerciseMedia}
            onQuestionChange={handleQuestionChangeLocal}
            onMediaUrlChange={(url) => handleExerciseChangeLocal('media_url', url)}
            onMediaTypeChange={(type) => handleExerciseChangeLocal('media_type', type)}
            isInteractive={isInteractive}
            studentAnswers={studentAnswers}
            onAnswerChange={onAnswerChange}
            showCorrectAnswers={showCorrectAnswers}
          />
        )}

        {/* Audio exercises */}
        {normalizedType === 'listening-comprehension' && exercise.questions && (
          <ExerciseListeningComprehension
            questions={exercise.questions}
            audio_url={exercise.audio_url}
            isEditing={isEditing}
            viewMode={viewMode}
            onQuestionChange={handleQuestionChangeLocal}
            isInteractive={isInteractive}
            studentAnswers={studentAnswers}
            onAnswerChange={onAnswerChange}
            showCorrectAnswers={showCorrectAnswers}
          />
        )}

        {normalizedType === 'multiple-choice-audio' && exercise.questions && (
          <ExerciseMultipleChoiceAudio
            questions={exercise.questions}
            audio_url={exercise.audio_url}
            isEditing={isEditing}
            viewMode={viewMode}
            onQuestionChange={handleQuestionChangeLocal}
            isInteractive={isInteractive}
            studentAnswers={studentAnswers}
            onAnswerChange={onAnswerChange}
            showCorrectAnswers={showCorrectAnswers}
          />
        )}

        {normalizedType === 'true-false-audio' && exercise.statements && (
          <ExerciseTrueFalseAudio
            statements={exercise.statements}
            audio_url={exercise.audio_url}
            isEditing={isEditing}
            viewMode={viewMode}
            onStatementChange={handleStatementChangeLocal}
            isInteractive={isInteractive}
            studentAnswers={studentAnswers}
            onAnswerChange={onAnswerChange}
            showCorrectAnswers={showCorrectAnswers}
          />
        )}

        {normalizedType === 'fill-in-blanks-audio' && (
          <ExerciseFillInBlanksAudio
            word_bank={exercise.word_bank}
            sentences={exercise.sentences}
            transcript_with_blanks={exercise.transcript_with_blanks}
            answers={exercise.answers}
            audio_url={exercise.audio_url}
            isEditing={isEditing}
            viewMode={viewMode}
            onWordBankChange={(wIndex, value) => {
              const newWordBank = [...(exercise.word_bank || [])];
              newWordBank[wIndex] = value;
              const updatedExercises = [...editableWorksheet.exercises];
              updatedExercises[arrayIndex] = {
                ...updatedExercises[arrayIndex],
                word_bank: newWordBank
              };
              setEditableWorksheet({
                ...editableWorksheet,
                exercises: updatedExercises
              });
            }}
            onSentenceChange={handleSentenceChangeLocal}
            onTranscriptChange={(value) => handleExerciseChangeLocal('transcript_with_blanks', value)}
            onAnswersChange={(value) => {
              const answersArray = typeof value === 'string' ? value.split(',').map(a => a.trim()) : value;
              const updatedExercises = [...editableWorksheet.exercises];
              updatedExercises[arrayIndex] = {
                ...updatedExercises[arrayIndex],
                answers: answersArray
              };
              setEditableWorksheet({
                ...editableWorksheet,
                exercises: updatedExercises
              });
            }}
            isInteractive={isInteractive}
            studentAnswers={studentAnswers}
            onAnswerChange={onAnswerChange}
            showCorrectAnswers={showCorrectAnswers}
          />
        )}

        {normalizedType === 'answer-questions-audio' && exercise.questions && (
          <ExerciseAnswerQuestionsAudio
            questions={exercise.questions}
            audio_url={exercise.audio_url}
            isEditing={isEditing}
            viewMode={viewMode}
            onQuestionChange={handleQuestionChangeLocal}
            isInteractive={isInteractive}
            studentAnswers={studentAnswers}
            onAnswerChange={onAnswerChange}
            showCorrectAnswers={showCorrectAnswers}
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
        isOpen={isModalOpen && loadingExerciseIndex === arrayIndex}
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
