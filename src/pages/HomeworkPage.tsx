import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ExerciseSection from "@/components/worksheet/ExerciseSection";
import { ExerciseNavSidebar } from "@/components/worksheet/ExerciseNavSidebar";
import { useWorksheetNavigation } from "@/hooks/useWorksheetNavigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Calendar, User, Mail, CheckCircle2, FileText, Send, Clock, MessageSquare, Image, Volume2, X } from "lucide-react";
import { format } from "date-fns";
import { deepFixTextObjects } from "@/utils/textObjectFixer";
import { useInteractiveHomework } from "@/hooks/useInteractiveHomework";
import { StudentEmailVerification } from "@/components/homework/StudentEmailVerification";
import { HomeworkProgressBar } from "@/components/homework/HomeworkProgressBar";
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

interface TeacherComment {
  exercise_index: number;
  comment_text: string;
}

export default function HomeworkPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [homework, setHomework] = useState<HomeworkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [showConfirmSubmitModal, setShowConfirmSubmitModal] = useState(false);
  const [teacherComments, setTeacherComments] = useState<Record<number, string>>({});
  
  // Pinned media state
  const [showPinnedMedia, setShowPinnedMedia] = useState(true);

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
    studentEmail: verifiedEmail || '',
    totalExercises,
    exerciseQuestionCounts
  });

  // Navigation hook for exercises
  const exercises = Array.isArray(homework?.selected_exercises) 
    ? homework.selected_exercises.map((ex: any, idx: number) => ({
        title: ex.title || `Exercise ${idx + 1}`,
        icon: ex.icon || 'BookOpen',
        estimated_time: ex.time ? `${ex.time} min` : undefined
      }))
    : [];

  const {
    collapsedExercises,
    activeExercise,
    exerciseRefs,
    toggleExercise,
    collapseAll,
    expandAll,
    scrollToExercise,
    isAllCollapsed,
    isAllExpanded
  } = useWorksheetNavigation({ exercises });

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

  // Load teacher comments when homework is reviewed
  useEffect(() => {
    if (homework?.reviewed_at && verifiedEmail) {
      loadTeacherComments();
    }
  }, [homework?.reviewed_at, verifiedEmail]);

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

  // Load teacher comments for reviewed homework
  const loadTeacherComments = async () => {
    if (!homework?.id || !verifiedEmail) return;

    try {
      const { data, error } = await supabase.rpc('get_homework_comments', {
        p_homework_id: homework.id,
        p_student_email: verifiedEmail
      });

      if (error) throw error;

      if (data) {
        const commentsMap: Record<number, string> = {};
        data.forEach((c: any) => {
          commentsMap[c.exercise_index] = c.comment_text;
        });
        setTeacherComments(commentsMap);
      }
    } catch (error) {
      console.error('Error loading teacher comments:', error);
    }
  };

  const handleMarkCompleted = async () => {
    if (!homework) return;

    // Check if progress < 100% and show confirmation modal
    const progress = getProgress();
    if (progress.percentageComplete < 100) {
      setShowConfirmSubmitModal(true);
      return;
    }

    await performSubmit();
  };

  const performSubmit = async () => {
    if (!homework) return;

    // If we have interactive answers, use submitHomework instead
    if (verifiedEmail) {
      const success = await submitHomework();
      if (success) {
        setIsCompleted(true);
      }
      return;
    }

    // Fallback to original behavior for non-interactive mode
    setIsCompleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || 'anonymous';

      const { data, error } = await supabase.rpc('mark_homework_completed', {
        p_homework_id: homework.id,
        p_user_id: userId,
        p_is_teacher: false
      });

      if (error) throw error;

      setIsCompleted(true);
      toast.success("Homework marked as completed! Your teacher has been notified.");
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
      media.hasAudioMedia = true;
    } else if (homework.audio_url) {
      console.log('[HomeworkPage] Found homework-level audio (audio_url):', homework.audio_url);
      media.audios.push({ url: homework.audio_url });
      media.hasAudioMedia = true;
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
  const hasMedia = media && (media.images.length > 0 || media.audios.length > 0);

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

  // Show email verification screen if not verified yet
  if (!verifiedEmail) {
    return (
      <StudentEmailVerification
        homeworkId={homework.id}
        studentName={homework.student_name}
        teacherName={teacherName}
        verifyEmail={verifyStudentEmail}
        onVerified={setVerifiedEmail}
      />
    );
  }

  // Get progress for progress bar
  const progress = getProgress();
  const finalIsSubmitted = isSubmitted || isCompleted;
  
  // Student sees correct answers only after teacher has reviewed
  const showCorrectAnswersToStudent = !!homework.reviewed_at;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Sidebar */}
      {exercises.length > 0 && (
        <ExerciseNavSidebar
          exercises={exercises}
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

      {/* Progress Bar */}
      <HomeworkProgressBar
        progress={progress}
        isSaving={isSaving}
        lastSavedAt={lastSavedAt}
        isSubmitted={finalIsSubmitted}
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

      {/* Lesson Media Section */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {hasMedia ? (
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
          {Array.isArray(homework.selected_exercises) && homework.selected_exercises.map((exercise, index) => {
            const teacherComment = teacherComments[index];
            
            return (
              <div 
                key={index} 
                ref={el => { if (exerciseRefs.current) exerciseRefs.current[index] = el; }}
                onBlur={handleExerciseBlur(index, exercise.type)}
              >
                <ExerciseSection
                  exercise={exercise}
                  index={index + 1}
                  isEditing={false}
                  viewMode="student"
                  editableWorksheet={{ exercises: homework.selected_exercises }}
                  setEditableWorksheet={() => {}}
                  hideExerciseMedia={media?.hasImageMedia || media?.hasAudioMedia}
                  isCollapsed={collapsedExercises.get(index) || false}
                  onToggleCollapse={() => toggleExercise(index)}
                  // Interactive props
                  isInteractive={!finalIsSubmitted}
                  studentAnswers={(answers[index] || {}) as any}
                  onAnswerChange={handleAnswerChange(index, exercise.type)}
                  showCorrectAnswers={showCorrectAnswersToStudent}
                />
                
                {/* Teacher comment (shown after review) */}
                {showCorrectAnswersToStudent && teacherComment && (
                  <Card className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                      <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-blue-700 dark:text-blue-300 text-sm mb-1">
                          Teacher's Comment:
                        </p>
                        <p className="text-blue-600 dark:text-blue-400 text-sm whitespace-pre-wrap">
                          {teacherComment}
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-12 space-y-4">
          {!finalIsSubmitted ? (
            <Button 
              onClick={handleMarkCompleted}
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
          ) : showCorrectAnswersToStudent ? (
            <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-lg text-center border-2 border-green-500">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p className="text-lg font-semibold text-green-700 dark:text-green-300">
                Homework Reviewed!
              </p>
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                Your teacher has reviewed your work. Check the correct answers above.
              </p>
            </div>
          ) : (
            <div className="p-6 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-center border-2 border-amber-500">
              <Clock className="h-12 w-12 text-amber-500 mx-auto mb-2" />
              <p className="text-lg font-semibold text-amber-700 dark:text-amber-300">
                Homework Submitted!
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                Waiting for your teacher to review your answers...
              </p>
            </div>
          )}
          
          <div className="p-6 bg-muted rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              {finalIsSubmitted 
                ? showCorrectAnswersToStudent 
                  ? "Your teacher has reviewed your homework. Discuss any questions in your next lesson."
                  : "Your answers have been submitted. Your teacher will review them soon."
                : "Your answers are automatically saved. Click 'Submit Homework' when you're done."}
            </p>
          </div>
        </div>
      </div>

      {/* Floating Pinned Media Button */}
      {hasMedia && (
        <div className="fixed bottom-4 right-4 z-40">
          {showPinnedMedia ? (
            <Card className="w-72 shadow-lg">
              <div className="flex items-center justify-between p-2 border-b">
                <span className="text-sm font-medium">Lesson Media</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0"
                  onClick={() => setShowPinnedMedia(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-2 max-h-64 overflow-y-auto space-y-2">
                {media.images.length > 0 && (
                  <img 
                    src={media.images[0]} 
                    alt="Lesson image"
                    className="rounded w-full object-contain max-h-32"
                  />
                )}
                {media.audios.length > 0 && (
                  <audio controls className="w-full h-10">
                    <source src={media.audios[0].url} type="audio/mpeg" />
                  </audio>
                )}
              </div>
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {media.images.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-10 h-10 p-0 shadow-lg bg-background/95 backdrop-blur-sm"
                  onClick={() => setShowPinnedMedia(true)}
                  title="Show Image"
                >
                  <Image className="h-4 w-4" />
                </Button>
              )}
              {media.audios.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-10 h-10 p-0 shadow-lg bg-background/95 backdrop-blur-sm"
                  onClick={() => setShowPinnedMedia(true)}
                  title="Show Audio"
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal for Incomplete Submission */}
      <AlertDialog open={showConfirmSubmitModal} onOpenChange={setShowConfirmSubmitModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Incomplete Homework?</AlertDialogTitle>
            <AlertDialogDescription>
              You haven't completed all exercises yet. Your progress is {progress.percentageComplete}% ({progress.answeredExercises}/{progress.totalExercises} exercises).
              <br /><br />
              Are you sure you want to submit now? You won't be able to make changes after submitting.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Working</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                setShowConfirmSubmitModal(false);
                performSubmit();
              }}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Submit Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
