import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LessonTime, EnglishLevel, FormData, WorksheetFormProps } from './types';
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
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);

  const [currentPlaceholders, setCurrentPlaceholders] = useState<PlaceholderSet>(getRandomPlaceholderSet());
  const [currentSuggestions, setCurrentSuggestions] = useState<SuggestionSet[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [activeTab, setActiveTab] = useState<'exercises' | 'advanced' | null>('exercises');

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

    // PRE-SUBMIT VALIDATION: Critical check for selectedExercises
    console.log('🔧 [WORKSHEET-FORM] PRE-SUBMIT VALIDATION:');
    console.log('🔧 [WORKSHEET-FORM] selectedExercises:', selectedExercises);
    console.log('🔧 [WORKSHEET-FORM] selectedExercises.length:', selectedExercises.length);
    console.log('🔧 [WORKSHEET-FORM] lessonTime:', lessonTime);
    console.log('🔧 [WORKSHEET-FORM] ✅ selectedExercises validation passed');

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

    console.log('🔧 [WORKSHEET-FORM] ✅ FINAL formData.selectedExercises being sent:', formData.selectedExercises);

    // ENHANCED: Immediate onboarding refresh after successful worksheet generation
    console.log('[WorksheetForm] Triggering onboarding refresh after worksheet generation');
    refreshProgress();
    setTimeout(refreshProgress, 1000);  // Additional refresh after 1s
    setTimeout(refreshProgress, 2000);  // Another refresh after 2s
    
    onSubmit(formData);
  };

  const refreshSuggestions = () => {
    setCurrentPlaceholders(getRandomPlaceholderSet());
    setCurrentSuggestions(getRandomSuggestionSets(2));
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

              {/* Student Selection - only for authenticated users */}
              {userId && students.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Student (optional):
                  </label>
                  <div className={`${isMobile ? 'w-full' : 'w-1/2'}`}>
                    <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a student or leave empty for general worksheet" />
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
                </div>
              )}

              {/* Tab-based Exercise Selection and Advanced Options */}
              <div className="mb-6">
                {/* Tab Header */}
                <div className={`flex ${isMobile ? 'flex-col gap-2' : 'gap-4'} mb-4`}>
                  <button
                    type="button"
                    onClick={() => setActiveTab(activeTab === 'exercises' ? null : 'exercises')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${isMobile ? 'w-full' : 'flex-1 max-w-xs'} ${
                      activeTab === 'exercises' 
                        ? 'bg-worksheet-purple text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Choose Exercises ({selectedExercises.length}/{lessonTime === '45min' ? 6 : 8})
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setActiveTab(activeTab === 'advanced' ? null : 'advanced')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${isMobile ? 'w-full' : 'flex-1 max-w-xs'} ${
                      activeTab === 'advanced' 
                        ? 'bg-worksheet-purple text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Advanced Options
                  </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'exercises' && (
                  <ExerciseSelector 
                    lessonTime={lessonTime}
                    selectedExercises={selectedExercises}
                    onChange={setSelectedExercises}
                  />
                )}

                {activeTab === 'advanced' && (
                  <div className="p-6 bg-white border border-gray-200 rounded-lg">
                    <AdvancedOptions 
                      languageStyle={languageStyle}
                      onLanguageStyleChange={setLanguageStyle}
                    />
                  </div>
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
