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
import { useIsMobile } from "@/hooks/use-mobile";
import { useEventTracking } from "@/hooks/useEventTracking";
import { useAnonymousAuth } from "@/hooks/useAnonymousAuth";
import { useStudents } from "@/hooks/useStudents";
import { useOnboardingProgress } from "@/hooks/useOnboardingProgress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shuffle, Brain, MousePointer } from "lucide-react";

export type { FormData };

interface ExtendedWorksheetFormProps extends WorksheetFormProps {
  onStudentChange?: (studentId: string | null) => void;
  preSelectedStudent?: { id: string; name: string } | null;
}

export default function WorksheetForm({ onSubmit, onStudentChange, preSelectedStudent }: ExtendedWorksheetFormProps) {
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

  const [currentPlaceholders, setCurrentPlaceholders] = useState<PlaceholderSet>(getRandomPlaceholderSet());
  const [currentSuggestions, setCurrentSuggestions] = useState<SuggestionSet[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [activeTab, setActiveTab] = useState<'exercises' | 'advanced' | null>(null);

  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { trackEvent } = useEventTracking();
  const { userId } = useAnonymousAuth();
  const { students } = useStudents();
  const { refreshProgress } = useOnboardingProgress();

  // REMOVED: Backup initialization to avoid race condition with ExerciseSelector
  // ExerciseSelector is now solely responsible for initialization

  useEffect(() => {
    if (preSelectedStudent) {
      setSelectedStudentId(preSelectedStudent.id);
    }
  }, [preSelectedStudent]);

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

    if (!lessonTopic || !lessonGoal || !additionalInformation) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields (Topic, Focus, Additional Information)",
        variant: "destructive"
      });
      return;
    }

    // Auto-complete exercises if not enough are selected in manual mode
    const maxExercises = lessonTime === '45min' ? 6 : 8;
    let finalExercises = [...selectedExercises];
    
    if (!finalExercises || finalExercises.length < maxExercises) {
      console.log(`🔧 [WORKSHEET-FORM] Auto-completing exercises: ${finalExercises.length} < ${maxExercises}`);
      
      // Get available exercises (excluding coming soon ones)
      const availableExercises = [
        'reading', 'true-false', 'matching', 'fill-in-blanks', 'multiple-choice', 
        'dialogue', 'discussion', 'error-correction', 'odd-one-out', 'synonyms-antonyms',
        'sentence-transformation', 'word-order', 'gap-text', 'negative-prefixes', 
        'categorize', 'paraphrasing', 'complete-word', 'matching-halves'
      ];
      
      // Add random exercises to reach the target count
      const remainingSlots = maxExercises - finalExercises.length;
      const unusedExercises = availableExercises.filter(ex => !finalExercises.includes(ex));
      const shuffledUnused = [...unusedExercises].sort(() => Math.random() - 0.5);
      const autoSelected = shuffledUnused.slice(0, remainingSlots);
      
      finalExercises = [...finalExercises, ...autoSelected];
      console.log(`🔧 [WORKSHEET-FORM] Auto-completed exercises:`, finalExercises);
      
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
      selectedExercises: finalExercises
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
    setSelectionMode(mode);
    setActiveTab('exercises'); // Auto-expand Exercise Types card
    
    const maxExercises = lessonTime === '45min' ? 6 : 8;
    const manualDefaults = lessonTime === '45min' 
      ? ['reading', 'true-false', 'matching', 'fill-in-blanks', 'categorize', 'odd-one-out']
      : ['reading', 'true-false', 'matching', 'fill-in-blanks', 'categorize', 'odd-one-out', 'multiple-choice', 'discussion'];
    
    let newExercises: string[];
    if (mode === 'manual') {
      newExercises = manualDefaults;
    } else if (mode === 'random') {
      // Generate random exercises
      const availableExercises = [
        'reading', 'true-false', 'matching', 'fill-in-blanks', 'multiple-choice', 
        'dialogue', 'discussion', 'error-correction', 'odd-one-out', 'synonyms-antonyms',
        'sentence-transformation', 'word-order', 'gap-text', 'negative-prefixes', 
        'categorize', 'paraphrasing', 'complete-word', 'matching-halves'
      ];
      const shuffled = [...availableExercises].sort(() => Math.random() - 0.5);
      newExercises = shuffled.slice(0, maxExercises);
    } else {
      // Smart mode - use manual defaults for now
      newExercises = manualDefaults;
    }
    
    console.log(`🔧 [WORKSHEET-FORM] Setting exercises for ${mode} mode:`, newExercises);
    setSelectedExercises(newExercises);
  };

  const createSuggestionTiles = (field: 'lessonTopic' | 'lessonFocus' | 'additionalInformation' | 'grammarFocus') => {
    return currentSuggestions.map((set, index) => ({
      id: `${set.id}-${field}-${index}`,
      title: set[field]
    }));
  };

  return (
    <div className={`w-full ${isMobile ? 'py-2' : 'py-[24px]'}`}>
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
                      <Button 
                        type="button"
                        variant={lessonTime === "45min" ? "default" : "outline"} 
                        onClick={() => setLessonTime("45min")} 
                        className={lessonTime === "45min" ? "bg-worksheet-purple hover:bg-worksheet-purpleDark" : ""}
                        size={isMobile ? "sm" : "sm"}
                      >
                        45 min
                      </Button>
                      <Button 
                        type="button"
                        variant={lessonTime === "60min" ? "default" : "outline"} 
                        onClick={() => setLessonTime("60min")} 
                        className={lessonTime === "60min" ? "bg-worksheet-purple hover:bg-worksheet-purpleDark" : ""}
                        size={isMobile ? "sm" : "sm"}
                      >
                        60 min
                      </Button>
                    </div>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 mt-2 ${isMobile ? 'text-center' : ''}`}>
                      Duration: {lessonTime === '45min' ? '6 exercises' : '8 exercises'}
                    </p>
                  </div>
                  
                  <div className={`flex flex-col ${isMobile ? 'items-center' : 'items-end w-80'}`}>
                    <div className={`flex gap-1 mb-1 ${isMobile ? 'flex-wrap justify-center' : ''}`}>
                      <Button 
                        type="button"
                        variant={englishLevel === "A1/A2" ? "default" : "outline"} 
                        onClick={() => setEnglishLevel("A1/A2")} 
                        className={englishLevel === "A1/A2" ? "bg-worksheet-purple hover:bg-worksheet-purpleDark" : ""}
                        size={isMobile ? "sm" : "sm"}
                      >
                        A1/A2
                      </Button>
                      <Button 
                        type="button"
                        variant={englishLevel === "B1/B2" ? "default" : "outline"} 
                        onClick={() => setEnglishLevel("B1/B2")} 
                        className={englishLevel === "B1/B2" ? "bg-worksheet-purple hover:bg-worksheet-purpleDark" : ""}
                        size={isMobile ? "sm" : "sm"}
                      >
                        B1/B2
                      </Button>
                      <Button 
                        type="button"
                        variant={englishLevel === "C1/C2" ? "default" : "outline"} 
                        onClick={() => setEnglishLevel("C1/C2")} 
                        className={englishLevel === "C1/C2" ? "bg-worksheet-purple hover:bg-worksheet-purpleDark" : ""}
                        size={isMobile ? "sm" : "sm"}
                      >
                        C1/C2
                      </Button>
                    </div>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 ${isMobile ? 'text-center' : ''}`}>
                      CEFR Scale: {englishLevel === "A1/A2" ? "Beginner/Elementary" : englishLevel === "B1/B2" ? "Intermediate/Upper-Intermediate" : "Advanced/Proficiency"}
                    </p>
                  </div>
                </div>
              </div>

              <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'md:grid-cols-2 gap-6'} mb-6`}>
                <FormField 
                  label="Lesson topic: General theme or real‑life scenario"
                  placeholder={currentPlaceholders.lessonTopic}
                  value={lessonTopic}
                  onChange={setLessonTopic}
                  suggestions={createSuggestionTiles('lessonTopic')}
                  isRequired={true}
                />

                <FormField 
                  label="Lesson focus: What should your student achieve by the end of the lesson?"
                  placeholder={currentPlaceholders.lessonFocus}
                  value={lessonGoal}
                  onChange={setLessonGoal}
                  suggestions={createSuggestionTiles('lessonFocus')}
                  isRequired={true}
                />
              </div>

              <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'md:grid-cols-2 gap-6'} mb-6`}>
                <FormField 
                  label="Additional Information: Extra context & personal or situational details"
                  placeholder={currentPlaceholders.additionalInformation}
                  value={additionalInformation}
                  onChange={setAdditionalInformation}
                  suggestions={createSuggestionTiles('additionalInformation')}
                  isRequired={true}
                />
                
                <FormField 
                  label="Grammar focus (optional):"
                  placeholder={currentPlaceholders.grammarFocus}
                  value={grammarFocus}
                  onChange={setGrammarFocus}
                  suggestions={createSuggestionTiles('grammarFocus')}
                  isOptional={true}
                />
              </div>

              {/* Exercise Selection Cards with Student Selector */}
              <div className="mb-6">
                {/* Card Headers in One Line */}
                <div className={`${isMobile ? 'flex flex-col gap-3' : 'grid grid-cols-[0.7fr_1fr_0.7fr] gap-4'} mb-4`}>
                  
                  {/* Student Selector - only for authenticated users */}
                  {userId && students.length > 0 && (
                    <div className="flex flex-col">
                      <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="No specific student" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no-student">No specific student</SelectItem>
                          {students.map((student) => (
                            <SelectItem key={student.id} value={student.id}>
                              {student.name} ({student.english_level})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {/* Exercise Types Card Header */}
                  <Card 
                    className={`border-2 cursor-pointer transition-colors ${
                      activeTab === 'exercises' 
                        ? 'border-worksheet-purple bg-worksheet-purpleLight' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab(activeTab === 'exercises' ? null : 'exercises')}
                  >
                    <div className="p-3">
                      {/* Card Header with Title and Mode Selection Tiles in Same Line */}
                      <div className="flex items-center justify-between">
                         <h3 className="font-semibold text-gray-800">Exercise Types (20)</h3>
                        
                        {/* Mode Selection Tiles - Always Visible, Beside Title */}
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleModeChange('manual');
                            }}
                            className={`relative flex items-center gap-1 px-2 py-1 rounded-lg border transition-all text-center group ${
                              selectionMode === 'manual'
                                ? 'border-worksheet-purple bg-worksheet-purple text-white'
                                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <MousePointer className="h-3 w-3" />
                            <span className="text-xs font-medium">Manual</span>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                              Choose exercises manually
                            </div>
                          </button>
                          
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleModeChange('random');
                            }}
                            className={`relative flex items-center gap-1 px-2 py-1 rounded-lg border transition-all text-center group ${
                              selectionMode === 'random'
                                ? 'border-worksheet-purple bg-worksheet-purple text-white'
                                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <Shuffle className="h-3 w-3" />
                            <span className="text-xs font-medium">Random</span>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                              Random exercise selection
                            </div>
                          </button>
                          
                          <button
                            type="button"
                            onClick={(e) => e.stopPropagation()}
                            disabled
                            className="relative flex items-center gap-1 px-2 py-1 rounded-lg border border-gray-200 bg-gray-100 text-center group cursor-not-allowed opacity-50"
                          >
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
                  <Card 
                    className={`border-2 cursor-pointer transition-colors ${
                      activeTab === 'advanced' 
                        ? 'border-worksheet-purple bg-worksheet-purpleLight' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab(activeTab === 'advanced' ? null : 'advanced')}
                  >
                    <div className="p-3">
                      <h3 className="font-semibold text-gray-800">Advanced Options</h3>
                    </div>
                  </Card>
                </div>

                {/* Card Content - Full Width Below Headers */}
                {activeTab === 'exercises' && (
                  <Card className="border-2 border-worksheet-purple">
                    <div className="p-4">
                      <ExerciseSelector 
                        lessonTime={lessonTime}
                        selectedExercises={selectedExercises}
                        onChange={setSelectedExercises}
                        selectionMode={selectionMode}
                      />
                    </div>
                  </Card>
                )}

                {activeTab === 'advanced' && (
                  <Card className="border-2 border-worksheet-purple">
                    <div className="p-4">
                      <AdvancedOptions 
                        languageStyle={languageStyle}
                        onLanguageStyleChange={setLanguageStyle}
                      />
                    </div>
                  </Card>
                )}
              </div>

              <div className={`mb-6 ${isMobile ? 'text-center' : ''}`}>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>
                  GENERAL HINT: To create a truly personalized, student‑focused worksheet, please provide as detailed a description as possible in each field.
                </p>
              </div>

              <div className={`flex ${isMobile ? 'flex-col gap-3' : 'justify-between'} pt-4`}>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={refreshSuggestions} 
                  className={`border-worksheet-purple text-worksheet-purple hover:bg-worksheet-purpleLight ${isMobile ? 'w-full' : ''}`}
                  size={isMobile ? "sm" : "default"}
                >
                  Refresh Suggestions
                </Button>
                <Button 
                  type="submit" 
                  className={`bg-worksheet-purple hover:bg-worksheet-purpleDark ${isMobile ? 'w-full' : ''}`}
                  size={isMobile ? "sm" : "default"}
                >
                  Generate Custom Worksheet
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
