
import React from 'react';
import { AlertCircle, MessageCircle, BookOpen, Clock, FileText } from 'lucide-react';
import { AiEvaluation, AiEvaluationBadge } from '@/components/homework/AiEvaluationBadge';
import ExerciseMatching from '../worksheet/ExerciseMatching';
import ExerciseFillInBlanks from '../worksheet/ExerciseFillInBlanks';
import ExerciseMultipleChoice from '../worksheet/ExerciseMultipleChoice';
import ExerciseReading from '../worksheet/ExerciseReading';
import ExerciseDialogue from '../worksheet/ExerciseDialogue';
import ExerciseWordOrder from '../worksheet/ExerciseWordOrder';
import ExerciseNegativePrefixes from '../worksheet/ExerciseNegativePrefixes';
import ExerciseCategorize from '../worksheet/ExerciseCategorize';
import ExerciseParaphrasing from '../worksheet/ExerciseParaphrasing';
import ExerciseCompleteWord from '../worksheet/ExerciseCompleteWord';
import ExerciseOddOneOut from '../worksheet/ExerciseOddOneOut';
import ExerciseGapText from '../worksheet/ExerciseGapText';
import ExerciseSentenceTransformation from '../worksheet/ExerciseSentenceTransformation';
import ExerciseMatchingHalves from '../worksheet/ExerciseMatchingHalves';
import ExerciseSynonymsAntonyms from '../worksheet/ExerciseSynonymsAntonyms';
import ExerciseListeningComprehension from '../worksheet/ExerciseListeningComprehension';
import ExerciseAnswerQuestionsAudio from '../worksheet/ExerciseAnswerQuestionsAudio';
import ExerciseTrueFalseAudio from '../worksheet/ExerciseTrueFalseAudio';
import ExerciseMultipleChoiceAudio from '../worksheet/ExerciseMultipleChoiceAudio';
import ExerciseFillInBlanksAudio from '../worksheet/ExerciseFillInBlanksAudio';
import ExerciseDescribe from '../worksheet/ExerciseDescribe';
import ExerciseAnswerQuestions from '../worksheet/ExerciseAnswerQuestions';
import MediaSection from '../worksheet/MediaSection';
import { deepFixTextObjects, safeGetText } from '../../utils/textObjectFixer';
import { getIconComponent } from '../../utils/iconUtils';
import { getOfficialExerciseName } from '../../utils/exerciseProcessor';
import { HomeworkSpeakingRecorder } from '@/components/homework/HomeworkSpeakingRecorder';
import { AutoResizeTextarea } from '@/components/ui/AutoResizeTextarea';

interface SharedWorksheetContentProps {
  worksheet: {
    html_content: string;
    ai_response: string;
    title: string;
    selected_image?: any;
    selected_audio?: any;
    audio_url?: string;
    id?: string; // PROBLEM 4: Add worksheet ID for consistent shuffle
  };
  // Interactive mode props
  isInteractive?: boolean;
  isReadOnly?: boolean; // PROBLEM 3: Read-only mode for teachers
  studentAnswers?: Record<number, any>;
  onAnswerChange?: (exerciseIndex: number, exerciseType: string, questionIndex: number, value: any) => void;
  onBlur?: (exerciseIndex: number, exerciseType: string) => void;
  // PROBLEM 2: Navigation refs for sidebar scroll-to-exercise
  exerciseRefs?: React.MutableRefObject<(HTMLElement | null)[]>;
  // AI Evaluation feedback
  itemEvaluations?: Record<number, any[]>;
  // Speaking audio answers
  audioAnswers?: Record<number, Record<number, string>>;
  onAudioAnswerChange?: (exerciseIndex: number, questionIndex: number, audioUrl: string) => void;
}

// Helper to convert item_evaluations (DB format) to AiEvaluation (component format)
const convertItemEvalsToAiEvals = (items: any[] | undefined): Record<number, AiEvaluation> | undefined => {
  if (!items || items.length === 0) return undefined;
  const result: Record<number, AiEvaluation> = {};
  items.forEach(item => {
    if (item.hasValue === false) {
      // Pending: show "Waiting for AI evaluation..." badge
      result[item.question_index] = {
        is_acceptable: false,
        quality_score: -1,
        feedback: '',
        question_index: item.question_index
      };
      return;
    }
    result[item.question_index] = {
      is_acceptable: (item.mastery || 0) >= 70,
      quality_score: (item.mastery || 0) / 100,
      feedback: item.feedback || '',
      question_index: item.question_index
    };
  });
  return Object.keys(result).length > 0 ? result : undefined;
};

// Helper function to normalize exercise type (removes -picture and -audio suffixes)
const normalizeExerciseType = (type: string): string => {
  return type.replace('-picture', '').replace('-audio', '');
};

const SharedWorksheetContent: React.FC<SharedWorksheetContentProps> = ({ 
  worksheet,
  isInteractive = false,
  isReadOnly = false, // PROBLEM 3: Read-only for teachers
  studentAnswers = {},
  onAnswerChange,
  onBlur,
  exerciseRefs, // PROBLEM 2: Navigation refs
  itemEvaluations, // AI Evaluation feedback
  audioAnswers,
  onAudioAnswerChange
}) => {
  // PROBLEM 3: Effective interactive mode (disabled if read-only)
  const effectiveInteractive = isInteractive && !isReadOnly;
  console.log('🔧 SharedWorksheetContent: Starting data parsing...');
  console.log('🔧 ai_response length:', worksheet.ai_response?.length || 0);
  console.log('🔧 html_content length:', worksheet.html_content?.length || 0);

  let worksheetData = null;

  // Try ai_response first (contains complete data), then html_content as fallback
  if (worksheet.ai_response && worksheet.ai_response.trim()) {
    try {
      console.log('🔧 Attempting to parse ai_response...');
      const rawData = JSON.parse(worksheet.ai_response);
      console.log('✅ Successfully parsed ai_response, now fixing text objects:', rawData);
      
      // CRITICAL FIX: Apply deepFixTextObjects to fix {text: "..."} objects
      worksheetData = deepFixTextObjects(rawData, 'ai_response');
      console.log('✅ Text objects fixed:', worksheetData);
    } catch (error) {
      console.error('❌ Error parsing ai_response:', error);
    }
  }

  // Fallback to html_content if ai_response failed
  if (!worksheetData && worksheet.html_content && worksheet.html_content.trim()) {
    try {
      console.log('🔧 Fallback: Attempting to parse html_content...');
      const rawData = JSON.parse(worksheet.html_content);
      console.log('✅ Successfully parsed html_content, now fixing text objects:', rawData);
      
      // CRITICAL FIX: Apply deepFixTextObjects to fix {text: "..."} objects
      worksheetData = deepFixTextObjects(rawData, 'html_content');
      console.log('✅ Text objects fixed:', worksheetData);
    } catch (error) {
      console.error('❌ Error parsing html_content:', error);
    }
  }

  // If no valid data found, show error
  if (!worksheetData) {
    console.error('❌ No valid worksheet data found');
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Unable to display worksheet content</p>
        <p className="text-sm text-gray-500 mt-2">
          Failed to parse worksheet data from both ai_response and html_content
        </p>
      </div>
    );
  }

  console.log('✅ Using worksheet data:', {
    title: worksheetData.title,
    hasExercises: worksheetData.exercises?.length || 0,
    hasWarmup: worksheetData.warmup_questions?.length || 0,
    hasGrammar: !!worksheetData.grammar_rules
  });

  // Render using IDENTICAL structure to HTML export with WIDER container (60% smaller margins)
  return (
    <div className="worksheet-content mb-8" style={{ maxWidth: '1400px', margin: '0 auto', padding: '12px' }} id="shared-worksheet-content">
      <div className="page-number"></div>
      
      {/* Main header - identical to WorksheetContent.tsx */}
      <div className="bg-white p-6 border rounded-lg shadow-sm mb-6 relative">
        {/* Clickable edooqoo link - positioned in top right */}
        <div className="absolute top-4 right-4 hidden sm:block">
          <a 
            href="https://edooqoo.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-gray-500 hover:text-worksheet-purple transition-colors duration-200 hover:underline"
          >
            Shared worksheet from edooqoo.com
          </a>
        </div>
        
        <h1 className="text-3xl font-bold mb-2 text-worksheet-purpleDark leading-tight pr-24">
          {worksheetData.title || 'Untitled Worksheet'}
        </h1>
        
        <h2 className="text-xl text-worksheet-purple mb-3 leading-tight pr-24">
          {worksheetData.subtitle || ''}
        </h2>

        {worksheetData.introduction && (
          <div className="mb-4 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-md">
            <p className="leading-snug">{worksheetData.introduction}</p>
          </div>
        )}
      </div>

      {/* Warmup Questions - identical structure to WarmupSection */}
      {worksheetData.warmup_questions && worksheetData.warmup_questions.length > 0 && (
        <div className="bg-white border rounded-lg shadow-sm mb-6">
          <div className="bg-worksheet-purple text-white p-2 flex justify-between items-center rounded-t-lg">
            <div className="flex items-center">
              <div className="p-2 bg-white/20 rounded-full mr-3">
                <MessageCircle className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">Warmup Questions</h3>
            </div>
            <div className="flex items-center bg-white/20 px-3 py-1 rounded-md">
              <Clock className="h-4 w-4 mr-1" />
              <span className="text-sm">5 min</span>
            </div>
          </div>

          <div className="p-6">
            <p className="font-medium mb-4 leading-snug">
              Start the lesson with these conversation questions to engage the student and introduce the topic.
            </p>
            
            <div className="space-y-3">
              {worksheetData.warmup_questions.map((question: string, index: number) => (
                <div key={index} className="flex items-start">
                  <span className="text-worksheet-purple font-semibold mr-3 mt-1">
                    {index + 1}.
                  </span>
                  <p className="flex-1 leading-relaxed">{safeGetText(question)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Grammar Rules - identical structure to GrammarRules */}
      {/* PROBLEM 4: Add id and data-section for ExerciseNavSidebar G button */}
      {worksheetData.grammar_rules && (
        <div 
          id="grammar-rules-section" 
          data-section="grammar"
          className="bg-white border rounded-lg shadow-sm mb-6 overflow-hidden"
        >
          <div className="bg-worksheet-purple text-white p-2 flex justify-between items-center">
            <div className="flex items-center">
              <div className="p-2 bg-white/20 rounded-full mr-3">
                <BookOpen className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">Grammar Rules</h3>
            </div>
            <div className="flex items-center bg-white/20 px-3 py-1 rounded-md">
              <Clock className="h-4 w-4 mr-1" />
              <span className="text-sm">10 min</span>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-xl font-semibold text-worksheet-purpleDark">
                {worksheetData.grammar_rules.title}
              </h3>
            </div>
            
            {worksheetData.grammar_rules.introduction && (
              <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-md">
                <p className="leading-snug text-blue-800">{worksheetData.grammar_rules.introduction}</p>
              </div>
            )}

            {worksheetData.grammar_rules.rules && (
              <div className="space-y-4">
                {worksheetData.grammar_rules.rules.map((rule: any, index: number) => (
                  <div key={index} className="border-l-2 border-worksheet-purple pl-4">
                    <h4 className="font-medium text-worksheet-purpleDark mb-2">
                      {rule.title}
                    </h4>
                    
                    <p className="text-gray-700 mb-3">
                      {rule.explanation}
                    </p>
                    
                    {rule.examples && rule.examples.length > 0 && (
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-sm font-medium text-gray-600 mb-2">Examples:</p>
                        <ul className="space-y-1">
                          {rule.examples.map((example: string, exIndex: number) => (
                            <li key={exIndex} className="text-sm text-gray-700">
                              <span>• {example}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lesson Media Section - from direct columns OR parsed data */}
      {(worksheet.selected_audio || worksheet.selected_image || 
        worksheetData.selected_audio || worksheetData.selected_image) && (
        <div className="mt-8 mb-8">
          <MediaSection
            selectedImage={worksheet.selected_image || worksheetData.selected_image}
            selectedAudio={worksheet.selected_audio || worksheetData.selected_audio}
            isDownloadUnlocked={true}
            isPinned={false}
            onTogglePin={undefined}
            isFullScreen={false}
            onToggleFullScreen={undefined}
          />
        </div>
      )}

      {/* Exercises - using proper React components with FIXED ICONS */}
      {worksheetData.exercises && worksheetData.exercises.map((exercise: any, index: number) => {
        console.log(`🔧 Rendering exercise ${index + 1}: ${exercise.type}`, exercise);
        
        // Normalize type to handle -picture and -audio suffixes
        const normalizedType = normalizeExerciseType(exercise.type);
        
        return (
          <div 
            key={index} 
            className="mb-6 bg-white border rounded-lg overflow-hidden shadow-sm"
            ref={el => {
              // PROBLEM 2: Assign ref for navigation sidebar to scroll to exercise
              if (exerciseRefs) {
                exerciseRefs.current[index] = el;
              }
            }}
          >
            <div className="bg-worksheet-purple text-white p-2 flex justify-between items-center exercise-header">
              <div className="flex items-center">
                <div className="p-2 bg-white/20 rounded-full mr-3">
                  {/* FIXED: Use getIconComponent instead of text */}
                  {getIconComponent(exercise.icon || 'fa-book-open')}
                </div>
                <h3 className="text-lg font-semibold">
                  {/* PROBLEM 6 FIX: Use official exercise type names, preserve AI description */}
                  {(() => {
                    const officialName = getOfficialExerciseName(exercise.type);
                    const aiTitle = exercise.title || '';
                    const cleanAiTitle = aiTitle.replace(/^Exercise\s+\d+:\s*/i, '').trim();
                    const escapedName = officialName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const aiDesc = cleanAiTitle.replace(new RegExp(`^${escapedName}\\s*[-:]?\\s*`, 'i'), '').trim();
                    return aiDesc 
                      ? `Exercise ${index + 1}: ${officialName}: ${aiDesc}` 
                      : `Exercise ${index + 1}: ${officialName}`;
                  })()}
                </h3>
              </div>
              <div className="flex items-center bg-white/20 px-3 py-1 rounded-md">
                <Clock className="h-4 w-4 mr-1" />
                <span className="text-sm">{exercise.time || 10} min</span>
              </div>
            </div>
            
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
              
              {/* Type-aware exercise rendering using React components */}
              {normalizedType === 'reading' && exercise.questions && (
                <ExerciseReading
                  questions={exercise.questions}
                  isEditing={false}
                  viewMode="student"
                  onQuestionChange={() => {}}
                  isInteractive={effectiveInteractive}
                  studentAnswers={studentAnswers[index] || {}}
                  onAnswerChange={(qIndex, value) => onAnswerChange?.(index, exercise.type, qIndex, value)}
                  isSharedWorksheet={true}
                  aiEvaluations={convertItemEvalsToAiEvals(itemEvaluations?.[index])}
                  audioAnswers={audioAnswers?.[index]}
                  onAudioAnswerChange={(qIndex, url) => onAudioAnswerChange?.(index, qIndex, url)}
                />
              )}

              {exercise.type === 'matching' && exercise.items && (
                <ExerciseMatching
                  items={exercise.items}
                  isEditing={false}
                  viewMode="student"
                  getMatchedItems={() => exercise.items}
                  onItemChange={() => {}}
                  isInteractive={effectiveInteractive}
                  studentAnswers={studentAnswers[index] || {}}
                  onAnswerChange={(qIndex, value) => onAnswerChange?.(index, exercise.type, qIndex, value)}
                />
              )}

              {exercise.type === 'fill-in-blanks' && exercise.sentences && (
                <ExerciseFillInBlanks
                  word_bank={exercise.word_bank}
                  sentences={exercise.sentences}
                  isEditing={false}
                  viewMode="student"
                  onWordBankChange={() => {}}
                  onSentenceChange={() => {}}
                  isInteractive={effectiveInteractive}
                  studentAnswers={studentAnswers[index] || {}}
                  onAnswerChange={(qIndex, value) => onAnswerChange?.(index, exercise.type, qIndex, value)}
                />
              )}

              {/* PROBLEM 4: Pass worksheetId for consistent answer order */}
              {(exercise.type === 'multiple-choice' || exercise.type === 'multiple-choice-picture') && exercise.questions && (
                <ExerciseMultipleChoice
                  questions={exercise.questions}
                  isEditing={false}
                  viewMode="student"
                  onQuestionTextChange={() => {}}
                  onOptionTextChange={() => {}}
                  exerciseVariant={exercise.type.includes('-picture') ? 'picture' : 'plain'}
                  isInteractive={effectiveInteractive}
                  studentAnswers={studentAnswers[index] || {}}
                  onAnswerChange={(qIndex, value) => onAnswerChange?.(index, exercise.type, qIndex, value)}
                  worksheetId={worksheet.id}
                />
              )}

              {exercise.type === 'dialogue' && exercise.dialogue && (
                <ExerciseDialogue
                  dialogue={exercise.dialogue}
                  expressions={exercise.expressions}
                  expression_instruction={exercise.expression_instruction}
                  isEditing={false}
                  viewMode="student"
                  onDialogueChange={() => {}}
                  onExpressionChange={() => {}}
                  onExpressionInstructionChange={() => {}}
                  isInteractive={effectiveInteractive}
                  studentAnswers={studentAnswers[index] || {}}
                  onAnswerChange={(qIndex, value) => onAnswerChange?.(index, exercise.type, qIndex, value)}
                  isSharedWorksheet={true}
                  aiEvaluations={convertItemEvalsToAiEvals(itemEvaluations?.[index])}
                  audioAnswers={audioAnswers?.[index]}
                  onAudioAnswerChange={(qIndex, url) => onAudioAnswerChange?.(index, qIndex, url)}
                />
              )}

              {/* Discussion questions - simple rendering with interactive input */}
              {exercise.type === 'discussion' && exercise.questions && (
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-700 mb-2">Discussion Questions:</h3>
                  {exercise.questions.map((question: string, qIndex: number) => {
                    const studentAnswer = (studentAnswers[index] || {})[qIndex] || '';
                    const aiEvals = convertItemEvalsToAiEvals(itemEvaluations?.[index]);
                    return (
                      <div key={qIndex} className="p-2 border rounded-lg bg-white">
                        <p className="leading-snug mb-2">
                          {qIndex + 1}. {safeGetText(question)}
                        </p>
                        {effectiveInteractive && (
                          <div className="flex items-start gap-2">
                            {onAudioAnswerChange && (
                              <HomeworkSpeakingRecorder
                                existingAudioUrl={audioAnswers?.[index]?.[qIndex]}
                                onAudioSaved={(url) => onAudioAnswerChange(index, qIndex, url)}
                                registryKey={`sw_${index}_${qIndex}`}
                              />
                            )}
                            <div className="flex-1">
                              <AutoResizeTextarea
                                value={studentAnswer}
                                onChange={(e) => onAnswerChange?.(index, exercise.type, qIndex, e.target.value)}
                                placeholder="Share your thoughts..."
                                className="w-full min-h-[40px]"
                                rows={1}
                              />
                              {/* AI Evaluation Badge for discussion questions */}
                              {aiEvals?.[qIndex] && (
                                <AiEvaluationBadge evaluation={aiEvals[qIndex]} />
                              )}
                            </div>
                          </div>
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
                  viewMode="student"
                  onSentenceChange={() => {}}
                  isInteractive={effectiveInteractive}
                  studentAnswers={studentAnswers[index] || {}}
                  onAnswerChange={(qIndex, value) => onAnswerChange?.(index, exercise.type, qIndex, value)}
                />
              )}

              {exercise.type === 'negative-prefixes' && exercise.words && (
                <ExerciseNegativePrefixes
                  words={exercise.words}
                  isEditing={false}
                  viewMode="student"
                  onWordChange={() => {}}
                  isInteractive={effectiveInteractive}
                  studentAnswers={studentAnswers[index] || {}}
                  onAnswerChange={(qIndex, value) => onAnswerChange?.(index, exercise.type, qIndex, value)}
                />
              )}

              {exercise.type === 'categorize' && (exercise.items || exercise.words) && exercise.categories && (
                <ExerciseCategorize
                  items={exercise.items}
                  words={exercise.words}
                  categories={exercise.categories}
                  isEditing={false}
                  viewMode="student"
                  onWordsChange={() => {}}
                  onCategoryChange={() => {}}
                  isInteractive={effectiveInteractive}
                  studentAnswers={studentAnswers[index] || {}}
                  onAnswerChange={(qIndex, value) => onAnswerChange?.(index, exercise.type, qIndex, value)}
                />
              )}

              {exercise.type === 'paraphrasing' && exercise.sentences && (
                <ExerciseParaphrasing
                  sentences={exercise.sentences}
                  isEditing={false}
                  viewMode="student"
                  onSentenceChange={() => {}}
                  isInteractive={effectiveInteractive}
                  studentAnswers={studentAnswers[index] || {}}
                  onAnswerChange={(qIndex, value) => onAnswerChange?.(index, exercise.type, qIndex, value)}
                  isSharedWorksheet={true}
                  aiEvaluations={convertItemEvalsToAiEvals(itemEvaluations?.[index])}
                  audioAnswers={audioAnswers?.[index]}
                  onAudioAnswerChange={(qIndex, url) => onAudioAnswerChange?.(index, qIndex, url)}
                />
              )}

              {exercise.type === 'complete-word' && exercise.words && (
                <ExerciseCompleteWord
                  words={exercise.words}
                  isEditing={false}
                  viewMode="student"
                  onWordChange={() => {}}
                  isInteractive={effectiveInteractive}
                  studentAnswers={studentAnswers[index] || {}}
                  onAnswerChange={(qIndex, value) => onAnswerChange?.(index, exercise.type, qIndex, value)}
                />
              )}

              {/* PROBLEM 2 FIX: Add missing error-correction exercise type */}
              {exercise.type === 'error-correction' && exercise.sentences && (
                <div className="space-y-3">
                  {exercise.sentences.map((sentence: any, sIndex: number) => {
                    const studentAnswer = (studentAnswers[index] || {})[sIndex] || '';
                    return (
                      <div key={sIndex} className="border rounded-lg p-3 bg-white">
                        <p className="leading-snug mb-2">
                          <span className="font-medium">{sIndex + 1}.</span> {safeGetText(sentence.incorrect) || safeGetText(sentence.text)}
                        </p>
                        {effectiveInteractive && (
                          <input
                            type="text"
                            value={studentAnswer}
                            onChange={(e) => onAnswerChange?.(index, exercise.type, sIndex, e.target.value)}
                            placeholder="Write the correct sentence..."
                            className="w-full h-10 border rounded px-3"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* NEWLY ADDED: Missing exercise types */}
              {exercise.type === 'odd-one-out' && exercise.questions && (
                <ExerciseOddOneOut
                  questions={exercise.questions}
                  isEditing={false}
                  viewMode="student"
                  onQuestionChange={() => {}}
                  isInteractive={effectiveInteractive}
                  studentAnswers={studentAnswers[index] || {}}
                  onAnswerChange={(qIndex, value) => onAnswerChange?.(index, exercise.type, qIndex, value)}
                />
              )}

              {exercise.type === 'gap-text' && exercise.sentences && (
                <ExerciseGapText
                  sentences={exercise.sentences}
                  isEditing={false}
                  viewMode="student"
                  onSentenceChange={() => {}}
                  isInteractive={effectiveInteractive}
                  studentAnswers={studentAnswers[index] || {}}
                  onAnswerChange={(qIndex, value) => onAnswerChange?.(index, exercise.type, qIndex, value)}
                />
              )}

              {exercise.type === 'sentence-transformation' && exercise.sentences && (
                <ExerciseSentenceTransformation
                  sentences={exercise.sentences}
                  isEditing={false}
                  viewMode="student"
                  onSentenceChange={() => {}}
                  isInteractive={effectiveInteractive}
                  studentAnswers={studentAnswers[index] || {}}
                  onAnswerChange={(qIndex, value) => onAnswerChange?.(index, exercise.type, qIndex, value)}
                />
              )}

              {/* PROBLEM 4 & 5: Pass worksheetId for consistent shuffle */}
              {exercise.type === 'matching-halves' && exercise.sentence_halves && (
                <ExerciseMatchingHalves
                  sentence_halves={exercise.sentence_halves}
                  isEditing={false}
                  viewMode="student"
                  onHalvesChange={() => {}}
                  isInteractive={effectiveInteractive}
                  studentAnswers={studentAnswers[index] || {}}
                  onAnswerChange={(qIndex, value) => onAnswerChange?.(index, exercise.type, qIndex, value)}
                  worksheetId={worksheet.id}
                  isSharedWorksheet={true}
                />
              )}

              {/* PROBLEM 5 FIX: Pass worksheetId and isSharedWorksheet to ensure proper shuffle */}
              {(exercise.type === 'synonyms-antonyms' || exercise.type === 'synonyms' || exercise.type === 'antonyms') && exercise.items && (
                <ExerciseSynonymsAntonyms
                  items={exercise.items}
                  isEditing={false}
                  viewMode="student"
                  onItemChange={() => {}}
                  exerciseType={exercise.type}
                  worksheetId={worksheet.id}
                  isSharedWorksheet={true}
                  isInteractive={effectiveInteractive}
                  studentAnswers={studentAnswers[index] || {}}
                  onAnswerChange={(qIndex, value) => onAnswerChange?.(index, exercise.type, qIndex, value)}
                />
              )}

              {/* Audio exercises - Listening Comprehension */}
              {exercise.type === 'listening-comprehension' && exercise.questions && (
                <ExerciseListeningComprehension
                  questions={exercise.questions}
                  audio_url={exercise.audio_url}
                  isEditing={false}
                  viewMode="student"
                  onQuestionChange={() => {}}
                  isInteractive={effectiveInteractive}
                  studentAnswers={studentAnswers[index] || {}}
                  onAnswerChange={(qIndex, value) => onAnswerChange?.(index, exercise.type, qIndex, value)}
                  isSharedWorksheet={true}
                  aiEvaluations={convertItemEvalsToAiEvals(itemEvaluations?.[index])}
                  audioAnswers={audioAnswers?.[index]}
                  onAudioAnswerChange={(qIndex, url) => onAudioAnswerChange?.(index, qIndex, url)}
                />
              )}

              {/* Audio exercises - Answer Questions Audio */}
              {exercise.type === 'answer-questions-audio' && exercise.questions && (
                <ExerciseAnswerQuestionsAudio
                  questions={exercise.questions}
                  audio_url={exercise.audio_url}
                  isEditing={false}
                  viewMode="student"
                  onQuestionChange={() => {}}
                  isInteractive={effectiveInteractive}
                  studentAnswers={studentAnswers[index] || {}}
                  onAnswerChange={(qIndex, value) => onAnswerChange?.(index, exercise.type, qIndex, value)}
                  isSharedWorksheet={true}
                  aiEvaluations={convertItemEvalsToAiEvals(itemEvaluations?.[index])}
                  audioAnswers={audioAnswers?.[index]}
                  onAudioAnswerChange={(qIndex, url) => onAudioAnswerChange?.(index, qIndex, url)}
                />
              )}

              {/* Audio exercises - True/False Audio */}
              {exercise.type === 'true-false-audio' && exercise.statements && (
                <ExerciseTrueFalseAudio
                  statements={exercise.statements}
                  audio_url={exercise.audio_url}
                  isEditing={false}
                  viewMode="student"
                  onStatementChange={() => {}}
                  isInteractive={effectiveInteractive}
                  studentAnswers={studentAnswers[index] || {}}
                  onAnswerChange={(qIndex, value) => onAnswerChange?.(index, exercise.type, qIndex, value)}
                />
              )}

              {/* Audio exercises - Multiple Choice Audio - PROBLEM 5 FIX: Pass worksheetId for consistent shuffle */}
              {exercise.type === 'multiple-choice-audio' && exercise.questions && (
                <ExerciseMultipleChoiceAudio
                  questions={exercise.questions}
                  audio_url={exercise.audio_url}
                  isEditing={false}
                  viewMode="student"
                  onQuestionChange={() => {}}
                  isInteractive={effectiveInteractive}
                  studentAnswers={studentAnswers[index] || {}}
                  onAnswerChange={(qIndex, value) => onAnswerChange?.(index, exercise.type, qIndex, value)}
                  worksheetId={worksheet.id}
                />
              )}

              {/* Audio exercises - Fill in Blanks Audio */}
              {exercise.type === 'fill-in-blanks-audio' && (
                <ExerciseFillInBlanksAudio
                  word_bank={exercise.word_bank}
                  sentences={exercise.sentences}
                  transcript_with_blanks={exercise.transcript_with_blanks}
                  answers={exercise.answers}
                  audio_url={exercise.audio_url}
                  isEditing={false}
                  viewMode="student"
                  onWordBankChange={() => {}}
                  onSentenceChange={() => {}}
                  onTranscriptChange={() => {}}
                  onAnswersChange={() => {}}
                  isInteractive={effectiveInteractive}
                  studentAnswers={studentAnswers[index] || {}}
                  onAnswerChange={(qIndex, value) => onAnswerChange?.(index, exercise.type, qIndex, value)}
                />
              )}

              {/* Picture exercises - Describe Picture - PROBLEM 2 FIX: use original type, not normalized */}
              {exercise.type === 'describe-picture' && (
                <ExerciseDescribe
                  image_url={exercise.image_url}
                  questions={exercise.prompts || exercise.questions || []}
                  isEditing={false}
                  viewMode="student"
                  showImage={true}
                  onQuestionChange={() => {}}
                  onImageUrlChange={() => {}}
                  isInteractive={effectiveInteractive}
                  studentAnswers={studentAnswers[index] || {}}
                  onAnswerChange={(qIndex, value) => onAnswerChange?.(index, exercise.type, qIndex, value)}
                  isSharedWorksheet={true}
                  aiEvaluations={convertItemEvalsToAiEvals(itemEvaluations?.[index])}
                  exerciseVariant="picture"
                  audioAnswers={audioAnswers?.[index]}
                  onAudioAnswerChange={(qIndex, url) => onAudioAnswerChange?.(index, qIndex, url)}
                />
              )}

              {/* Picture exercises - Answer Questions (uses normalized type for -picture suffix) */}
              {normalizedType === 'answer-questions' && !exercise.type.includes('-audio') && exercise.questions && (
                <ExerciseAnswerQuestions
                  questions={exercise.questions}
                  isEditing={false}
                  viewMode="student"
                  showImage={false}
                  onQuestionChange={() => {}}
                  isInteractive={effectiveInteractive}
                  studentAnswers={studentAnswers[index] || {}}
                  onAnswerChange={(qIndex, value) => onAnswerChange?.(index, exercise.type, qIndex, value)}
                  isSharedWorksheet={true}
                  aiEvaluations={convertItemEvalsToAiEvals(itemEvaluations?.[index])}
                  exerciseVariant={exercise.type.includes('-picture') ? 'picture' : 'plain'}
                  audioAnswers={audioAnswers?.[index]}
                  onAudioAnswerChange={(qIndex, url) => onAudioAnswerChange?.(index, qIndex, url)}
                />
              )}

              {/* PROBLEM 4 FIX: Picture hint for true-false-picture */}
              {exercise.type === 'true-false-picture' && (
                <div className="text-center text-sm text-muted-foreground py-2 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                  🖼️ Look at the picture in the Lesson Media section above before answering
                </div>
              )}

              {/* True/False exercise type - with interactive mode */}
              {normalizedType === 'true-false' && !exercise.type.includes('-audio') && exercise.statements && (
                <div className="space-y-2">
                  {exercise.statements.map((statement: any, sIndex: number) => {
                    const studentAnswer = (studentAnswers[index] || {})[sIndex];
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
                              effectiveInteractive && studentAnswer === 'true' ? 'bg-blue-100 px-2 py-1 rounded' : ''
                            }`}>
                              <input 
                                type="radio" 
                                name={`statement-${index}-${sIndex}`} 
                                className="form-radio h-4 w-4" 
                                checked={studentAnswer === 'true'}
                                disabled={!effectiveInteractive}
                                onChange={() => effectiveInteractive && onAnswerChange?.(index, exercise.type, sIndex, 'true')}
                              />
                              <span className="ml-2">True</span>
                            </label>
                            <label className={`inline-flex items-center cursor-pointer ${
                              effectiveInteractive && studentAnswer === 'false' ? 'bg-blue-100 px-2 py-1 rounded' : ''
                            }`}>
                              <input 
                                type="radio" 
                                name={`statement-${index}-${sIndex}`} 
                                className="form-radio h-4 w-4"
                                checked={studentAnswer === 'false'}
                                disabled={!effectiveInteractive}
                                onChange={() => effectiveInteractive && onAnswerChange?.(index, exercise.type, sIndex, 'false')}
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
            </div>
          </div>
        );
      })}

      {/* Vocabulary Sheet - identical structure to VocabularySheet */}
      {/* PROBLEM 4: Add id and data-section for ExerciseNavSidebar V button */}
      {worksheetData.vocabulary_sheet && worksheetData.vocabulary_sheet.length > 0 && (
        <div 
          id="vocabulary-sheet-section" 
          data-section="vocabulary"
          className="mb-6 bg-white border rounded-lg overflow-hidden shadow-sm"
        >
          <div className="bg-worksheet-purple text-white p-2 flex justify-between items-center exercise-header">
            <div className="flex items-center">
              <div className="p-2 bg-white/20 rounded-full mr-3">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">Vocabulary Sheet</h3>
            </div>
          </div>

          <div className="p-5">
            <p className="font-medium mb-4">
              Learn and practice these key vocabulary terms related to the topic.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {worksheetData.vocabulary_sheet.map((item: any, index: number) => (
                <div key={index} className="border rounded-md p-4 vocabulary-card">
                  <p className="font-semibold text-worksheet-purple">
                    {item.term || ''}
                  </p>
                  <span className="vocabulary-definition-label">Definition or translation:</span>
                  <span className="text-sm text-gray-500">_____________________</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedWorksheetContent;
