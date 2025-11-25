import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
import { ArrowLeft, FileText, Calendar, User, BookOpen, Target, Edit, Plus, Trash2, Brain, GraduationCap, StickyNote, Mail, Settings } from 'lucide-react';
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

const StudentPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { students, updateStudent, deleteStudent } = useStudents();
  const [currentPage, setCurrentPage] = useState(1);
  const [deletedCurrentPage, setDeletedCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('overview');
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const pageSize = 10;
  
  const student = students.find(s => s.id === id);
  
  const { worksheets, loading, deleteWorksheet, refetch: refetchWorksheets, restoreWorksheet, totalCount } = 
    useWorksheetHistory(id || '', false, true, currentPage, pageSize);
  const { deletedWorksheets, loading: deletedLoading, restoreWorksheet: restoreDeleted, totalCount: deletedTotalCount } = 
    useDeletedWorksheets(id || '', false, true, deletedCurrentPage, pageSize);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Get recent notes for overview
  const studentKnowledge = useStudentKnowledge({
    studentId: id || '',
    teacherId: student?.teacher_id || '',
  });

  useEffect(() => {
    refetchWorksheets();
  }, [currentPage, deletedCurrentPage]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!student) {
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

  const handleWorksheetClick = async (worksheet: any) => {
    try {
      let worksheetData = worksheet;
      
      if (!worksheet.ai_response) {
        const { data, error } = await supabase
          .from('worksheets')
          .select('*')
          .eq('id', worksheet.id)
          .single();
        
        if (error) throw error;
        if (!data) throw new Error('Worksheet not found');
        
        worksheetData = data;
      }
      
      const parsedData = JSON.parse(worksheetData.ai_response);
      const fixedWorksheetData = deepFixTextObjects(parsedData, 'studentPage');
      
      const restoredWorksheet = {
        ...worksheetData,
        ai_response: JSON.stringify(fixedWorksheetData)
      };
      
      sessionStorage.setItem('restoredWorksheet', JSON.stringify(restoredWorksheet));
      sessionStorage.setItem('worksheetStudentName', student.name);
      
      navigate('/');
    } catch (error) {
      console.error('Error opening worksheet:', error);
    }
  };

  const handleGenerateWorksheet = () => {
    sessionStorage.setItem('preSelectedStudent', JSON.stringify({
      id: student.id,
      name: student.name
    }));
    sessionStorage.setItem('forceNewWorksheet', 'true');
    navigate('/');
  };

  const formatGoal = (goal: string) => {
    const goalMap: Record<string, string> = {
      'work': 'Work/Business',
      'exam': 'Exam Preparation',
      'general': 'General English',
      'travel': 'Travel',
      'academic': 'Academic'
    };
    return goalMap[goal] || goal;
  };

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
                <User className="h-8 w-8 mr-3" />
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
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
            <TabsTrigger value="knowledge" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Knowledge Base
            </TabsTrigger>
            <TabsTrigger value="flashcards" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Flashcards
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
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
                          <Settings className="h-5 w-5" />
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
                        <div
                          className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => handleWorksheetClick(worksheet)}
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
                        </div>
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
                              <div 
                                className="flex items-center space-x-3 cursor-pointer flex-1"
                                onClick={() => handleWorksheetClick(worksheet)}
                              >
                                <FileText className="h-5 w-5 text-primary" />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-medium">
                                      {worksheet.title || 'Untitled Worksheet'}
                                    </h3>
                                    <MediaBadges 
                                      hasImage={hasImage(worksheet)} 
                                      hasAudio={hasAudio(worksheet)}
                                      size="sm"
                                    />
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {worksheet.form_data?.lessonTopic && `Topic: ${worksheet.form_data.lessonTopic}`}
                                    {worksheet.form_data?.grammar && ` • Grammar: ${worksheet.form_data.grammar}`}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="text-right">
                                  <div className="text-sm font-medium">
                                    {format(new Date(worksheet.created_at), 'MMM dd, yyyy')}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {format(new Date(worksheet.created_at), 'HH:mm')}
                                  </div>
                                </div>
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
              studentName={student.name}
              studentNativeLanguage={student.native_language || 'Spanish'}
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
      </div>
    </div>
  );
};

export default StudentPage;
