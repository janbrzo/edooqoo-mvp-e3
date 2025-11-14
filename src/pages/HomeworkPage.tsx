import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ExerciseSection from "@/components/worksheet/ExerciseSection";
import { Loader2, Calendar, User, Mail } from "lucide-react";
import { format } from "date-fns";

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
}

export default function HomeworkPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [homework, setHomework] = useState<HomeworkData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      toast.error("Invalid homework link");
      navigate("/");
      return;
    }

    loadHomework();
  }, [token]);

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

      setHomework(data);
    } catch (error) {
      console.error('Error loading homework:', error);
      toast.error("Failed to load homework");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

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
            </div>
          </div>
        </div>
      </div>

      {/* Exercises */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {Array.isArray(homework.selected_exercises) && homework.selected_exercises.map((exercise, index) => (
            <ExerciseSection
              key={index}
              exercise={exercise}
              index={index}
              isEditing={false}
              viewMode="student"
              editableWorksheet={{ exercises: homework.selected_exercises }}
              setEditableWorksheet={() => {}}
            />
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-12 p-6 bg-muted rounded-lg text-center">
          <p className="text-sm text-muted-foreground">
            Complete these exercises and discuss with your teacher in the next lesson.
          </p>
        </div>
      </div>
    </div>
  );
}
