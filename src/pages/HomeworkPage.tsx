import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ExerciseSection from "@/components/worksheet/ExerciseSection";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Calendar, User, Mail, CheckCircle2, FileText, Send, Clock, ArrowUp, Volume2, ImageIcon, X, Unlock, Save, RotateCcw, Maximize2 } from "lucide-react";
import { format } from "date-fns";
import { deepFixTextObjects } from "@/utils/textObjectFixer";
import { useInteractiveHomework } from "@/hooks/useInteractiveHomework";
import { StudentEmailVerification } from "@/components/homework/StudentEmailVerification";
import { HomeworkProgressBar } from "@/components/homework/HomeworkProgressBar";
import { ExerciseNavSidebar } from "@/components/worksheet/ExerciseNavSidebar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface HomeworkData {
  id: string;
  title: string;
  selected_exercises: any;
  deadline: string | null;
  created_at: string;
  teacher_email: string;
  teacher_first_name: string;
  teacher_last_name: string;
  student_name: string;
  student_english_level: string;
  source_worksheet_title: string;
  completed_at?: string | null;
  reviewed_at?: string | null;
  selected_image?: { url: string; photographer?: string; photographerUrl?: string } | null;
  selected_audio?: { url: string; transcript?: string } | null;
  audio_url?: string | null;
}

export default function HomeworkPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [homework, setHomework] = useState<HomeworkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [isTeacher, setIsTeacher] = useState(false);
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const [studentEmailForTeacher, setStudentEmailForTeacher] = useState<string | null>(null);
  const [studentIdForTeacher, setStudentIdForTeacher] = useState<string | null>(null);
  
  // Teacher edit mode state (Problem 2)
  const [teacherEditMode, setTeacherEditMode] = useState(false);
  const [teacherLocalAnswers, setTeacherLocalAnswers] = useState<Record<number, any>>({});
  const [originalAnswersSnapshot, setOriginalAnswersSnapshot] = useState<Record<number, any>>({});
  const [isSavingTeacherEdits, setIsSavingTeacherEdits] = useState(false);
  
  // Navigation state
  const [activeExercise, setActiveExercise] = useState<number | null>(null);
  const [collapsedExercises, setCollapsedExercises] = useState<Map<number, boolean>>(new Map());
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // Pinned media state (Problem 3) - separate states for audio and image panels
  const [showPinnedAudioPanel, setShowPinnedAudioPanel] = useState(false);
  const [showPinnedImagePanel, setShowPinnedImagePanel] = useState(false);
  const [isImageFullScreen, setIsImageFullScreen] = useState(false);
  
  const exerciseRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Interactive homework hook - only active after email verification
  const totalExercises = Array.isArray(homework?.selected_exercises) 
    ? homework.selected_exercises.length 
    : 0;

  // Calculate question counts for each exercise (for progress tracking)
  const exerciseQuestionCounts: Record<number, number> = {};
  if (Array.isArray(homework?.selected_exercises)) {
    homework.selected_exercises.forEach((ex: any, idx: number) => {
      const count = ex.questions?.length || ex.sentences?.length || 
                    ex.statements?.length || ex.items?.length || 
                    ex.pairs?.length || ex.words?.length ||
                    ex.expressions?.length || ex.prompts?.length || 1;
      exerciseQuestionCounts[idx] = count;
    });
  }

  // For teacher: use student's email to load their answers. For student: use verified email
  const emailForAnswers = isTeacher ? (studentEmailForTeacher || '') : (verifiedEmail || '');
  
  const {
    answers,
    isLoading: answersLoading,
    isSaving,
    lastSavedAt,
    isSubmitted,
    submittedAt,
    updateAnswer,
    saveOnBlur,
    submitHomework,
    verifyStudentEmail,
    getProgress
  } = useInteractiveHomework({
    homeworkId: homework?.id || '',
    studentEmail: emailForAnswers,
    totalExercises,
    exerciseQuestionCounts
  });

  useEffect(() => {
    if (!token) {
      toast.error("Invalid homework link");
      navigate("/");
      return;
    }

    loadHomework();
  }, [token]);

  useEffect(() => {
    if (homework?.completed_at) {
      setIsCompleted(true);
    }
  }, [homework]);

  // Check if logged-in user is the teacher (skip email verification) and get student email for answer loading
  useEffect(() => {
    const checkTeacher = async () => {
      if (!homework) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch teacher_id and student info from homework
        const { data: homeworkData } = await supabase
          .from('homework_assignments')
          .select('teacher_id, student_id')
          .eq('id', homework.id)
          .single();
        
        if (homeworkData && homeworkData.teacher_id === user.id) {
          console.log('[HomeworkPage] Logged-in user is teacher, skipping email verification');
          setIsTeacher(true);
          setVerifiedEmail('teacher');
          
          // Fetch student email so teacher can see student's answers
          if (homeworkData.student_id) {
            setStudentIdForTeacher(homeworkData.student_id);
            
            const { data: studentData } = await supabase
              .from('students')
              .select('student_email')
              .eq('id', homeworkData.student_id)
              .single();
            
            if (studentData?.student_email) {
              console.log('[HomeworkPage] Loaded student email for teacher view:', studentData.student_email);
              setStudentEmailForTeacher(studentData.student_email);
            }
          }
        }
      }
    };
    
    checkTeacher();
  }, [homework?.id]);

  // Scroll tracking for navigation and scroll-up button (Problem 3: removed auto-show media on scroll)
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
      
      // Track active exercise
      exerciseRefs.current.forEach((ref, index) => {
        if (ref) {
          const rect = ref.getBoundingClientRect();
          if (rect.top <= 150 && rect.bottom > 150) {
            setActiveExercise(index);
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Teacher edit mode handlers (Problem 2) - uses LOCAL state to prevent auto-save until Save clicked
  const handleTeacherUnlockEdit = () => {
    // Save a deep copy of current answers for potential discard
    const snapshot = JSON.parse(JSON.stringify(answers));
    setOriginalAnswersSnapshot(snapshot);
    setTeacherLocalAnswers(snapshot);
    setTeacherEditMode(true);
    toast.info("Edit mode enabled. Changes won't be saved until you click 'Save'.");
  };

  // Teacher's local answer change handler (does NOT trigger auto-save)
  const handleTeacherLocalAnswerChange = (exerciseIndex: number, exerciseType: string) => 
    (questionIndex: number, value: any) => {
      setTeacherLocalAnswers(prev => ({
        ...prev,
        [exerciseIndex]: {
          ...(prev[exerciseIndex] || {}),
          [questionIndex]: value
        }
      }));
    };

  const handleTeacherSaveChanges = async () => {
    if (!homework || !studentEmailForTeacher) return;
    
    setIsSavingTeacherEdits(true);
    try {
      // Save all modified answers from teacher's LOCAL state to database
      for (const [exerciseIndex, exerciseAnswers] of Object.entries(teacherLocalAnswers)) {
        const exercise = homework.selected_exercises[Number(exerciseIndex)];
        if (exercise) {
          await supabase.rpc('save_homework_answer', {
            p_homework_id: homework.id,
            p_student_email: studentEmailForTeacher,
            p_exercise_index: Number(exerciseIndex),
            p_exercise_type: exercise.type,
            p_answers: JSON.parse(JSON.stringify(exerciseAnswers))
          });
        }
      }
      
      setTeacherEditMode(false);
      toast.success("Changes saved successfully!");
      // Reload page to refresh answers from DB
      window.location.reload();
    } catch (error) {
      console.error('Error saving teacher edits:', error);
      toast.error("Failed to save changes");
    } finally {
      setIsSavingTeacherEdits(false);
    }
  };

  const handleTeacherDiscardChanges = () => {
    // Simply exit edit mode - local changes are discarded, DB unchanged
    setTeacherLocalAnswers({});
    setOriginalAnswersSnapshot({});
    setTeacherEditMode(false);
    toast.info("Changes discarded.");
  };

  // Navigation functions
  const scrollToExercise = useCallback((index: number) => {
    const ref = exerciseRefs.current[index];
    if (ref) {
      ref.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveExercise(index);
    }
  }, []);

  const toggleExercise = useCallback((index: number) => {
    setCollapsedExercises(prev => {
      const newMap = new Map(prev);
      newMap.set(index, !prev.get(index));
      return newMap;
    });
  }, []);

  const collapseAll = useCallback(() => {
    if (!homework?.selected_exercises) return;
    const newMap = new Map<number, boolean>();
    homework.selected_exercises.forEach((_: any, index: number) => {
      newMap.set(index, true);
    });
    setCollapsedExercises(newMap);
  }, [homework?.selected_exercises]);

  const expandAll = useCallback(() => {
    setCollapsedExercises(new Map());
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loadHomework = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_homework_by_share_token', { p_share_token: token })
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast.error("Homework not found or link expired");
        navigate("/");
        return;
      }

      // Fix nested {text: "..."} objects that cause React error #31
      const fixedData = {
        ...data,
        selected_exercises: deepFixTextObjects(data.selected_exercises, 'homework.selected_exercises')
      };

      console.log('[HomeworkPage] Loaded and fixed homework data:', {
        id: fixedData.id,
        exerciseCount: Array.isArray(fixedData.selected_exercises) ? fixedData.selected_exercises.length : 0
      });

      setHomework(fixedData as HomeworkData);
      
      // Fetch reviewed_at status separately (not in RPC)
      const { data: homeworkStatus } = await supabase
        .from('homework_assignments')
        .select('reviewed_at, completed_at')
        .eq('id', fixedData.id)
        .single();
      
      if (homeworkStatus) {
        setHomework(prev => prev ? {
          ...prev,
          reviewed_at: homeworkStatus.reviewed_at,
          completed_at: homeworkStatus.completed_at
        } : null);
      }
    } catch (error) {
      console.error('Error loading homework:', error);
      toast.error("Failed to load homework");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  // Check if homework is incomplete before submitting
  const handleSubmitClick = () => {
    const progress = getProgress();
    if (progress.percentageComplete < 100) {
      setShowIncompleteModal(true);
    } else {
      handleMarkCompleted();
    }
  };

  const handleMarkCompleted = async () => {
    if (!homework) return;

    // If we have interactive answers, use submitHomework instead
    if (verifiedEmail && verifiedEmail !== 'teacher') {
      const success = await submitHomework();
      if (success) {
        setIsCompleted(true);
      }
      return;
    }

    // Fallback to original behavior for non-interactive mode or teacher
    setIsCompleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || 'anonymous';

      const { data, error } = await supabase.rpc('mark_homework_completed', {
        p_homework_id: homework.id,
        p_user_id: userId,
        p_is_teacher: isTeacher
      });

      if (error) throw error;

      setIsCompleted(true);
      toast.success("Homework marked as completed!");
    } catch (error: any) {
      console.error('Error marking homework as completed:', error);
      toast.error(error.message || "Failed to mark homework as completed");
    } finally {
      setIsCompleting(false);
    }
  };

  // Handle answer change for interactive mode
  const handleAnswerChange = (exerciseIndex: number, exerciseType: string) => 
    (questionIndex: number, value: any) => {
      updateAnswer(exerciseIndex, exerciseType, questionIndex, value);
    };

  // Handle blur for immediate save
  const handleExerciseBlur = (exerciseIndex: number, exerciseType: string) => () => {
    saveOnBlur(exerciseIndex, exerciseType);
  };

  // Extract media from homework (worksheet-level and exercise-level)
  const extractMediaFromHomework = (homework: HomeworkData) => {
    const media = {
      images: [] as string[],
      audios: [] as { url: string; transcript?: string }[],
      hasImageMedia: false,
      hasAudioMedia: false
    };
    
    console.log('[HomeworkPage] Extracting media from homework:', homework);
    
    // First, check homework-level media (from source worksheet)
    if (homework.selected_image?.url) {
      console.log('[HomeworkPage] Found homework-level image:', homework.selected_image.url);
      media.images.push(homework.selected_image.url);
      media.hasImageMedia = true;
    }
    
    if (homework.selected_audio?.url) {
      console.log('[HomeworkPage] Found homework-level audio (selected_audio):', homework.selected_audio.url);
      media.audios.push({
        url: homework.selected_audio.url,
        transcript: homework.selected_audio.transcript
      });
    } else if (homework.audio_url) {
      console.log('[HomeworkPage] Found homework-level audio (audio_url):', homework.audio_url);
      media.audios.push({ url: homework.audio_url });
    }
    
    // Then, check exercise-level media
    if (!Array.isArray(homework.selected_exercises)) {
      console.log('[HomeworkPage] No exercises array found');
      return media;
    }
    
    console.log('[HomeworkPage] Checking', homework.selected_exercises.length, 'exercises for media');
    
    homework.selected_exercises.forEach((exercise, index) => {
      console.log(`[HomeworkPage] Exercise ${index}:`, {
        type: exercise.type,
        hasImageUrl: !!exercise.image_url,
        hasAudioUrl: !!exercise.audio_url,
        keys: Object.keys(exercise)
      });
      
      // Extract images from picture exercises
      const pictureTypes = ['picture', 'image', 'describe', 'answer-questions-picture', 'describe-picture'];
      if (pictureTypes.includes(exercise.type) && exercise.image_url && !media.images.includes(exercise.image_url)) {
        console.log('[HomeworkPage] Found exercise image:', exercise.image_url);
        media.images.push(exercise.image_url);
      }
      
      // Extract audio from listening exercises
      const audioTypes = ['listening', 'audio', 'listening-comprehension', 'answer-questions-audio', 'true-false-audio'];
      if (audioTypes.includes(exercise.type) && exercise.audio_url) {
        const existingAudio = media.audios.find(a => a.url === exercise.audio_url);
        if (!existingAudio) {
          console.log('[HomeworkPage] Found exercise audio:', exercise.audio_url);
          media.audios.push({
            url: exercise.audio_url,
            transcript: exercise.audio_transcript
          });
        }
      }
    });
    
    console.log('[HomeworkPage] Media extraction complete:', {
      images: media.images.length,
      audios: media.audios.length
    });
    
    return media;
  };

  const media = homework ? extractMediaFromHomework(homework) : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!homework) {
    return null;
  }

  const teacherName = homework.teacher_first_name && homework.teacher_last_name
    ? `${homework.teacher_first_name} ${homework.teacher_last_name}`
    : homework.teacher_email;

  // Prepare exercises for nav sidebar
  const exercisesForNav = Array.isArray(homework.selected_exercises) 
    ? homework.selected_exercises.map((ex: any) => ({
        title: ex.title || ex.type || 'Exercise',
        icon: ex.icon || 'FileText',
        estimated_time: ex.estimated_time
      }))
    : [];
    
  const isAllCollapsed = exercisesForNav.length > 0 && 
    exercisesForNav.every((_: any, idx: number) => collapsedExercises.get(idx));
  const isAllExpanded = collapsedExercises.size === 0;

  // Get progress for progress bar
  const progress = getProgress();
  const finalIsSubmitted = isSubmitted || isCompleted;
  
  // Student sees correct answers immediately after submitting
  const showCorrectAnswersToStudent = finalIsSubmitted;
  
  // Check if email verification is needed
  const needsEmailVerification = !verifiedEmail && !isTeacher;

  return (
    <div className="min-h-screen bg-background">
      {/* Email verification overlay - homework visible behind with blur */}
      {needsEmailVerification && (
        <StudentEmailVerification
          homeworkId={homework.id}
          studentName={homework.student_name}
          teacherName={teacherName}
          verifyEmail={verifyStudentEmail}
          onVerified={setVerifiedEmail}
        />
      )}
      
      {/* Main homework content - blocked when verification needed */}
      <div className={needsEmailVerification ? 'pointer-events-none' : ''}>
      {/* Progress Bar with Teacher Edit Controls */}
      <HomeworkProgressBar
        progress={progress}
        isSaving={isSaving}
        lastSavedAt={lastSavedAt}
        isSubmitted={finalIsSubmitted}
        isTeacher={isTeacher}
        teacherEditMode={teacherEditMode}
        isSavingTeacherEdits={isSavingTeacherEdits}
        onUnlockEdit={handleTeacherUnlockEdit}
        onSaveChanges={handleTeacherSaveChanges}
        onDiscardChanges={handleTeacherDiscardChanges}
        studentName={homework.student_name}
        studentId={studentIdForTeacher || undefined}
      />

      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {homework.title}
              </h1>
              {homework.source_worksheet_title && (
                <p className="text-sm text-muted-foreground">
                  From worksheet: {homework.source_worksheet_title}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {homework.student_name && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>For: <strong>{homework.student_name}</strong></span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>Teacher: <strong>{teacherName}</strong></span>
              </div>
              
              {homework.deadline && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Deadline: <strong>{format(new Date(homework.deadline), "PPP HH:mm")}</strong>
                  </span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  Created: <strong>{format(new Date(homework.created_at), "MMM dd, yyyy HH:mm")}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Exercise Navigation Sidebar */}
      {exercisesForNav.length > 0 && (
        <ExerciseNavSidebar
          exercises={exercisesForNav}
          activeExercise={activeExercise}
          collapsedExercises={collapsedExercises}
          onScrollToExercise={scrollToExercise}
          onToggleExercise={toggleExercise}
          onCollapseAll={collapseAll}
          onExpandAll={expandAll}
          isAllCollapsed={isAllCollapsed}
          isAllExpanded={isAllExpanded}
        />
      )}

      {/* Lesson Media Section */}
      <div className="max-w-5xl mx-auto px-4 py-8 lesson-media-section">
        {media && (media.images.length > 0 || media.audios.length > 0) ? (
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Lesson Media
            </h2>
            
            {/* Images */}
            {media.images.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Images</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {media.images.map((imageUrl, idx) => (
                    <img 
                      key={idx}
                      src={imageUrl} 
                      alt={`Lesson image ${idx + 1}`}
                      className="rounded-lg mx-auto object-contain max-h-96 w-full md:w-auto"
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Audio */}
            {media.audios.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Audio</h3>
                <div className="space-y-4">
                  {media.audios.map((audio, idx) => (
                    <div key={idx} className="border rounded-lg p-4 bg-muted/30">
                      <audio controls className="w-full mb-2">
                        <source src={audio.url} type="audio/mpeg" />
                        Your browser does not support audio.
                      </audio>
                      {audio.transcript && (
                        <div className="text-sm text-muted-foreground mt-2 p-3 bg-background rounded">
                          <strong>Transcript:</strong>
                          <p className="mt-1">{audio.transcript}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        ) : (
          <Card className="p-6 bg-muted/30 border-dashed">
            <p className="text-sm text-muted-foreground text-center">
              <FileText className="h-4 w-4 inline mr-2" />
              No images or audio files in this homework. Check browser console for details.
            </p>
          </Card>
        )}
      </div>

      {/* Exercises */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {Array.isArray(homework.selected_exercises) && homework.selected_exercises.map((exercise, index) => (
            <div 
              key={index} 
              ref={el => exerciseRefs.current[index] = el}
              onBlur={handleExerciseBlur(index, exercise.type)}
              data-exercise-index={index}
            >
              <ExerciseSection
                exercise={exercise}
                index={index + 1}
                isEditing={false}
                viewMode="student"
                editableWorksheet={{ exercises: homework.selected_exercises }}
                setEditableWorksheet={() => {}}
                hideExerciseMedia={media?.hasImageMedia || media?.hasAudioMedia}
                // Interactive props - teacher uses LOCAL state when editing
                isInteractive={true}
                studentAnswers={
                  isTeacher && teacherEditMode 
                    ? (teacherLocalAnswers[index] || answers[index] || {}) as any
                    : (answers[index] || {}) as any
                }
                onAnswerChange={
                  isTeacher 
                    ? (teacherEditMode ? handleTeacherLocalAnswerChange(index, exercise.type) : () => () => {})
                    : handleAnswerChange(index, exercise.type)
                }
                showCorrectAnswers={isTeacher || showCorrectAnswersToStudent}
              />
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-12 space-y-4">
          {/* Submit button - only for students */}
          {!isTeacher && !finalIsSubmitted && (
            <Button 
              onClick={handleSubmitClick}
              disabled={isCompleting || isSaving}
              className="w-full"
              size="lg"
            >
              {isCompleting || isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isSaving ? 'Saving...' : 'Submitting...'}
                </>
              ) : (
                <>
                  <Send className="mr-2 h-5 w-5" />
                  Submit Homework
                </>
              )}
            </Button>
          )}
          
          {/* Teacher view section with Edit controls (Problem 2) */}
          {isTeacher && (
            <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-500">
              <div className="flex items-center justify-center gap-2 mb-4">
                <User className="h-8 w-8 text-blue-500" />
                <p className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                  Teacher View
                </p>
              </div>
              
              {/* Teacher Edit Mode Buttons */}
              <div className="flex flex-wrap justify-center gap-3 mb-4">
                {!teacherEditMode ? (
                  <Button 
                    onClick={handleTeacherUnlockEdit}
                    variant="outline"
                    className="border-blue-500 text-blue-600 hover:bg-blue-50"
                  >
                    <Unlock className="h-4 w-4 mr-2" />
                    Unlock Editing
                  </Button>
                ) : (
                  <>
                    <Button 
                      onClick={handleTeacherSaveChanges}
                      disabled={isSavingTeacherEdits}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isSavingTeacherEdits ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save Changes
                    </Button>
                    <Button 
                      onClick={handleTeacherDiscardChanges}
                      disabled={isSavingTeacherEdits}
                      variant="outline"
                      className="border-red-500 text-red-600 hover:bg-red-50"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Discard Changes
                    </Button>
                  </>
                )}
              </div>
              
              <p className="text-sm text-blue-600 dark:text-blue-400 text-center">
                {teacherEditMode 
                  ? "Edit mode ON. Modify answers and click 'Save Changes' when done."
                  : "You are viewing student's answers. Click 'Unlock Editing' to make changes."}
              </p>
            </div>
          )}
          
          {/* Submitted state for students */}
          {!isTeacher && finalIsSubmitted && (
            <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-lg text-center border-2 border-green-500">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p className="text-lg font-semibold text-green-700 dark:text-green-300">
                Homework Submitted!
              </p>
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                Check the correct answers above. Discuss any questions with your teacher.
              </p>
            </div>
          )}
          
          <div className="p-6 bg-muted rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              {isTeacher 
                ? "This is a preview of the student homework. Click exercise titles to navigate."
                : finalIsSubmitted 
                  ? "Your homework is complete. Review the correct answers above."
                  : "Your answers are automatically saved. Click 'Submit Homework' when you're done."}
            </p>
          </div>
        </div>
      </div>

      {/* Floating UI Elements */}
      {/* Scroll to top button */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-4 right-4 z-50 rounded-full w-12 h-12 p-0 shadow-lg"
          variant="secondary"
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      )}

      {/* Fixed Media Buttons - always visible in bottom right (Problem 3) */}
      {media && (media.images.length > 0 || media.audios.length > 0) && (
        <div className="fixed bottom-20 right-4 z-40 flex flex-col gap-2">
          {media.audios.length > 0 && (
            <Button
              onClick={() => setShowPinnedAudioPanel(!showPinnedAudioPanel)}
              className={`rounded-full w-12 h-12 p-0 shadow-lg ${showPinnedAudioPanel ? 'bg-primary' : 'bg-secondary'}`}
              variant="secondary"
              title="Toggle Audio Player"
            >
              <Volume2 className="h-5 w-5" />
            </Button>
          )}
          {media.images.length > 0 && (
            <Button
              onClick={() => setShowPinnedImagePanel(!showPinnedImagePanel)}
              className={`rounded-full w-12 h-12 p-0 shadow-lg ${showPinnedImagePanel ? 'bg-primary' : 'bg-secondary'}`}
              variant="secondary"
              title="Toggle Image"
            >
              <ImageIcon className="h-5 w-5" />
            </Button>
          )}
        </div>
      )}

      {/* Pinned Audio Panel - shows only on button click */}
      {showPinnedAudioPanel && media && media.audios.length > 0 && (
        <div className="fixed bottom-20 right-20 z-50 bg-background border-2 border-primary/20 rounded-lg shadow-2xl p-4 w-80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Lesson Audio</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPinnedAudioPanel(false)}
              className="h-7 w-7 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <audio controls className="w-full" style={{ height: '40px' }}>
            <source src={media.audios[0].url} type="audio/mpeg" />
          </audio>
        </div>
      )}

      {/* Pinned Image Panel - medium size with X and Maximize buttons */}
      {showPinnedImagePanel && !isImageFullScreen && media && media.images.length > 0 && (
        <div className="fixed bottom-20 right-20 z-50 bg-background border-2 border-primary/20 rounded-lg shadow-2xl p-2 max-w-md">
          <div className="flex justify-end gap-1 mb-1">
            <Button 
              onClick={() => setIsImageFullScreen(true)} 
              size="sm" 
              variant="ghost"
              className="h-7 w-7 p-0"
              title="Fullscreen"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button 
              onClick={() => setShowPinnedImagePanel(false)} 
              size="sm" 
              variant="ghost"
              className="h-7 w-7 p-0"
              title="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <img 
            src={media.images[0]} 
            alt="Lesson image" 
            className="max-w-full max-h-80 object-contain rounded mx-auto"
          />
        </div>
      )}

      {/* Full screen image modal */}
      {isImageFullScreen && media && media.images.length > 0 && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsImageFullScreen(false)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white h-10 w-10 rounded-full"
          >
            <X className="h-6 w-6" />
          </Button>
          <img 
            src={media.images[0]} 
            alt="Lesson image enlarged" 
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}

      {/* Incomplete Homework Modal */}
      <AlertDialog open={showIncompleteModal} onOpenChange={setShowIncompleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Not all exercises completed</AlertDialogTitle>
            <AlertDialogDescription>
              You have only completed {progress.answeredExercises} out of {progress.totalExercises} exercises ({progress.percentageComplete}%). 
              Are you sure you want to submit your homework now?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Working</AlertDialogCancel>
            <AlertDialogAction onClick={handleMarkCompleted}>
              Submit Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  );
}
