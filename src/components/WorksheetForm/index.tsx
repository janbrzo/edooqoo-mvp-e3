import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LessonTime, EnglishLevel, FormData, WorksheetFormProps, ExerciseSelectionMode } from './types';
import { getRandomPlaceholderSet, PlaceholderSet } from './placeholderSets';
import { getRandomSuggestionSets, getSuggestionSetMatchingPlaceholder, SuggestionSet } from './suggestionSets';
import FormField from './FormField';
import AdvancedOptions from './AdvancedOptions';
import ExerciseSelector from './ExerciseSelector';
import TypewriterHint from './TypewriterHint';
import { useIsMobile } from "@/hooks/use-mobile";
import { useEventTracking } from "@/hooks/useEventTracking";
import { useAnonymousAuth } from "@/hooks/useAnonymousAuth";
import { useStudents } from "@/hooks/useStudents";
import { useOnboardingProgress } from "@/hooks/useOnboardingProgress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shuffle, Brain, MousePointer, ChevronDown, Image, Headphones, Lock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import type { MediaType } from './types';
export type { FormData };
interface ImageSuggestion {
  id: string;
  url: string;
  thumbnail: string;
  description: string;
  photographer: string;
  photographerUrl: string;
}
interface ExtendedWorksheetFormProps extends WorksheetFormProps {
  onStudentChange?: (studentId: string | null) => void;
  preSelectedStudent?: {
    id: string;
    name: string;
  } | null;
}
export default function WorksheetForm({
  onSubmit,
  onStudentChange,
  preSelectedStudent
}: ExtendedWorksheetFormProps) {
  const [lessonTime, setLessonTime] = useState<LessonTime>("60min");
  const [lessonTopic, setLessonTopic] = useState("");
  const [lessonGoal, setLessonGoal] = useState("");
  const [grammarFocus, setGrammarFocus] = useState("");
  const [additionalInformation, setAdditionalInformation] = useState("");
  const [englishLevel, setEnglishLevel] = useState<EnglishLevel>("B1/B2");
  const [languageStyle, setLanguageStyle] = useState<number>(3); // Default neutral style
  const [selectedStudentId, setSelectedStudentId] = useState<string>("no-student");

  // Initialize selectedExercises based on lessonTime and selectionMode
  const getInitialExercises = (): string[] => {
    const MANUAL_EXERCISES_60MIN = ['reading', 'true-false', 'matching', 'fill-in-blanks', 'categorize', 'odd-one-out', 'multiple-choice', 'discussion'];
    const MANUAL_EXERCISES_45MIN = ['reading', 'true-false', 'matching', 'fill-in-blanks', 'categorize', 'odd-one-out'];
    return lessonTime === '45min' ? MANUAL_EXERCISES_45MIN : MANUAL_EXERCISES_60MIN;
  };
  const [selectedExercises, setSelectedExercises] = useState<string[]>(getInitialExercises());
  const [selectionMode, setSelectionMode] = useState<ExerciseSelectionMode>('manual');
  const [selectedMediaTypes, setSelectedMediaTypes] = useState<MediaType[]>([]);
  const [exerciseFocusMap, setExerciseFocusMap] = useState<Record<string, 'vocabulary' | 'grammar'>>({});
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [currentPlaceholders, setCurrentPlaceholders] = useState<PlaceholderSet>(getRandomPlaceholderSet());
  const [currentSuggestions, setCurrentSuggestions] = useState<SuggestionSet[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [activeTab, setActiveTab] = useState<'exercises' | 'advanced' | null>(null);
  const [showMoreFields, setShowMoreFields] = useState(false);
  const {
    toast
  } = useToast();
  const isMobile = useIsMobile();
  const {
    trackEvent
  } = useEventTracking();
  const {
    userId
  } = useAnonymousAuth();
  const {
    students
  } = useStudents();
  const {
    refreshProgress
  } = useOnboardingProgress();

  // REMOVED: Backup initialization to avoid race condition with ExerciseSelector
  // ExerciseSelector is now solely responsible for initialization

  useEffect(() => {
    if (preSelectedStudent) {
      setSelectedStudentId(preSelectedStudent.id);
    }
  }, [preSelectedStudent]);

  // Handle prefill from Progress Tab "Use This" button
  useEffect(() => {
    const prefillData = sessionStorage.getItem('prefillWorksheet');
    if (prefillData) {
      try {
        const parsed = JSON.parse(prefillData);
        if (parsed.topic) {
          setLessonTopic(parsed.topic);
        }
        if (parsed.goal) {
          setLessonGoal(parsed.goal);
        }
        if (parsed.additionalInfo) {
          setAdditionalInformation(parsed.additionalInfo);
        }
        if (parsed.grammarFocus) {
          setGrammarFocus(parsed.grammarFocus);
        }
        sessionStorage.removeItem('prefillWorksheet');
        console.log('✅ [WorksheetForm] Pre-filled from Progress Tab:', parsed);
      } catch (error) {
        console.error('Error parsing prefillWorksheet:', error);
        sessionStorage.removeItem('prefillWorksheet');
      }
    }
  }, []);
  useEffect(() => {
    if (selectedStudentId && selectedStudentId !== "no-student") {
      const selectedStudent = students.find(s => s.id === selectedStudentId);
      if (selectedStudent) {
        const studentLevel = selectedStudent.english_level;
        if (studentLevel === 'A1' || studentLevel === 'A2') {
          setEnglishLevel('A1/A2');
        } else if (studentLevel === 'B1' || studentLevel === 'B2') {
          setEnglishLevel('B1/B2');
        } else if (studentLevel === 'C1' || studentLevel === 'C2') {
          setEnglishLevel('C1/C2');
        }
      }
    }
  }, [selectedStudentId, students]);
  useEffect(() => {
    if (onStudentChange) {
      const studentId = selectedStudentId === "no-student" ? null : selectedStudentId;
      onStudentChange(studentId);
    }
  }, [selectedStudentId, onStudentChange]);
  useEffect(() => {
    if (isInitialLoad) {
      const matchingSet = getSuggestionSetMatchingPlaceholder(currentPlaceholders);
      const randomSets = getRandomSuggestionSets(1);
      if (matchingSet) {
        setCurrentSuggestions([matchingSet, randomSets[0]]);
      } else {
        setCurrentSuggestions(getRandomSuggestionSets(2));
      }
      setIsInitialLoad(false);
    }
  }, [currentPlaceholders, isInitialLoad]);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonTopic) {
      toast({
        title: "Missing information",
        description: "Please fill in the lesson topic",
        variant: "destructive"
      });
      return;
    }

    // Proceed with form submission - image generation handled in backend
    submitForm();
  };
  const submitForm = () => {
    // PROBLEM 2: Media-aware exercise auto-complete
    const PICTURE_COMPATIBLE_EXERCISES = ['describe-picture', 'answer-questions-picture', 'true-false-picture', 'multiple-choice-picture'];
    const AUDIO_COMPATIBLE_EXERCISES = ['listening-comprehension', 'answer-questions-audio', 'true-false-audio', 'multiple-choice-audio', 'fill-in-blanks-audio'];
    const GENERAL_EXERCISES = ['reading', 'true-false', 'matching', 'fill-in-blanks', 'multiple-choice', 'dialogue', 'discussion', 'error-correction', 'odd-one-out', 'synonyms', 'antonyms', 'sentence-transformation', 'word-order', 'gap-text', 'negative-prefixes', 'categorize', 'paraphrasing', 'complete-word', 'matching-halves'];
    
    const isPictureMode = selectedMediaTypes.includes('picture');
    const isAudioMode = selectedMediaTypes.includes('audio');
    
    // Auto-complete exercises if not enough are selected in manual mode
    const maxExercises = lessonTime === '45min' ? 6 : 8;
    let finalExercises = [...selectedExercises];
    if (!finalExercises || finalExercises.length < maxExercises) {
      console.log(`🔧 [WORKSHEET-FORM] Auto-completing exercises: ${finalExercises.length} < ${maxExercises}`);
      console.log(`🔧 [WORKSHEET-FORM] Media mode: picture=${isPictureMode}, audio=${isAudioMode}`);

      // PROBLEM 2.2/2.3: Filter available exercises by media type
      const unusedExercises = GENERAL_EXERCISES.filter(ex => {
        if (finalExercises.includes(ex)) return false;
        // Don't add picture exercises if not in picture mode
        if (!isPictureMode && PICTURE_COMPATIBLE_EXERCISES.includes(ex)) return false;
        // Don't add audio exercises if not in audio mode
        if (!isAudioMode && AUDIO_COMPATIBLE_EXERCISES.includes(ex)) return false;
        return true;
      });

      // Add random exercises to reach the target count
      const remainingSlots = maxExercises - finalExercises.length;
      const shuffledUnused = [...unusedExercises].sort(() => Math.random() - 0.5);
      const autoSelected = shuffledUnused.slice(0, remainingSlots);
      finalExercises = [...finalExercises, ...autoSelected];
      console.log(`🔧 [WORKSHEET-FORM] Auto-completed exercises (media-filtered):`, finalExercises);

      // Update the form state
      setSelectedExercises(finalExercises);

      // Notify user about auto-completion
      if (autoSelected.length > 0) {
        toast({
          title: "Exercises auto-completed",
          description: `Added ${autoSelected.length} additional exercise(s) to reach ${maxExercises} total exercises.`,
          variant: "default"
        });
      }
    }
    trackEvent({
      eventType: 'form_submit',
      eventData: {
        lessonTime,
        lessonTopic,
        lessonGoal,
        grammarFocus,
        additionalInformation,
        englishLevel,
        languageStyle,
        timestamp: new Date().toISOString()
      }
    });
    const formData = {
      lessonTime,
      lessonTopic,
      lessonGoal,
      teachingPreferences: grammarFocus,
      additionalInformation,
      englishLevel,
      languageStyle,
      studentId: selectedStudentId === "no-student" ? undefined : selectedStudentId || undefined,
      selectedExercises: finalExercises,
      selectedMediaTypes,
      exerciseFocusMap: Object.keys(exerciseFocusMap).length > 0 ? exerciseFocusMap : undefined,
      selectedImage: selectedImage
    };

    // Refresh onboarding progress after successful worksheet generation
    console.log('[WorksheetForm] Triggering onboarding refresh after worksheet generation');
    refreshProgress();
    setTimeout(refreshProgress, 1000);
    setTimeout(refreshProgress, 2000);
    onSubmit(formData);
  };
  const refreshSuggestions = () => {
    setCurrentPlaceholders(getRandomPlaceholderSet());
    setCurrentSuggestions(getRandomSuggestionSets(2));
  };

  // Handle selection mode changes
  const handleModeChange = (mode: ExerciseSelectionMode) => {
    console.log(`🔧 [WORKSHEET-FORM] Changing mode to: ${mode}`);
    console.log(`🔧 [WORKSHEET-FORM] Current selectedMediaTypes:`, selectedMediaTypes);
    setSelectionMode(mode);
    setActiveTab('exercises');
    const maxExercises = lessonTime === '45min' ? 6 : 8;
    const isPictureMode = selectedMediaTypes.includes('picture');
    const isAudioMode = selectedMediaTypes.includes('audio');
    let newExercises: string[];
    if (mode === 'manual') {
      // Manual mode - use predefined defaults based on media
      if (isPictureMode) {
        newExercises = lessonTime === '45min' ? ['describe-picture', 'answer-questions-picture', 'fill-in-blanks', 'dialogue', 'matching', 'true-false'] : ['describe-picture', 'answer-questions-picture', 'true-false-picture', 'fill-in-blanks', 'multiple-choice', 'matching', 'dialogue', 'answer-questions'];
      } else if (isAudioMode) {
        newExercises = lessonTime === '45min' ? ['listening-comprehension', 'answer-questions-audio', 'true-false-audio', 'fill-in-blanks', 'multiple-choice-audio', 'matching'] : ['listening-comprehension', 'answer-questions-audio', 'true-false', 'fill-in-blanks-audio', 'multiple-choice', 'dialogue', 'answer-questions', 'matching'];
      } else {
        newExercises = lessonTime === '45min' ? ['reading', 'true-false', 'matching', 'fill-in-blanks', 'categorize', 'odd-one-out'] : ['reading', 'true-false', 'matching', 'fill-in-blanks', 'categorize', 'odd-one-out', 'multiple-choice', 'discussion'];
      }
    } else if (mode === 'random') {
      // PROBLEM 2.1: Random mode - ALWAYS select exact maxExercises count

      const PICTURE_EXERCISES = ['describe-picture', 'answer-questions-picture', 'true-false-picture', 'multiple-choice-picture'];
      const AUDIO_EXERCISES = ['listening-comprehension', 'answer-questions-audio', 'true-false-audio', 'multiple-choice-audio', 'fill-in-blanks-audio'];
      const GENERAL_EXERCISES = ['reading', 'true-false', 'matching', 'fill-in-blanks', 'multiple-choice', 'dialogue', 'discussion', 'error-correction', 'odd-one-out', 'synonyms', 'antonyms', 'sentence-transformation', 'word-order', 'gap-text', 'negative-prefixes', 'categorize', 'paraphrasing', 'complete-word', 'matching-halves'];
      
      if (isPictureMode) {
        // Always select 2 picture exercises + fill rest with general
        const shuffledPicture = [...PICTURE_EXERCISES].sort(() => Math.random() - 0.5);
        const selectedPicture = shuffledPicture.slice(0, Math.min(2, PICTURE_EXERCISES.length));
        const shuffledGeneral = [...GENERAL_EXERCISES].sort(() => Math.random() - 0.5);
        const remainingSlots = maxExercises - selectedPicture.length;
        const selectedGeneral = shuffledGeneral.slice(0, remainingSlots);
        newExercises = [...selectedPicture, ...selectedGeneral];
        console.log('🎲 [RANDOM-PICTURE] Selected exercises:', newExercises, `(${newExercises.length}/${maxExercises})`);
      } else if (isAudioMode) {
        // Always select 2 audio exercises + fill rest with general
        const shuffledAudio = [...AUDIO_EXERCISES].sort(() => Math.random() - 0.5);
        const selectedAudio = shuffledAudio.slice(0, Math.min(2, AUDIO_EXERCISES.length));
        const shuffledGeneral = [...GENERAL_EXERCISES].sort(() => Math.random() - 0.5);
        const remainingSlots = maxExercises - selectedAudio.length;
        const selectedGeneral = shuffledGeneral.slice(0, remainingSlots);
        newExercises = [...selectedAudio, ...selectedGeneral];
        console.log('🎲 [RANDOM-AUDIO] Selected exercises:', newExercises, `(${newExercises.length}/${maxExercises})`);
      } else {
        // No media - pure random from general exercises only
        const shuffled = [...GENERAL_EXERCISES].sort(() => Math.random() - 0.5);
        newExercises = shuffled.slice(0, maxExercises);
        console.log('🎲 [RANDOM-NONE] Selected exercises:', newExercises, `(${newExercises.length}/${maxExercises})`);
      }
      
      // PROBLEM 2.1: Final validation - ensure we have exactly maxExercises
      if (newExercises.length !== maxExercises) {
        console.warn(`⚠️ [RANDOM] Count mismatch: got ${newExercises.length}, expected ${maxExercises}. Fixing...`);
        const availablePool = [...GENERAL_EXERCISES].filter(ex => !newExercises.includes(ex));
        while (newExercises.length < maxExercises && availablePool.length > 0) {
          const randomIdx = Math.floor(Math.random() * availablePool.length);
          newExercises.push(availablePool.splice(randomIdx, 1)[0]);
        }
        console.log('🎲 [RANDOM] Fixed exercises:', newExercises, `(${newExercises.length}/${maxExercises})`);
      }
    } else {
      // Smart mode - use manual defaults for now
      newExercises = lessonTime === '45min' ? ['reading', 'true-false', 'matching', 'fill-in-blanks', 'categorize', 'odd-one-out'] : ['reading', 'true-false', 'matching', 'fill-in-blanks', 'categorize', 'odd-one-out', 'multiple-choice', 'discussion'];
    }
    console.log(`🔧 [WORKSHEET-FORM] Setting exercises for ${mode} mode:`, newExercises, `(${newExercises.length}/${maxExercises})`);
    setSelectedExercises(newExercises);
  };
  const createSuggestionTiles = (field: 'lessonTopic' | 'lessonFocus' | 'additionalInformation' | 'grammarFocus') => {
    return currentSuggestions.map((set, index) => ({
      id: `${set.id}-${field}-${index}`,
      title: set[field]
    }));
  };
  return <div className={`w-full ${isMobile ? 'py-2' : 'py-[24px]'}`}>
      <Card className="bg-white shadow-sm">
        <CardContent className={`${isMobile ? 'p-3' : 'p-8'}`}>
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <div className={`flex ${isMobile ? 'flex-col gap-3' : 'justify-between items-start'} mb-6`}>
                <div className={`${isMobile ? 'text-center' : ''}`}>
                  <h1 className={`font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 ${isMobile ? 'text-xl' : 'text-3xl'} mb-2`}>
                    Create A Worksheet
                  </h1>
                  <p className={`text-gray-600 ${isMobile ? 'text-sm' : 'text-base'}`}>
                    Tailored to your students. In seconds.
                  </p>
                </div>
                
                <div className={`flex ${isMobile ? 'flex-col gap-3' : 'gap-14'}`}>
                  <div className={`flex flex-col ${isMobile ? 'items-center' : 'items-start'}`}>
                    <div className={`flex gap-2 ${isMobile ? 'justify-center' : 'w-32'}`}>
                      <Button type="button" variant={lessonTime === "45min" ? "default" : "outline"} onClick={() => setLessonTime("45min")} className={lessonTime === "45min" ? "bg-worksheet-purple hover:bg-worksheet-purpleDark" : ""} size={isMobile ? "sm" : "sm"}>
                        45 min
                      </Button>
                      <Button type="button" variant={lessonTime === "60min" ? "default" : "outline"} onClick={() => setLessonTime("60min")} className={lessonTime === "60min" ? "bg-worksheet-purple hover:bg-worksheet-purpleDark" : ""} size={isMobile ? "sm" : "sm"}>
                        60 min
                      </Button>
                    </div>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 mt-2 ${isMobile ? 'text-center' : ''}`}>
                      Duration: {lessonTime === '45min' ? '6 exercises' : '8 exercises'}
                    </p>
                  </div>
                  
                  <div className={`flex flex-col ${isMobile ? 'items-center' : 'items-end w-80'}`}>
                    <div className={`flex gap-1 mb-1 ${isMobile ? 'flex-wrap justify-center' : ''}`}>
                      <Button type="button" variant={englishLevel === "A1/A2" ? "default" : "outline"} onClick={() => setEnglishLevel("A1/A2")} className={englishLevel === "A1/A2" ? "bg-worksheet-purple hover:bg-worksheet-purpleDark" : ""} size={isMobile ? "sm" : "sm"}>
                        A1/A2
                      </Button>
                      <Button type="button" variant={englishLevel === "B1/B2" ? "default" : "outline"} onClick={() => setEnglishLevel("B1/B2")} className={englishLevel === "B1/B2" ? "bg-worksheet-purple hover:bg-worksheet-purpleDark" : ""} size={isMobile ? "sm" : "sm"}>
                        B1/B2
                      </Button>
                      <Button type="button" variant={englishLevel === "C1/C2" ? "default" : "outline"} onClick={() => setEnglishLevel("C1/C2")} className={englishLevel === "C1/C2" ? "bg-worksheet-purple hover:bg-worksheet-purpleDark" : ""} size={isMobile ? "sm" : "sm"}>
                        C1/C2
                      </Button>
                    </div>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 ${isMobile ? 'text-center' : ''}`}>
                      CEFR Scale: {englishLevel === "A1/A2" ? "Beginner/Elementary" : englishLevel === "B1/B2" ? "Intermediate/Upper-Intermediate" : "Advanced/Proficiency"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Typewriter Hint */}
              <TypewriterHint />

              {/* Lesson Topic - Always Visible, with Lesson Focus appearing next to it */}
              <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : showMoreFields ? 'md:grid-cols-2 gap-6' : ''} mb-6`}>
                <FormField label="Lesson topic: General theme or real‑life scenario" placeholder={currentPlaceholders.lessonTopic} value={lessonTopic} onChange={setLessonTopic} suggestions={createSuggestionTiles('lessonTopic')} isRequired={true} />
                
                {/* Lesson Focus appears next to Lesson Topic when expanded */}
                {showMoreFields && <FormField label="Lesson focus: What should your student achieve by the end of the lesson?" placeholder={currentPlaceholders.lessonFocus} value={lessonGoal} onChange={setLessonGoal} suggestions={createSuggestionTiles('lessonFocus')} isOptional={true} />}
              </div>

              {/* Show More Link with Preview - button UNDER the blurred preview */}
              {!showMoreFields && <div className="mb-6">
                  {/* Preview with light blur effect showing only field names - CLICKABLE */}
                  <div className="relative overflow-hidden mb-4 py-2 cursor-pointer hover:bg-accent/50 transition-colors rounded-md px-2" onClick={() => setShowMoreFields(true)} title="Click to expand additional fields">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-foreground/60 cursor-pointer">
                          Additional Information: Extra context & personal or situational details
                        </label>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground/60 cursor-pointer">
                          Grammar focus
                        </label>
                      </div>
                    </div>
                    
                    {/* Very light blur overlay */}
                    <div className="absolute inset-0 bg-background/30 backdrop-blur-[0.5px] pointer-events-none" />
                  </div>
                  
                  {/* Button under the preview */}
                  <button type="button" onClick={() => setShowMoreFields(true)} className="w-full text-center text-sm font-medium text-primary hover:text-primary/80 underline decoration-2 underline-offset-4 transition-colors flex items-center justify-center gap-2">
                    <ChevronDown className="h-4 w-4" />
                    Fill more info - get more accurate
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>}

              {/* Additional Fields - Second Row when expanded */}
              {showMoreFields && <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'md:grid-cols-2 gap-6'} mb-6`}>
                  <FormField label="Additional Information: Extra context & personal or situational details" placeholder={currentPlaceholders.additionalInformation} value={additionalInformation} onChange={setAdditionalInformation} suggestions={createSuggestionTiles('additionalInformation')} isOptional={true} />

                  <FormField label="Grammar focus" placeholder={currentPlaceholders.grammarFocus} value={grammarFocus} onChange={setGrammarFocus} suggestions={createSuggestionTiles('grammarFocus')} isOptional={true} />
                </div>}

              {/* Exercise Selection Cards */}
              <div className="mb-6">
                {/* Card Headers in One Line with Student Selector */}
                <div className={`flex ${isMobile ? 'flex-col gap-3' : 'gap-3'} mb-4 items-stretch`}>
                  
                  {/* Student Selection - Lock icon for anonymous/no students, dropdown for authenticated with students */}
                  {userId && students.length > 0 ? (
                    <div className={`${isMobile ? 'w-full' : 'w-[23%]'} flex items-center`}>
                      <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                        <SelectTrigger className="w-full h-full">
                          <SelectValue placeholder="No specific student" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no-student">No specific student</SelectItem>
                          {students.map(student => <SelectItem key={student.id} value={student.id}>
                              {student.name} ({student.english_level})
                            </SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className={`${isMobile ? 'w-full' : 'w-[23%]'} flex items-center`}>
                            <div className="w-full h-full flex items-center gap-2 px-3 py-2 border rounded-md bg-muted/50 text-muted-foreground cursor-help">
                              <Lock className="h-4 w-4 flex-shrink-0" />
                              <span className="text-sm truncate">
                                {userId ? 'Add students first' : 'Student assignment'}
                              </span>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>{userId ? '➕ Add students in Dashboard to assign worksheets' : '🔒 Log in to assign worksheets to students'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  
                  {/* Exercise Types Card Header */}
                  <Card className={`border-2 cursor-pointer transition-colors ${isMobile ? 'w-full' : 'flex-1'} ${activeTab === 'exercises' ? 'border-worksheet-purple bg-worksheet-purpleLight' : 'border-gray-200 hover:border-gray-300'}`} onClick={() => setActiveTab(activeTab === 'exercises' ? null : 'exercises')}>
                    <div className="p-2.5">
                      {/* Card Header with Title and Mode Selection Tiles in Same Line */}
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-800">Exercise Types</h3>
                          <div className="flex gap-1 ml-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Exclusive selection - tylko jeden na raz
                                const maxExercises = lessonTime === '45min' ? 6 : 8;
                                const PICTURE_EXERCISES_45MIN = ['describe-picture', 'answer-questions-picture', 'fill-in-blanks', 'dialogue', 'matching', 'true-false'];
                                const PICTURE_EXERCISES_60MIN = ['describe-picture', 'answer-questions-picture', 'true-false-picture', 'fill-in-blanks', 'multiple-choice', 'matching', 'dialogue', 'answer-questions'];
                                
                                if (selectedMediaTypes.includes('picture')) {
                                  setSelectedMediaTypes([]);
                                  // Reset to default exercises
                                  const defaultExercises = lessonTime === '45min' 
                                    ? ['reading', 'true-false', 'matching', 'fill-in-blanks', 'categorize', 'odd-one-out']
                                    : ['reading', 'true-false', 'matching', 'fill-in-blanks', 'categorize', 'odd-one-out', 'multiple-choice', 'discussion'];
                                  setSelectedExercises(defaultExercises);
                                } else {
                                  setSelectedMediaTypes(['picture'] as MediaType[]);
                                  // Select picture exercises
                                  const pictureExercises = lessonTime === '45min' ? PICTURE_EXERCISES_45MIN : PICTURE_EXERCISES_60MIN;
                                  setSelectedExercises(pictureExercises);
                                }
                                if (!activeTab) setActiveTab('exercises');
                              }}
                              className={`flex items-center gap-1 px-2 py-1 rounded border transition-all ${
                                selectedMediaTypes.includes('picture')
                                  ? 'border-blue-500 bg-blue-50 text-blue-600'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              title="Include picture-based exercises"
                            >
                              <input 
                                type="checkbox" 
                                checked={selectedMediaTypes.includes('picture')}
                                onChange={() => {}}
                                className="h-3 w-3 accent-blue-500"
                              />
                              <Image className="h-4 w-4 text-blue-500" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Exclusive selection - tylko jeden na raz
                                const maxExercises = lessonTime === '45min' ? 6 : 8;
                                const AUDIO_EXERCISES_45MIN = ['listening-comprehension', 'answer-questions-audio', 'true-false-audio', 'fill-in-blanks', 'multiple-choice-audio', 'matching'];
                                const AUDIO_EXERCISES_60MIN = ['listening-comprehension', 'answer-questions-audio', 'true-false', 'fill-in-blanks-audio', 'multiple-choice', 'dialogue', 'answer-questions', 'matching'];
                                
                                if (selectedMediaTypes.includes('audio')) {
                                  setSelectedMediaTypes([]);
                                  // Reset to default exercises
                                  const defaultExercises = lessonTime === '45min' 
                                    ? ['reading', 'true-false', 'matching', 'fill-in-blanks', 'categorize', 'odd-one-out']
                                    : ['reading', 'true-false', 'matching', 'fill-in-blanks', 'categorize', 'odd-one-out', 'multiple-choice', 'discussion'];
                                  setSelectedExercises(defaultExercises);
                                } else {
                                  setSelectedMediaTypes(['audio'] as MediaType[]);
                                  // Select audio exercises
                                  const audioExercises = lessonTime === '45min' ? AUDIO_EXERCISES_45MIN : AUDIO_EXERCISES_60MIN;
                                  setSelectedExercises(audioExercises);
                                }
                                if (!activeTab) setActiveTab('exercises');
                              }}
                              className={`flex items-center gap-1 px-2 py-1 rounded border transition-all ${
                                selectedMediaTypes.includes('audio')
                                  ? 'border-orange-500 bg-orange-50 text-orange-600'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              title="Include audio-based exercises"
                            >
                              <input 
                                type="checkbox" 
                                checked={selectedMediaTypes.includes('audio')}
                                onChange={() => {}}
                                className="h-3 w-3 accent-orange-500"
                              />
                              <Headphones className="h-4 w-4 text-orange-500" />
                            </button>
                          </div>
                        </div>
                        
                        {/* Mode Selection Tiles - Always Visible, Beside Title */}
                        <div className="flex gap-1">
                          <button type="button" onClick={e => {
                          e.stopPropagation();
                          handleModeChange('manual');
                        }} className={`relative flex items-center gap-1 px-2 py-1 rounded-lg border transition-all text-center group ${selectionMode === 'manual' ? 'border-worksheet-purple bg-worksheet-purple text-white' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'}`}>
                            <MousePointer className="h-3 w-3" />
                            <span className="text-xs font-medium">Manual</span>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                              Choose exercises manually
                            </div>
                          </button>
                          
                          <button type="button" onClick={e => {
                          e.stopPropagation();
                          handleModeChange('random');
                        }} className={`relative flex items-center gap-1 px-2 py-1 rounded-lg border transition-all text-center group ${selectionMode === 'random' ? 'border-worksheet-purple bg-worksheet-purple text-white' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'}`}>
                            <Shuffle className="h-3 w-3" />
                            <span className="text-xs font-medium">Random</span>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                              Random exercise selection
                            </div>
                          </button>
                          
                          <button type="button" onClick={e => e.stopPropagation()} disabled className="relative flex items-center gap-1 px-2 py-1 rounded-lg border border-gray-200 bg-gray-100 text-center group cursor-not-allowed opacity-50">
                            <Brain className="h-3 w-3 text-gray-400" />
                            <span className="text-xs font-medium text-gray-400">Smart</span>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                              Coming soon - AI optimized selection
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Advanced Options Card Header */}
                  <Card className={`border-2 cursor-pointer transition-colors ${isMobile ? 'w-full' : 'w-[23%]'} ${activeTab === 'advanced' ? 'border-worksheet-purple bg-worksheet-purpleLight' : 'border-gray-200 hover:border-gray-300'}`} onClick={() => setActiveTab(activeTab === 'advanced' ? null : 'advanced')}>
                    <div className="p-2.5">
                      <h3 className="font-semibold text-gray-800 text-base">Language Style</h3>
                    </div>
                  </Card>
                </div>

                {/* Card Content - Full Width Below Headers */}
                {activeTab === 'exercises' && <Card className="border-2 border-worksheet-purple">
                    <div className="p-4">
                      <ExerciseSelector lessonTime={lessonTime} selectedExercises={selectedExercises} onChange={setSelectedExercises} selectionMode={selectionMode} selectedMediaTypes={selectedMediaTypes} onMediaTypesChange={setSelectedMediaTypes} exerciseFocusMap={exerciseFocusMap} onFocusChange={(exerciseId, focus) => {
                        setExerciseFocusMap(prev => {
                          const next = { ...prev };
                          if (focus === undefined) {
                            delete next[exerciseId];
                          } else {
                            next[exerciseId] = focus;
                          }
                          return next;
                        });
                      }} />
                    </div>
                  </Card>}

                {activeTab === 'advanced' && <Card className="border-2 border-worksheet-purple">
                    <div className="p-4">
                      <AdvancedOptions languageStyle={languageStyle} onLanguageStyleChange={setLanguageStyle} />
                    </div>
                  </Card>}
              </div>

              <div className={`mb-6 ${isMobile ? 'text-center' : ''}`}>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>
                  GENERAL HINT: To create a truly personalized, student‑focused worksheet, please provide as detailed a description as possible in each field.
                </p>
              </div>

              <div className={`flex ${isMobile ? 'flex-col gap-3' : 'justify-between'} pt-4`}>
                <Button type="button" variant="outline" onClick={refreshSuggestions} className={`border-worksheet-purple text-worksheet-purple hover:bg-worksheet-purpleLight ${isMobile ? 'w-full' : ''}`} size={isMobile ? "sm" : "default"}>
                  Refresh Suggestions
                </Button>
                <Button type="submit" className={`bg-worksheet-purple hover:bg-worksheet-purpleDark ${isMobile ? 'w-full' : ''}`} size={isMobile ? "sm" : "default"}>
                  Generate Custom Worksheet
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>;
}