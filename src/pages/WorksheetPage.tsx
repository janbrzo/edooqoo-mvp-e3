import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import WorksheetDisplay from '@/components/WorksheetDisplay';
import { deepFixTextObjects } from '@/utils/textObjectFixer';
import { Loader2, GraduationCap, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTokenSystem } from '@/hooks/useTokenSystem';
import { useAuthFlow } from '@/hooks/useAuthFlow';
import { HomeworkNotificationBadge } from '@/components/homework/HomeworkNotificationBadge';

export default function WorksheetPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  // ✅ FIX: Pass user.id to useTokenSystem to get correct token count
  const { user } = useAuthFlow();
  const { tokenLeft } = useTokenSystem(user?.id);
  const [loading, setLoading] = useState(true);
  const [worksheetData, setWorksheetData] = useState<any>(null);
  const [parsedWorksheet, setParsedWorksheet] = useState<any>(null);
  const [studentName, setStudentName] = useState<string>('');
  const [editableWorksheet, setEditableWorksheet] = useState<any>(null);
  const [originalWorksheet, setOriginalWorksheet] = useState<any>(null);

  useEffect(() => {
    const fetchWorksheet = async () => {
      if (!id) {
        toast({
          variant: "destructive",
          title: "Invalid Worksheet",
          description: "No worksheet ID provided.",
        });
        navigate('/');
        return;
      }

      try {
        setLoading(true);

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        // Fetch worksheet
        const { data: worksheet, error } = await supabase
          .from('worksheets')
          .select('*')
          .eq('id', id)
          .is('deleted_at', null)
          .maybeSingle();

        if (error) {
          console.error('Error fetching worksheet:', error);
          throw error;
        }

        if (!worksheet) {
          toast({
            variant: "destructive",
            title: "Worksheet Not Found",
            description: "This worksheet does not exist or has been deleted.",
          });
          navigate('/');
          return;
        }

        // Check if user has access (must be the teacher who created it)
        if (user && worksheet.teacher_id !== user.id) {
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "You don't have permission to view this worksheet.",
          });
          navigate('/');
          return;
        }

        // If no user, they should be redirected to login
        if (!user) {
          toast({
            variant: "destructive",
            title: "Authentication Required",
            description: "Please log in to view this worksheet.",
          });
          navigate('/login');
          return;
        }

        // Parse ai_response
        let parsed = null;
        if (worksheet.ai_response) {
          try {
            parsed = JSON.parse(worksheet.ai_response);
            parsed = deepFixTextObjects(parsed, 'worksheetPage');
            console.log('✅ Successfully parsed and fixed worksheet data');
          } catch (parseError) {
            console.error('❌ Error parsing ai_response:', parseError);
            toast({
              variant: "destructive",
              title: "Error Loading Worksheet",
              description: "Failed to parse worksheet data.",
            });
            navigate('/');
            return;
          }
        }

        setWorksheetData(worksheet);
        setParsedWorksheet(parsed);
        setEditableWorksheet(parsed);
        setOriginalWorksheet(parsed);

        // Fetch student name if student_id exists
        if (worksheet.student_id) {
          const { data: student, error: studentError } = await supabase
            .from('students')
            .select('name')
            .eq('id', worksheet.student_id)
            .maybeSingle();

          if (!studentError && student) {
            setStudentName(student.name);
          }
        }

      } catch (error: any) {
        console.error('Error in fetchWorksheet:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to load worksheet.",
        });
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchWorksheet();
  }, [id, navigate, toast]);

  const handleDiscardChanges = () => {
    if (originalWorksheet) {
      setEditableWorksheet(JSON.parse(JSON.stringify(originalWorksheet)));
      toast({
        title: "Changes Discarded",
        description: "Your edits have been reverted to the original worksheet.",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading worksheet...</p>
        </div>
      </div>
    );
  }

  if (!parsedWorksheet || !worksheetData) {
    return null;
  }

  return (
    <>
      {/* Top navigation bar */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
        <Badge variant="outline" className="text-sm px-3 py-1">
          Tokens Left: {tokenLeft}
        </Badge>
        <HomeworkNotificationBadge />
        <Button asChild variant="outline" size="sm">
          <Link to="/dashboard">
            <GraduationCap className="h-4 w-4 mr-2" />
            Dashboard
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to="/profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </Link>
        </Button>
      </div>

      <WorksheetDisplay
        worksheet={parsedWorksheet}
        inputParams={worksheetData.form_data}
        generationTime={worksheetData.generation_time_seconds || 0}
        sourceCount={0}
        onBack={() => navigate(-1)}
        worksheetId={worksheetData.id}
        editableWorksheet={editableWorksheet}
        setEditableWorksheet={setEditableWorksheet}
        onDiscardChanges={handleDiscardChanges}
        userId={worksheetData.teacher_id}
        studentName={studentName}
        studentId={worksheetData.student_id}
        selectedImage={worksheetData.selected_image}
        selectedAudio={worksheetData.selected_audio}
        audioUrl={worksheetData.audio_url}
      />
    </>
  );
}
