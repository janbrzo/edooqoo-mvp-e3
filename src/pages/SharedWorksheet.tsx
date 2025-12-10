
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle, FileText, ArrowUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SharedWorksheetContent from '@/components/shared/SharedWorksheetContent';
import { SharedWorksheetEmailVerification } from '@/components/shared/SharedWorksheetEmailVerification';
import { StudyModeButton } from '@/components/shared/StudyModeButton';
import { SharedWorksheetProgressBar } from '@/components/shared/SharedWorksheetProgressBar';
import { useInteractiveSharedWorksheet } from '@/hooks/useInteractiveSharedWorksheet';
import { ExerciseNavSidebar } from '@/components/worksheet/ExerciseNavSidebar';
import { useWorksheetNavigation } from '@/hooks/useWorksheetNavigation';
import type { SharedWorksheetData } from '@/types/interactiveSharedWorksheet';

const SharedWorksheet = () => {
  const { token } = useParams<{ token: string }>();
  const [worksheet, setWorksheet] = useState<SharedWorksheetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { toast } = useToast();

  // Interactive shared worksheet state
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [isTeacher, setIsTeacher] = useState(false);
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [needsStudentAssignment, setNeedsStudentAssignment] = useState(false);

  // Parse exercises count from worksheet data
  const worksheetData = useMemo(() => {
    if (!worksheet?.ai_response) return null;
    try {
      return JSON.parse(worksheet.ai_response);
    } catch {
      return null;
    }
  }, [worksheet?.ai_response]);

  const totalExercises = worksheetData?.exercises?.length || 0;
  
  // Calculate exercise question counts for progress
  const exerciseQuestionCounts = useMemo(() => {
    if (!worksheetData?.exercises) return {};
    const counts: Record<number, number> = {};
    worksheetData.exercises.forEach((exercise: any, index: number) => {
      counts[index] = exercise.questions?.length || 
                      exercise.items?.length || 
                      exercise.sentences?.length ||
                      exercise.statements?.length ||
                      exercise.words?.length || 1;
    });
    return counts;
  }, [worksheetData]);

  // Initialize interactive hook (only when verified)
  const interactiveHook = useInteractiveSharedWorksheet({
    worksheetId: worksheet?.id || '',
    studentEmail: verifiedEmail || '',
    totalExercises,
    exerciseQuestionCounts
  });

  // PROBLEM 3: Navigation sidebar for shared worksheet
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const exercises = worksheetData?.exercises || [];
  const navigation = useWorksheetNavigation({ exercises });

  useEffect(() => {
    if (!token) {
      setError('Invalid share token');
      setIsLoading(false);
      return;
    }

    loadSharedWorksheet();
    checkIfTeacher();
  }, [token]);

  // Handle scroll-to-top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const checkIfTeacher = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && !user.is_anonymous) {
        // Check if user is the teacher who owns this worksheet
        const { data: worksheetData } = await supabase
          .from('worksheets')
          .select('teacher_id')
          .eq('share_token', token)
          .single();
        
        if (worksheetData && worksheetData.teacher_id === user.id) {
          console.log('[SharedWorksheet] User is the teacher - bypassing email verification');
          setIsTeacher(true);
          setVerifiedEmail(user.email || 'teacher');
        }
      }
    } catch (error) {
      console.error('[SharedWorksheet] Error checking teacher status:', error);
    }
  };

  const loadSharedWorksheet = async () => {
    try {
      setIsLoading(true);
      
      // Call the existing RPC function
      const { data, error: rpcError } = await supabase.rpc('get_worksheet_by_share_token' as any, {
        p_share_token: token
      });

      if (rpcError) throw rpcError;

      if (!data || data.length === 0) {
        throw new Error('Worksheet not found or link has expired');
      }

      const worksheetRow = data[0];
      
      // Check if worksheet has assigned student
      const { data: fullWorksheet } = await supabase
        .from('worksheets')
        .select('student_id, share_recipient_email')
        .eq('id', worksheetRow.id)
        .single();
      
      if (!fullWorksheet?.student_id) {
        setNeedsStudentAssignment(true);
      }

      setWorksheet({
        ...worksheetRow,
        student_id: fullWorksheet?.student_id,
        share_recipient_email: fullWorksheet?.share_recipient_email
      });
      
      toast({
        title: "Worksheet loaded",
        description: "You're viewing a shared worksheet",
        className: "bg-green-50 border-green-200"
      });
    } catch (error) {
      console.error('Error loading shared worksheet:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load worksheet';
      setError(errorMessage);
      
      toast({
        title: "Failed to load worksheet",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailVerified = (email: string) => {
    console.log('[SharedWorksheet] Email verified:', email);
    setVerifiedEmail(email);
    toast({
      title: "Email verified!",
      description: "You can now start studying.",
      className: "bg-green-50 border-green-200"
    });
  };

  const handleStartStudy = () => {
    console.log('[SharedWorksheet] Starting study mode');
    setIsStudyMode(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-worksheet-purple" />
          <p className="text-gray-600">Loading shared worksheet...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Worksheet Not Available
          </h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">
            The share link may have expired or the worksheet may have been removed.
          </p>
        </div>
      </div>
    );
  }

  if (!worksheet) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No worksheet data available</p>
        </div>
      </div>
    );
  }

  // Check if worksheet needs assigned student
  if (needsStudentAssignment && !isTeacher) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Student Not Assigned
          </h1>
          <p className="text-gray-600 mb-4">
            This worksheet doesn't have a student assigned yet.
          </p>
          <p className="text-sm text-gray-500">
            Please ask your teacher to assign a student to this worksheet before you can access it.
          </p>
        </div>
      </div>
    );
  }

  // Parse the AI response to get the worksheet title if needed
  const worksheetTitle = worksheet.title || worksheetData?.title || 'English Worksheet';

  // Student needs to verify email (unless they are the teacher)
  const showEmailVerification = !isTeacher && !verifiedEmail;
  
  // PROBLEM 3: Teacher sees same view but read-only (automatically in study mode)
  // After verification, show Study button (unless in study mode or teacher)
  const showStudyButton = verifiedEmail && !isStudyMode && !isTeacher;
  
  // Teacher is always in "view" mode (like study mode but read-only)
  const effectiveStudyMode = isStudyMode || isTeacher;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Email Verification Modal */}
      {showEmailVerification && (
        <SharedWorksheetEmailVerification
          onVerified={handleEmailVerified}
          verifyEmail={interactiveHook.verifyStudentEmail}
          worksheetId={worksheet.id}
          worksheetTitle={worksheetTitle}
          teacherEmail={worksheet.teacher_email}
        />
      )}

      {/* Big Study Button (after email verified) */}
      {showStudyButton && (
        <StudyModeButton
          onStartStudy={handleStartStudy}
          worksheetTitle={worksheetTitle}
        />
      )}

      {/* Progress Bar (only in study mode for students, not for teachers) */}
      {isStudyMode && !isTeacher && (
        <SharedWorksheetProgressBar
          progress={interactiveHook.getProgress()}
          isSaving={interactiveHook.isSaving}
          lastSavedAt={interactiveHook.lastSavedAt}
        />
      )}
      
      {/* Teacher read-only notice */}
      {isTeacher && (
        <div className="bg-amber-50 border-b border-amber-200 py-2 px-4 text-center">
          <p className="text-sm text-amber-700">
            👀 Teacher View - You're viewing this worksheet as your students will see it (read-only)
          </p>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-worksheet-purple" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {worksheetTitle}
              </h1>
              <p className="text-sm text-gray-500">
                Shared by: {worksheet.teacher_email} • 
                Created: {new Date(worksheet.created_at).toLocaleDateString()}
                {isStudyMode && verifiedEmail && (
                  <span className="ml-2 text-worksheet-purple font-medium">
                    • Studying as: {verifiedEmail}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - styled to match HTML export */}
      <div className="max-w-6xl mx-auto px-2 py-8 relative">
        {/* PROBLEM 3: Exercise Navigation Sidebar */}
        {exercises.length > 0 && (
          <ExerciseNavSidebar
            exercises={exercises.map((exercise: any) => ({
              title: exercise.title,
              icon: exercise.icon,
              estimated_time: exercise.time
            }))}
            activeExercise={navigation.activeExercise}
            collapsedExercises={navigation.collapsedExercises}
            onScrollToExercise={navigation.scrollToExercise}
            onToggleExercise={navigation.toggleExercise}
            onCollapseAll={navigation.collapseAll}
            onExpandAll={navigation.expandAll}
            isAllCollapsed={navigation.isAllCollapsed}
            isAllExpanded={navigation.isAllExpanded}
            isOpen={sidebarOpen}
            setIsOpen={setSidebarOpen}
            hasGrammar={!!worksheetData?.grammar_rules}
            hasVocabulary={!!worksheetData?.vocabulary_sheet}
          />
        )}

        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {/* Content wrapper with proper styling */}
          <div className="worksheet-content p-6">
            {/* PROBLEM 4 FIX: Teacher sees inputs but they are read-only */}
            <SharedWorksheetContent 
              worksheet={worksheet}
              isInteractive={effectiveStudyMode}
              isReadOnly={isTeacher}
              studentAnswers={interactiveHook.answers}
              onAnswerChange={isTeacher ? undefined : interactiveHook.updateAnswer}
              onBlur={isTeacher ? undefined : interactiveHook.saveOnBlur}
            />
          </div>
        </div>
      </div>

      {/* Scroll to top button */}
      {showScrollTop && (
        <button 
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 rounded-full bg-worksheet-purple text-white p-3 shadow-lg cursor-pointer opacity-80 hover:opacity-100 transition-opacity z-50"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}

      {/* Footer */}
      <div className="bg-white border-t py-6 mt-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-500">
            {isStudyMode ? (
              "Your answers are automatically saved as you type."
            ) : (
              <>
                This is a read-only view of a shared worksheet. 
                <a 
                  href="/" 
                  className="text-worksheet-purple hover:underline ml-1 font-medium"
                >
                  Create your own worksheets at edooqoo.com
                </a>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SharedWorksheet;
