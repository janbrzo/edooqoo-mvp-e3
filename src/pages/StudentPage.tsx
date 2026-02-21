import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStudents } from '@/hooks/useStudents';
import { useWorksheetHistory } from '@/hooks/useWorksheetHistory';
import { useDeletedWorksheets } from '@/hooks/useDeletedWorksheets';
import { StudentEditDialog } from '@/components/StudentEditDialog';
import { DeleteWorksheetButton } from "@/components/DeleteWorksheetButton";
import { DuplicateWorksheetButton } from "@/components/DuplicateWorksheetButton";
import { StudentSelector } from '@/components/StudentSelector';
import { StudentKnowledgeSection } from '@/components/student-knowledge/StudentKnowledgeSection';
import { useStudentKnowledge } from '@/hooks/useStudentKnowledge';
import { StudentKnowledgeEntryCard } from '@/components/student-knowledge/StudentKnowledgeEntryCard';
import { useAllWorksheetHomework } from '@/hooks/useAllWorksheetHomework';
import { WorksheetHomeworkSection } from '@/components/worksheet/WorksheetHomeworkSection';
import { StudentHomeworkTab } from '@/components/student-homework/StudentHomeworkTab';
import { FlashcardSetsSection } from '@/components/flashcards/FlashcardSetsSection';
import { StudentProgressTab } from '@/components/student-progress/StudentProgressTab';
import { StudentTestsTab } from '@/components/student-tests/StudentTestsTab';
import { EventLogPanel } from '@/components/dslm/EventLogPanel';
import { SkillsOverviewPanel } from '@/components/dslm/SkillsOverviewPanel';
import { WelcomeTestSuggestion } from '@/components/dashboard/WelcomeTestSuggestion';
import { ArrowLeft, FileText, Calendar, User, BookOpen, Target, Edit, Plus, Trash2, Brain, GraduationCap, StickyNote, Mail, Globe, Share2, TrendingUp, ClipboardCheck, Activity, Pencil, BarChart3 } from 'lucide-react';
import { formatGoalLabel } from '@/constants/studentGoals';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { deepFixTextObjects } from '@/utils/textObjectFixer';
import { MediaBadges } from '@/components/worksheet/MediaBadges';
import { hasImage, hasAudio } from '@/utils/worksheetUtils';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import ShareWorksheetModal from '@/components/ShareWorksheetModal';
import RenameDialog from '@/components/RenameDialog';
import { StudentSwitcherPopover } from '@/components/StudentSwitcherPopover';
import { toast } from 'sonner';

const StudentPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { students, updateStudent, deleteStudent, loading: studentsLoading } = useStudents();
  const [currentPage, setCurrentPage] = useState(1);
  const [deletedCurrentPage, setDeletedCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  // Sync activeTab when URL searchParams change (Issue 8: programmatic navigation)
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams]);
  const pageSize = 10;

  // Get flashcard set ID from URL
  const flashcardSetId = searchParams.get('set');

  // Sync tab with URL
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Remove set param when changing tabs
    setSearchParams({ tab });
  };

  // Handle flashcard set change
  const handleFlashcardSetChange = (setId: string | null) => {
    if (setId) {
      setSearchParams({ tab: 'flashcards', set: setId });
    } else {
      setSearchParams({ tab: 'flashcards' });
    }
  };
  
  const student = students.find(s => s.id === id);
  
  const { worksheets, loading, deleteWorksheet, refetch: refetchWorksheets, restoreWorksheet, totalCount } = 
    useWorksheetHistory(id || '', false, true, currentPage, pageSize);
  const { deletedWorksheets, loading: deletedLoading, restoreWorksheet: restoreDeleted, totalCount: deletedTotalCount } = 
    useDeletedWorksheets(id || '', false, true, deletedCurrentPage, pageSize);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareWorksheetData, setShareWorksheetData] = useState<{id: string; title: string; shareToken?: string; shareExpiresAt?: string} | null>(null);
  
  // Rename worksheet state
  const [renameWorksheetData, setRenameWorksheetData] = useState<{id: string; title: string} | null>(null);

  // Get recent notes for overview
  const studentKnowledge = useStudentKnowledge({
    studentId: id || '',
    teacherId: student?.teacher_id || '',
  });

  useEffect(() => {
    refetchWorksheets();
  }, [currentPage, deletedCurrentPage]);

  // Auth check for "student not found" - redirect to login if not authenticated
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAuthenticated(!!user);
      setAuthChecked(true);
    });
  }, []);

  if (loading || studentsLoading || !authChecked) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!student) {
    // If not authenticated, redirect to login with return URL
    if (!isAuthenticated) {
      const returnUrl = `/student/${id}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      navigate(`/login?redirect=${encodeURIComponent(returnUrl)}`);
      return <div className="min-h-screen flex items-center justify-center">Redirecting to login...</div>;
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8">
            <h1 className="text-2xl font-bold mb-4">Student not found</h1>
            <Button asChild>
              <Link to="/dashboard">Back to Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleWorksheetClick = (worksheet: any) => {
    navigate(`/worksheet/${worksheet.id}`);
  };

  const handleGenerateWorksheet = () => {
    sessionStorage.setItem('preSelectedStudent', JSON.stringify({
      id: student.id,
      name: student.name
    }));
    sessionStorage.setItem('forceNewWorksheet', 'true');
    navigate('/');
  };

  // Use centralized goal formatting from constants
  const formatGoal = formatGoalLabel;

  const handleDeleteStudent = async () => {
    try {
      const result = await deleteStudent(student.id);
      if (result) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error deleting student:', error);
    }
  };
  
  // Rename worksheet handler
  const handleRenameWorksheet = async (worksheetId: string, newTitle: string) => {
    try {
      const { error } = await supabase
        .from('worksheets')
        .update({ title: newTitle })
        .eq('id', worksheetId);
      
      if (error) throw error;
      
      toast.success('Worksheet renamed successfully');
      refetchWorksheets();
    } catch (error) {
      console.error('Error renaming worksheet:', error);
      toast.error('Failed to rename worksheet');
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <StudentSwitcherPopover 
                  students={students} 
                  currentStudentId={student.id} 
                  onSelect={(sid) => navigate(`/student/${sid}`)} 
                />
                {student.name}
              </h1>
              <p className="text-muted-foreground">Student Profile & Worksheets</p>
            </div>
          </div>
          <Button onClick={handleGenerateWorksheet}>
            Generate New Worksheet
          </Button>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-9 mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="worksheets" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Worksheets
            </TabsTrigger>
            <TabsTrigger value="homework" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Homework
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Progress
            </TabsTrigger>
            <TabsTrigger value="tests" className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />
              Tests
            </TabsTrigger>
            <TabsTrigger value="skills" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Skills
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Knowledge
            </TabsTrigger>
            <TabsTrigger value="flashcards" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Flashcards
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Events
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            {/* Welcome Test Suggestion Banner */}
            <WelcomeTestSuggestion
              studentId={student.id}
              teacherId={student.teacher_id}
              studentName={student.name}
              studentEmail={student.student_email}
            />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Student Details */}
              <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Student Details
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditDialogOpen(true)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-5 w-5 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <Trash2 className="h-5 w-5 text-destructive" />
                            Delete Student: {student.name}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. To confirm deletion, please type the student's full name below:
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        
                        <div className="py-4">
                          <Input
                            placeholder={`Type "${student.name}" to confirm`}
                            value={deleteConfirmName}
                            onChange={(e) => setDeleteConfirmName(e.target.value)}
                          />
                        </div>
                        
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setDeleteConfirmName('')}>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteStudent}
                            disabled={deleteConfirmName !== student.name}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                          >
                            Delete Student
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">English Level</label>
                  <Badge variant="secondary" className="ml-2">{student.english_level}</Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Main Goal</label>
                  <div className="flex items-center mt-1">
                    <Target className="h-4 w-4 mr-2 text-primary" />
                    <span>{formatGoal(student.main_goal)}</span>
                  </div>
                </div>
                {student.student_email && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <div className="flex items-center mt-1">
                      <Mail className="h-4 w-4 mr-2 text-primary" />
                      <span className="text-sm">{student.student_email}</span>
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Native Language</label>
                  <div className="flex items-center mt-1">
                    <Globe className="h-4 w-4 mr-2 text-primary" />
                    <span>{student.native_language || 'Not set'}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Overdue Homework Emails</label>
                  <div className="flex items-center mt-1">
                    <Mail className="h-4 w-4 mr-2 text-primary" />
                    <Badge variant={student.send_overdue_emails !== false ? 'default' : 'secondary'}>
                      {student.send_overdue_emails !== false ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total Worksheets</label>
                  <div className="flex items-center mt-1">
                    <BookOpen className="h-4 w-4 mr-2 text-primary" />
                    <span className="font-semibold">{totalCount || 0}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Student Since</label>
                  <div className="flex items-center mt-1">
                    <Calendar className="h-4 w-4 mr-2 text-primary" />
                    <span>{format(new Date(student.created_at), 'MMM dd, yyyy')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

              {/* Recent Worksheets */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center mb-2">
                    <FileText className="h-5 w-5 mr-2" />
                    Recent Worksheets
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button 
                      size="sm"
                      onClick={handleGenerateWorksheet}
                      className="flex-1"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Generate Another
                    </Button>
                    {worksheets.length > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setActiveTab('worksheets')}
                      >
                        View All
                      </Button>
                    )}
                  </div>
                </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : worksheets.length > 0 ? (
                  <div className="space-y-3">
                    {worksheets.slice(0, 5).map((worksheet) => (
                      <div key={worksheet.id}>
                        <Link
                          to={`/worksheet/${worksheet.id}`}
                          className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center space-x-3 flex-1">
                            <FileText className="h-4 w-4 text-primary" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-sm">
                                  {worksheet.title || 'Untitled Worksheet'}
                                </h3>
                                <MediaBadges 
                                  hasImage={hasImage(worksheet)} 
                                  hasAudio={hasAudio(worksheet)}
                                  size="sm"
                                />
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(worksheet.created_at), 'MMM dd, yyyy')}
                              </p>
                            </div>
                          </div>
                        </Link>
                        <WorksheetHomeworkSection 
                          worksheetId={worksheet.id}
                          compact={true}
                          displayMode="simplified"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">No worksheets generated yet</p>
                    <Button onClick={handleGenerateWorksheet} className="mt-4" size="sm">
                      Generate First Worksheet
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

              {/* Recent Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center mb-2">
                    <StickyNote className="h-5 w-5 mr-2" />
                    Recent Notes
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button 
                      size="sm"
                      onClick={() => setActiveTab('knowledge')}
                      className="flex-1"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Note
                    </Button>
                    {studentKnowledge.entries.length > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setActiveTab('knowledge')}
                      >
                        View All
                      </Button>
                    )}
                  </div>
                </CardHeader>
              <CardContent>
                {studentKnowledge.isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : studentKnowledge.entries.length > 0 ? (
                  <div className="space-y-3">
                    {studentKnowledge.entries.slice(0, 3).map((entry) => (
                      <StudentKnowledgeEntryCard
                        key={entry.id}
                        entry={entry}
                        onView={(entryToView) => {
                          // Switch to Knowledge Base tab for viewing
                          setActiveTab('knowledge');
                        }}
                        onEdit={(entryToEdit) => {
                          // Switch to Knowledge Base tab for editing
                          setActiveTab('knowledge');
                        }}
                        onDelete={studentKnowledge.deleteEntry}
                        onMarkOutdated={studentKnowledge.markAsOutdated}
                        onMarkCurrent={studentKnowledge.markAsCurrent}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <StickyNote className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">No notes added yet</p>
                    <Button 
                      onClick={() => setActiveTab('knowledge')} 
                      className="mt-4" 
                      size="sm"
                    >
                      Add First Note
                    </Button>
                  </div>
                )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Worksheets Tab */}
          <TabsContent value="worksheets">
            <div className="space-y-6">
              {/* Active Worksheets */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      All Worksheets ({totalCount || 0})
                    </CardTitle>
                    {worksheets.length > 0 && (
                      <Button onClick={handleGenerateWorksheet} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Generate another
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-4 text-muted-foreground">Loading worksheets...</p>
                    </div>
                  ) : worksheets.length > 0 ? (
                    <>
                      <div className="space-y-3">
                        {worksheets.map((worksheet) => (
                          <div key={worksheet.id}>
                            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                              <Link 
                                to={`/worksheet/${worksheet.id}`}
                                className="flex items-center space-x-3 flex-1"
                              >
                                <FileText className="h-5 w-5 text-primary" />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-medium">
                                      {worksheet.title || 'Untitled Worksheet'}
                                    </h3>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setRenameWorksheetData({
                                          id: worksheet.id,
                                          title: worksheet.title || 'Untitled Worksheet'
                                        });
                                      }}
                                      title="Rename worksheet"
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    <MediaBadges 
                                      hasImage={hasImage(worksheet)} 
                                      hasAudio={hasAudio(worksheet)}
                                      size="sm"
                                    />
                                  </div>
                                  {worksheet.form_data?.grammar && (
                                    <p className="text-sm text-muted-foreground">
                                      Grammar: {worksheet.form_data.grammar}
                                    </p>
                                  )}
                                </div>
                              </Link>
                              <div className="flex items-center space-x-2">
                                {/* PROBLEM 8: Date and time on same line */}
                                <div className="text-sm font-medium whitespace-nowrap">
                                  {format(new Date(worksheet.created_at), 'MMM dd, yyyy HH:mm')}
                                </div>
                                {/* PROBLEM 7: Share button with green border if active */}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={`${
                                    worksheet.share_token && worksheet.share_expires_at && new Date(worksheet.share_expires_at) > new Date()
                                      ? 'border-2 border-green-500 rounded-md'
                                      : ''
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShareWorksheetData({
                                      id: worksheet.id,
                                      title: worksheet.title || 'Untitled Worksheet',
                                      shareToken: worksheet.share_token || undefined,
                                      shareExpiresAt: worksheet.share_expires_at || undefined
                                    });
                                    setShareModalOpen(true);
                                  }}
                                >
                                  <Share2 className="h-4 w-4" />
                                </Button>
                                <DuplicateWorksheetButton
                                  worksheetId={worksheet.id}
                                  worksheetTitle={worksheet.title || 'Untitled Worksheet'}
                                  onDuplicate={refetchWorksheets}
                                />
                                <StudentSelector
                                  worksheetId={worksheet.id}
                                  currentStudentId={worksheet.student_id}
                                  worksheetTitle={worksheet.title || 'Untitled Worksheet'}
                                  onTransferSuccess={refetchWorksheets}
                                />
                                <DeleteWorksheetButton
                                  worksheetId={worksheet.id}
                                  worksheetTitle={worksheet.title || 'Untitled Worksheet'}
                                  onDelete={deleteWorksheet}
                                />
                              </div>
                            </div>
                            <WorksheetHomeworkSection 
                              worksheetId={worksheet.id}
                            />
                          </div>
                        ))}
                      </div>
                      
                      {totalCount > pageSize && (
                        <div className="flex items-center justify-between pt-4 mt-4 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                          >
                            Previous
                          </Button>
                          <span className="text-sm text-muted-foreground">
                            Page {currentPage} of {Math.ceil(totalCount / pageSize)}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => p + 1)}
                            disabled={currentPage >= Math.ceil(totalCount / pageSize)}
                          >
                            Next
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-muted-foreground">No worksheets generated yet</p>
                      <Button onClick={handleGenerateWorksheet} className="mt-4">
                        Generate First Worksheet
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Deleted Worksheets */}
              {deletedWorksheets.length > 0 && (
                <Card className="border-red-200 bg-red-50/50">
                  <CardHeader>
                    <CardTitle className="flex items-center text-red-700">
                      <Trash2 className="h-5 w-5 mr-2" />
                      Deleted Worksheets ({deletedTotalCount || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {deletedLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-3">
                          {deletedWorksheets.map((worksheet) => (
                            <div
                              key={worksheet.id}
                              className="flex items-center justify-between p-4 bg-white rounded-lg border border-red-200"
                            >
                              <div className="flex items-center space-x-3 flex-1">
                                <FileText className="h-5 w-5 text-red-400" />
                                <div>
                                  <h3 className="font-medium text-gray-700">
                                    {worksheet.title || 'Untitled Worksheet'}
                                  </h3>
                                  <p className="text-sm text-red-600">
                                    Deleted: {format(new Date(worksheet.deleted_at), 'MMM dd, yyyy HH:mm')}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  const result = await restoreDeleted(worksheet.id);
                                  if (result.success) {
                                    refetchWorksheets();
                                  }
                                }}
                                className="border-green-500 text-green-700 hover:bg-green-50"
                              >
                                Restore
                              </Button>
                            </div>
                          ))}
                        </div>
                        
                        {deletedTotalCount > pageSize && (
                          <div className="flex items-center justify-between pt-4 mt-4 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeletedCurrentPage(p => Math.max(1, p - 1))}
                              disabled={deletedCurrentPage === 1}
                            >
                              Previous
                            </Button>
                            <span className="text-sm text-muted-foreground">
                              Page {deletedCurrentPage} of {Math.ceil(deletedTotalCount / pageSize)}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeletedCurrentPage(p => p + 1)}
                              disabled={deletedCurrentPage >= Math.ceil(deletedTotalCount / pageSize)}
                            >
                              Next
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Homework Tab */}
          <TabsContent value="homework">
            <Card>
              <CardContent className="pt-6">
                <StudentHomeworkTab
                  studentId={id!}
                  teacherId={student.teacher_id}
                  studentName={student.name}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress">
            <StudentProgressTab
              studentId={id || ''}
              teacherId={student.teacher_id}
              studentName={student.name}
              englishLevel={student.english_level}
              mainGoal={student.main_goal}
              studentNotes={studentKnowledge.entries.slice(0, 10).map(e => e.content)}
              onMainGoalChange={async (newGoal) => {
                await updateStudent(student.id, { main_goal: newGoal });
              }}
              onUseWorksheetSuggestion={(topic, goal, additionalInfo, grammarFocus) => {
                sessionStorage.setItem('preSelectedStudent', JSON.stringify({
                  id: student.id,
                  name: student.name
                }));
                sessionStorage.setItem('prefillWorksheet', JSON.stringify({
                  topic,
                  goal,
                  additionalInfo: additionalInfo || '',
                  grammarFocus: grammarFocus || ''
                }));
                sessionStorage.setItem('forceNewWorksheet', 'true');
                navigate('/');
              }}
            />
          </TabsContent>

          {/* Tests Tab */}
          <TabsContent value="tests">
            <StudentTestsTab
              studentId={id || ''}
              teacherId={student.teacher_id}
              studentName={student.name}
            />
          </TabsContent>

          {/* Skills Overview Tab - DSLM Layer B */}
          <TabsContent value="skills">
            <SkillsOverviewPanel
              studentId={id || ''}
              teacherId={student.teacher_id}
            />
          </TabsContent>

          {/* Knowledge Base Tab */}
          <TabsContent value="knowledge">
            <StudentKnowledgeSection
              studentId={id || ''}
              teacherId={student.teacher_id}
              studentName={student.name}
            />
          </TabsContent>

          {/* Flashcards Tab */}
          <TabsContent value="flashcards">
            <FlashcardSetsSection
              studentId={id || ''}
              teacherId={student.teacher_id}
              studentName={student.name || 'Student'}
              studentNativeLanguage={student.native_language || 'Spanish'}
              initialEditingSetId={activeTab === 'flashcards' ? flashcardSetId : null}
              onSetChange={handleFlashcardSetChange}
            />
          </TabsContent>

          {/* Events Tab - DSLM Debug Panel */}
          <TabsContent value="events">
            <EventLogPanel
              studentId={id || ''}
              teacherId={student.teacher_id}
            />
          </TabsContent>
        </Tabs>

        {/* Student Edit Dialog */}
        <StudentEditDialog
          student={student}
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onSave={updateStudent}
        />
        
        {/* PROBLEM 5: Share Worksheet Modal with pre-filled student email */}
        {shareWorksheetData && (
          <ShareWorksheetModal
            worksheetId={shareWorksheetData.id}
            worksheetTitle={shareWorksheetData.title}
            studentEmail={student?.student_email || ''}
            isOpen={shareModalOpen}
            onClose={() => {
              setShareModalOpen(false);
              setShareWorksheetData(null);
              refetchWorksheets();
            }}
          />
        )}
        
        {/* Rename Worksheet Dialog */}
        {renameWorksheetData && (
          <RenameDialog
            isOpen={!!renameWorksheetData}
            onClose={() => setRenameWorksheetData(null)}
            currentTitle={renameWorksheetData.title}
            onRename={(newTitle) => handleRenameWorksheet(renameWorksheetData.id, newTitle)}
            type="worksheet"
          />
        )}
      </div>
    </div>
  );
};

export default StudentPage;
