/**
 * HomeworkExerciseRenderer - renders exercises in the same style as SharedWorksheetContent
 * Used by HomeworkPage to ensure visual consistency between Homework and SharedWorksheet
 */
import React from 'react';
import { Clock } from 'lucide-react';
import { getIconComponent } from '@/utils/iconUtils';
import { safeGetText } from '@/utils/textObjectFixer';
import { AiEvaluationBadge, AiEvaluation } from './AiEvaluationBadge';

// Exercise components
import ExerciseMatching from '@/components/worksheet/ExerciseMatching';
import ExerciseFillInBlanks from '@/components/worksheet/ExerciseFillInBlanks';
import ExerciseMultipleChoice from '@/components/worksheet/ExerciseMultipleChoice';
import ExerciseReading from '@/components/worksheet/ExerciseReading';
import ExerciseDialogue from '@/components/worksheet/ExerciseDialogue';
import ExerciseWordOrder from '@/components/worksheet/ExerciseWordOrder';
import ExerciseNegativePrefixes from '@/components/worksheet/ExerciseNegativePrefixes';
import ExerciseCategorize from '@/components/worksheet/ExerciseCategorize';
import ExerciseParaphrasing from '@/components/worksheet/ExerciseParaphrasing';
import ExerciseCompleteWord from '@/components/worksheet/ExerciseCompleteWord';
import ExerciseOddOneOut from '@/components/worksheet/ExerciseOddOneOut';
import ExerciseGapText from '@/components/worksheet/ExerciseGapText';
import ExerciseSentenceTransformation from '@/components/worksheet/ExerciseSentenceTransformation';
import ExerciseMatchingHalves from '@/components/worksheet/ExerciseMatchingHalves';
import ExerciseSynonymsAntonyms from '@/components/worksheet/ExerciseSynonymsAntonyms';
import ExerciseListeningComprehension from '@/components/worksheet/ExerciseListeningComprehension';
import ExerciseAnswerQuestionsAudio from '@/components/worksheet/ExerciseAnswerQuestionsAudio';
import ExerciseTrueFalseAudio from '@/components/worksheet/ExerciseTrueFalseAudio';
import ExerciseMultipleChoiceAudio from '@/components/worksheet/ExerciseMultipleChoiceAudio';
import ExerciseFillInBlanksAudio from '@/components/worksheet/ExerciseFillInBlanksAudio';
import ExerciseDescribe from '@/components/worksheet/ExerciseDescribe';
import ExerciseAnswerQuestions from '@/components/worksheet/ExerciseAnswerQuestions';

interface HomeworkExerciseRendererProps {
  exercise: any;
  index: number;
  homeworkId: string;
  isInteractive: boolean;
  studentAnswers: Record<number, any>;
  onAnswerChange: (questionIndex: number, value: any) => void;
  showCorrectAnswers: boolean;
  disabled: boolean;
  viewMode: 'student' | 'teacher';
  aiEvaluation?: AiEvaluation; // PROBLEM 4.1: AI evaluation for open-ended exercises
}

// Helper function to normalize exercise type (removes -picture and -audio suffixes for component matching)
const normalizeExerciseType = (type: string): string => {
  return type.replace('-picture', '').replace('-audio', '');
};

// Open-ended exercise types that can have AI evaluation
const OPEN_ENDED_TYPES = [
  'reading', 'discussion', 'describe', 'answer-questions', 
  'dialogue', 'answer-questions-audio', 'describe-picture',
  'answer-questions-picture', 'paraphrasing', 'speaking',
  'sentence-transformation', 'essay', 'gap-text', 'word-order',
  'error-correction'
];

const HomeworkExerciseRenderer: React.FC<HomeworkExerciseRendererProps> = ({
  exercise,
  index,
  homeworkId,
  isInteractive,
  studentAnswers,
  onAnswerChange,
  showCorrectAnswers,
  disabled,
  viewMode,
  aiEvaluation
}) => {
  const normalizedType = normalizeExerciseType(exercise.type);
  const isOpenEnded = OPEN_ENDED_TYPES.includes(exercise.type) || OPEN_ENDED_TYPES.includes(normalizedType);
  
  // Render the exercise title - matching SharedWorksheetContent style exactly
  const renderTitle = () => {
    if (exercise.title?.toLowerCase().startsWith('exercise')) {
      return exercise.title;
    }
    return `Exercise ${index + 1}: ${exercise.title || 'Untitled Exercise'}`;
  };

  return (
    <div className="mb-6 bg-white border rounded-lg overflow-hidden shadow-sm">
      {/* Header - IDENTICAL to SharedWorksheetContent */}
      <div className="bg-worksheet-purple text-white p-2 flex justify-between items-center exercise-header">
        <div className="flex items-center">
          <div className="p-2 bg-white/20 rounded-full mr-3">
            {getIconComponent(exercise.icon || 'fa-book-open')}
          </div>
          <h3 className="text-lg font-semibold">
            {renderTitle()}
          </h3>
        </div>
        <div className="flex items-center bg-white/20 px-3 py-1 rounded-md">
          <Clock className="h-4 w-4 mr-1" />
          <span className="text-sm">{exercise.time || exercise.estimated_time || 10} min</span>
        </div>
      </div>
      
      {/* Content - IDENTICAL padding to SharedWorksheetContent */}
      <div className="p-5">
        {exercise.instructions && (
          <p className="font-medium mb-4 leading-snug">
            {exercise.instructions}
          </p>
        )}
        
        {exercise.content && (
          <div className="mb-4 p-4 bg-gray-50 rounded-md">
            <p className="whitespace-pre-line leading-snug">{exercise.content}</p>
          </div>
        )}
        
        {/* Type-specific exercise rendering - IDENTICAL to SharedWorksheetContent */}
        {normalizedType === 'reading' && exercise.questions && (
          <ExerciseReading
            questions={exercise.questions}
            isEditing={false}
            viewMode={viewMode}
            onQuestionChange={() => {}}
            isInteractive={isInteractive}
            studentAnswers={studentAnswers}
            onAnswerChange={onAnswerChange}
          />
        )}

        {exercise.type === 'matching' && exercise.items && (
          <ExerciseMatching
            items={exercise.items}
            isEditing={false}
            viewMode={viewMode}
            getMatchedItems={() => exercise.items}
            onItemChange={() => {}}
            isInteractive={isInteractive}
            studentAnswers={studentAnswers}
            onAnswerChange={onAnswerChange}
            showCorrectAnswers={showCorrectAnswers}
            disabled={disabled}
            worksheetId={homeworkId}
          />
        )}

        {exercise.type === 'fill-in-blanks' && exercise.sentences && (
          <ExerciseFillInBlanks
            word_bank={exercise.word_bank}
            sentences={exercise.sentences}
            isEditing={false}
            viewMode={viewMode}
            onWordBankChange={() => {}}
            onSentenceChange={() => {}}
            isInteractive={isInteractive}
            studentAnswers={studentAnswers}
            onAnswerChange={onAnswerChange}
            showCorrectAnswers={showCorrectAnswers}
            disabled={disabled}
          />
        )}

        {(exercise.type === 'multiple-choice' || exercise.type === 'multiple-choice-picture') && exercise.questions && (
          <ExerciseMultipleChoice
            questions={exercise.questions}
            isEditing={false}
            viewMode={viewMode}
            onQuestionTextChange={() => {}}
            onOptionTextChange={() => {}}
            isInteractive={isInteractive}
            studentAnswers={studentAnswers}
            onAnswerChange={onAnswerChange}
            showCorrectAnswers={showCorrectAnswers}
            disabled={disabled}
            worksheetId={homeworkId}
          />
        )}

        {exercise.type === 'dialogue' && exercise.dialogue && (
          <ExerciseDialogue
            dialogue={exercise.dialogue}
            expressions={exercise.expressions}
            expression_instruction={exercise.expression_instruction}
            isEditing={false}
            viewMode={viewMode}
            onDialogueChange={() => {}}
            onExpressionChange={() => {}}
            onExpressionInstructionChange={() => {}}
            isInteractive={isInteractive}
            studentAnswers={studentAnswers}
            onAnswerChange={onAnswerChange}
            showCorrectAnswers={showCorrectAnswers}
            disabled={disabled}
          />
        )}

        {/* Discussion questions */}
        {exercise.type === 'discussion' && exercise.questions && (
          <div className="space-y-2">
            <h3 className="font-medium text-gray-700 mb-2">Discussion Questions:</h3>
            {exercise.questions.map((question: string, qIndex: number) => {
              const studentAnswer = studentAnswers[qIndex] || '';
              return (
                <div key={qIndex} className="p-2 border rounded-lg bg-white">
                  <p className="leading-snug mb-2">
                    {qIndex + 1}. {safeGetText(question)}
                  </p>
                  {isInteractive && (
                    <input
                      type="text"
                      value={studentAnswer}
                      onChange={(e) => onAnswerChange(qIndex, e.target.value)}
                      placeholder="Share your thoughts..."
                      className="w-full h-10 border rounded px-3"
                      disabled={disabled}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {exercise.type === 'word-order' && exercise.sentences && (
          <ExerciseWordOrder
            sentences={exercise.sentences}
            isEditing={false}
            viewMode={viewMode}
            onSentenceChange={() => {}}
            isInteractive={isInteractive}
            studentAnswers={studentAnswers}
            onAnswerChange={onAnswerChange}
            showCorrectAnswers={showCorrectAnswers}
            disabled={disabled}
          />
        )}

        {exercise.type === 'negative-prefixes' && exercise.words && (
          <ExerciseNegativePrefixes
            words={exercise.words}
            isEditing={false}
            viewMode={viewMode}
            onWordChange={() => {}}
            isInteractive={isInteractive}
            studentAnswers={studentAnswers}
            onAnswerChange={onAnswerChange}
            showCorrectAnswers={showCorrectAnswers}
            disabled={disabled}
          />
        )}

        {exercise.type === 'categorize' && (exercise.items || exercise.words) && exercise.categories && (
          <ExerciseCategorize
            items={exercise.items}
            words={exercise.words}
            categories={exercise.categories}
            isEditing={false}
            viewMode={viewMode}
            onWordsChange={() => {}}
            onCategoryChange={() => {}}
            isInteractive={isInteractive}
            studentAnswers={studentAnswers}
            onAnswerChange={onAnswerChange}
            showCorrectAnswers={showCorrectAnswers}
            disabled={disabled}
          />
        )}

        {exercise.type === 'paraphrasing' && exercise.sentences && (
          <ExerciseParaphrasing
            sentences={exercise.sentences}
            isEditing={false}
            viewMode={viewMode}
            onSentenceChange={() => {}}
            isInteractive={isInteractive}
            studentAnswers={studentAnswers}
            onAnswerChange={onAnswerChange}
            showCorrectAnswers={showCorrectAnswers}
            disabled={disabled}
          />
        )}

        {exercise.type === 'complete-word' && exercise.words && (
          <ExerciseCompleteWord
            words={exercise.words}
            isEditing={false}
            viewMode={viewMode}
            onWordChange={() => {}}
            isInteractive={isInteractive}
            studentAnswers={studentAnswers}
            onAnswerChange={onAnswerChange}
            showCorrectAnswers={showCorrectAnswers}
            disabled={disabled}
          />
        )}

        {/* Error Correction */}
        {exercise.type === 'error-correction' && exercise.sentences && (
          <div className="space-y-3">
            {exercise.sentences.map((sentence: any, sIndex: number) => {
              const studentAnswer = studentAnswers[sIndex] || '';
              return (
                <div key={sIndex} className="border rounded-lg p-3 bg-white">
                  <p className="leading-snug mb-2">
                    <span className="font-medium">{sIndex + 1}.</span> {safeGetText(sentence.incorrect) || safeGetText(sentence.text)}
                  </p>
                  {isInteractive && (
                    <input
                      type="text"
                      value={studentAnswer}
                      onChange={(e) => onAnswerChange(sIndex, e.target.value)}
                      placeholder="Write the correct sentence..."
                      className="w-full h-10 border rounded px-3"
                      disabled={disabled}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {exercise.type === 'odd-one-out' && exercise.questions && (
          <ExerciseOddOneOut
            questions={exercise.questions}
            isEditing={false}
            viewMode={viewMode}
            onQuestionChange={() => {}}
            isInteractive={isInteractive}
            studentAnswers={studentAnswers}
            onAnswerChange={onAnswerChange}
            showCorrectAnswers={showCorrectAnswers}
            disabled={disabled}
          />
        )}

        {exercise.type === 'gap-text' && exercise.sentences && (
          <ExerciseGapText
            sentences={exercise.sentences}
            isEditing={false}
            viewMode={viewMode}
            onSentenceChange={() => {}}
            isInteractive={isInteractive}
            studentAnswers={studentAnswers}
            onAnswerChange={onAnswerChange}
            showCorrectAnswers={showCorrectAnswers}
            disabled={disabled}
          />
        )}

        {exercise.type === 'sentence-transformation' && exercise.sentences && (
          <ExerciseSentenceTransformation
            sentences={exercise.sentences}
            isEditing={false}
            viewMode={viewMode}
            onSentenceChange={() => {}}
            isInteractive={isInteractive}
            studentAnswers={studentAnswers}
            onAnswerChange={onAnswerChange}
            showCorrectAnswers={showCorrectAnswers}
            disabled={disabled}
          />
        )}

        {exercise.type === 'matching-halves' && exercise.sentence_halves && (
          <ExerciseMatchingHalves
            sentence_halves={exercise.sentence_halves}
            isEditing={false}
            viewMode={viewMode}
            onHalvesChange={() => {}}
            isInteractive={isInteractive}
            studentAnswers={studentAnswers}
            onAnswerChange={onAnswerChange}
            showCorrectAnswers={showCorrectAnswers}
            disabled={disabled}
            worksheetId={homeworkId}
            isSharedWorksheet={true}
          />
        )}

        {(exercise.type === 'synonyms-antonyms' || exercise.type === 'synonyms' || exercise.type === 'antonyms') && exercise.items && (
          <ExerciseSynonymsAntonyms
            items={exercise.items}
            isEditing={false}
            viewMode={viewMode}
            onItemChange={() => {}}
            exerciseType={exercise.type}
            worksheetId={homeworkId}
            isSharedWorksheet={true}
            isInteractive={isInteractive}
            studentAnswers={studentAnswers}
            onAnswerChange={onAnswerChange}
            showCorrectAnswers={showCorrectAnswers}
            disabled={disabled}
          />
        )}

        {/* Audio exercises */}
        {exercise.type === 'listening-comprehension' && exercise.questions && (
          <ExerciseListeningComprehension
            questions={exercise.questions}
            audio_url={exercise.audio_url}
            isEditing={false}
            viewMode={viewMode}
            onQuestionChange={() => {}}
            isInteractive={isInteractive}
            studentAnswers={studentAnswers}
            onAnswerChange={onAnswerChange}
            showCorrectAnswers={showCorrectAnswers}
            disabled={disabled}
          />
        )}

        {exercise.type === 'answer-questions-audio' && exercise.questions && (
          <ExerciseAnswerQuestionsAudio
            questions={exercise.questions}
            audio_url={exercise.audio_url}
            isEditing={false}
            viewMode={viewMode}
            onQuestionChange={() => {}}
            isInteractive={isInteractive}
            studentAnswers={studentAnswers}
            onAnswerChange={onAnswerChange}
            showCorrectAnswers={showCorrectAnswers}
            disabled={disabled}
          />
        )}

        {exercise.type === 'true-false-audio' && exercise.statements && (
          <ExerciseTrueFalseAudio
            statements={exercise.statements}
            audio_url={exercise.audio_url}
            isEditing={false}
            viewMode={viewMode}
            onStatementChange={() => {}}
            isInteractive={isInteractive}
            studentAnswers={studentAnswers}
            onAnswerChange={onAnswerChange}
            showCorrectAnswers={showCorrectAnswers}
            disabled={disabled}
          />
        )}

        {exercise.type === 'multiple-choice-audio' && exercise.questions && (
          <ExerciseMultipleChoiceAudio
            questions={exercise.questions}
            audio_url={exercise.audio_url}
            isEditing={false}
            viewMode={viewMode}
            onQuestionChange={() => {}}
            isInteractive={isInteractive}
            studentAnswers={studentAnswers}
            onAnswerChange={onAnswerChange}
            showCorrectAnswers={showCorrectAnswers}
            disabled={disabled}
            worksheetId={homeworkId}
          />
        )}

        {exercise.type === 'fill-in-blanks-audio' && (
          <ExerciseFillInBlanksAudio
            word_bank={exercise.word_bank}
            sentences={exercise.sentences}
            transcript_with_blanks={exercise.transcript_with_blanks}
            answers={exercise.answers}
            audio_url={exercise.audio_url}
            isEditing={false}
            viewMode={viewMode}
            onWordBankChange={() => {}}
            onSentenceChange={() => {}}
            onTranscriptChange={() => {}}
            onAnswersChange={() => {}}
            isInteractive={isInteractive}
            studentAnswers={studentAnswers}
            onAnswerChange={onAnswerChange}
            showCorrectAnswers={showCorrectAnswers}
            disabled={disabled}
          />
        )}

        {/* Picture exercises */}
        {exercise.type === 'describe-picture' && (
          <ExerciseDescribe
            image_url={exercise.image_url}
            questions={exercise.prompts || exercise.questions || []}
            isEditing={false}
            viewMode={viewMode}
            showImage={true}
            onQuestionChange={() => {}}
            onImageUrlChange={() => {}}
            isInteractive={isInteractive}
            studentAnswers={studentAnswers}
            onAnswerChange={onAnswerChange}
            showCorrectAnswers={showCorrectAnswers}
            disabled={disabled}
          />
        )}

        {normalizedType === 'answer-questions' && !exercise.type.includes('-audio') && exercise.questions && (
          <ExerciseAnswerQuestions
            questions={exercise.questions}
            isEditing={false}
            viewMode={viewMode}
            showImage={false}
            onQuestionChange={() => {}}
            isInteractive={isInteractive}
            studentAnswers={studentAnswers}
            onAnswerChange={onAnswerChange}
            showCorrectAnswers={showCorrectAnswers}
            disabled={disabled}
          />
        )}

        {/* True/False exercise type */}
        {normalizedType === 'true-false' && !exercise.type.includes('-audio') && exercise.statements && (
          <div className="space-y-2">
            {exercise.statements.map((statement: any, sIndex: number) => {
              const studentAnswer = studentAnswers[sIndex];
              const isCorrect = studentAnswer !== undefined && 
                ((statement.isTrue && studentAnswer === 'true') || 
                 (!statement.isTrue && studentAnswer === 'false'));
              
              return (
                <div key={sIndex} className="border rounded-lg p-3 bg-white">
                  <div className="flex flex-row items-start">
                    <div className="flex-grow">
                      <p className="leading-snug">
                        {sIndex + 1}. {safeGetText(statement.text)}
                      </p>
                    </div>
                    <div className="ml-4 flex space-x-4">
                      <label className={`inline-flex items-center cursor-pointer ${
                        isInteractive && studentAnswer === 'true' ? 'bg-blue-100 px-2 py-1 rounded' : ''
                      }`}>
                        <input 
                          type="radio" 
                          name={`statement-hw-${index}-${sIndex}`} 
                          className="form-radio h-4 w-4" 
                          checked={studentAnswer === 'true'}
                          disabled={!isInteractive || disabled}
                          onChange={() => isInteractive && onAnswerChange(sIndex, 'true')}
                        />
                        <span className="ml-2">True</span>
                      </label>
                      <label className={`inline-flex items-center cursor-pointer ${
                        isInteractive && studentAnswer === 'false' ? 'bg-blue-100 px-2 py-1 rounded' : ''
                      }`}>
                        <input 
                          type="radio" 
                          name={`statement-hw-${index}-${sIndex}`} 
                          className="form-radio h-4 w-4"
                          checked={studentAnswer === 'false'}
                          disabled={!isInteractive || disabled}
                          onChange={() => isInteractive && onAnswerChange(sIndex, 'false')}
                        />
                        <span className="ml-2">False</span>
                      </label>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* PROBLEM 4.1: Show AI Evaluation for open-ended exercises after submission */}
        {isOpenEnded && aiEvaluation && disabled && (
          <div className="mt-4 pt-4 border-t">
            <AiEvaluationBadge 
              evaluation={aiEvaluation} 
              showFeedback={true} 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeworkExerciseRenderer;
