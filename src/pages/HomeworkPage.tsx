import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ExerciseSection from "@/components/worksheet/ExerciseSection";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Calendar, User, Mail, CheckCircle2, FileText } from "lucide-react";
import { format } from "date-fns";
import { deepFixTextObjects } from "@/utils/textObjectFixer";

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
    } catch (error) {
      console.error('Error loading homework:', error);
      toast.error("Failed to load homework");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkCompleted = async () => {
    if (!homework) return;

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

  return (
    <div className="min-h-screen bg-background">
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
                    Deadline: <strong>{format(new Date(homework.deadline), "PPP")}</strong>
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
            <ExerciseSection
              key={index}
              exercise={exercise}
              index={index + 1}
              isEditing={false}
              viewMode="student"
              editableWorksheet={{ exercises: homework.selected_exercises }}
              setEditableWorksheet={() => {}}
              hideExerciseMedia={media?.hasImageMedia || media?.hasAudioMedia}
            />
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-12 space-y-4">
          {!isCompleted ? (
            <Button 
              onClick={handleMarkCompleted}
              disabled={isCompleting}
              className="w-full"
              size="lg"
            >
              {isCompleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Marking as completed...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Mark as Completed
                </>
              )}
            </Button>
          ) : (
            <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-lg text-center border-2 border-green-500">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p className="text-lg font-semibold text-green-700 dark:text-green-300">
                Homework Completed!
              </p>
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                Your teacher has been notified.
              </p>
            </div>
          )}
          
          <div className="p-6 bg-muted rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              Complete these exercises and discuss with your teacher in the next lesson.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
