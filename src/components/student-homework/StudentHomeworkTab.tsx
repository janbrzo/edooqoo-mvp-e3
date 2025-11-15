import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Calendar, Eye, Copy, ExternalLink, Trash2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useWorksheetHistory } from '@/hooks/useWorksheetHistory';
import { useAllWorksheetHomework, HomeworkAssignment } from '@/hooks/useAllWorksheetHomework';
import { CreateHomeworkModal } from '@/components/homework/CreateHomeworkModal';
import { useStudents } from '@/hooks/useStudents';
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

interface StudentHomeworkTabProps {
  studentId: string;
  teacherId: string;
  studentName: string;
}

export const StudentHomeworkTab = ({ studentId, teacherId, studentName }: StudentHomeworkTabProps) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'viewed' | 'not_viewed' | 'overdue'>('all');
  const [sortBy, setSortBy] = useState<'deadline' | 'created'>('deadline');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedWorksheetForHomework, setSelectedWorksheetForHomework] = useState<string>('');
  const [deletingHomeworkId, setDeletingHomeworkId] = useState<string | null>(null);
  
  const { students } = useStudents();
  const { worksheets } = useWorksheetHistory(studentId);
  const worksheetIds = worksheets.map(w => w.id);
  
  // Fetch homework for this student's worksheets, filtered by studentId
  const { homeworkByWorksheet, loading, refetch } = useAllWorksheetHomework(worksheetIds, studentId);
  
  // Flatten to single list
  const allHomework = useMemo(() => {
    return Object.values(homeworkByWorksheet).flat();
  }, [homeworkByWorksheet]);
  
  // Apply filters and sorting
  const filteredHomework = useMemo(() => {
    let filtered = [...allHomework];
    
    // Filter by status
    if (filterStatus === 'viewed') {
      filtered = filtered.filter(hw => hw.viewed_at !== null);
    } else if (filterStatus === 'not_viewed') {
      filtered = filtered.filter(hw => hw.viewed_at === null);
    } else if (filterStatus === 'overdue') {
      filtered = filtered.filter(hw => hw.deadline && isOverdue(hw.deadline));
    }
    
    // Sort
    if (sortBy === 'deadline') {
      filtered.sort((a, b) => {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      });
    } else {
      filtered.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    
    return filtered;
  }, [allHomework, filterStatus, sortBy]);
  
  const isOverdue = (deadline: string) => {
    return new Date(deadline) < new Date();
  };
  
  const handleCopyLink = async (shareToken: string | null, title: string) => {
    if (!shareToken) {
      toast.error("Share link not available");
      return;
    }
    
    const url = `${window.location.origin}/homework/${shareToken}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Homework link copied!");
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };
  
  const handleOpenHomework = (shareToken: string | null) => {
    if (!shareToken) {
      toast.error("Share link not available");
      return;
    }
    
    const url = `${window.location.origin}/homework/${shareToken}`;
    window.open(url, '_blank');
  };
  
  const handleDeleteHomework = async (homeworkId: string) => {
    try {
      const { error } = await supabase
        .from('homework_assignments')
        .delete()
        .eq('id', homeworkId)
        .eq('teacher_id', teacherId);
      
      if (error) throw error;
      
      toast.success("Homework deleted successfully");
      refetch();
      setDeletingHomeworkId(null);
    } catch (error) {
      console.error('Error deleting homework:', error);
      toast.error("Failed to delete homework");
    }
  };
  
  const handleCreateNew = () => {
    if (worksheets.length === 0) {
      toast.error("No worksheets available. Create a worksheet first.");
      return;
    }
    // Set first worksheet as default
    setSelectedWorksheetForHomework(worksheets[0].id);
    setIsCreateModalOpen(true);
  };
  
  // Get the first worksheet for the modal
  const firstWorksheet = worksheets[0];
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          Homework Assignments ({allHomework.length})
        </h2>
        <Button onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Homework
        </Button>
      </div>
      
      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Homework</SelectItem>
            <SelectItem value="not_viewed">Not Viewed</SelectItem>
            <SelectItem value="viewed">Viewed</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="deadline">By Deadline</SelectItem>
            <SelectItem value="created">By Created Date</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Homework List */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading homework...
        </div>
      ) : filteredHomework.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            {allHomework.length === 0 
              ? "No homework assignments yet. Create one to get started!"
              : "No homework matches the selected filters."}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredHomework.map((hw) => {
            const worksheet = worksheets.find(w => w.id === hw.selected_exercises);
            
            return (
              <Card key={hw.id} className="p-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold mb-2 truncate">{hw.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3 flex-shrink-0" />
                        Source: <Link 
                          to={`/worksheet/${worksheetIds.find(id => 
                            homeworkByWorksheet[id]?.some(h => h.id === hw.id)
                          )}`} 
                          className="text-primary hover:underline"
                        >
                          View Worksheet
                        </Link>
                      </span>
                      {hw.deadline && (
                        <Badge variant={isOverdue(hw.deadline) ? "destructive" : "secondary"}>
                          <Calendar className="h-3 w-3 mr-1" />
                          {format(new Date(hw.deadline), 'MMM dd, yyyy')}
                          {isOverdue(hw.deadline) && " (Overdue)"}
                        </Badge>
                      )}
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {hw.view_count} views
                      </span>
                      {hw.viewed_at && (
                        <span className="text-xs">
                          Last viewed: {format(new Date(hw.viewed_at), 'MMM dd, HH:mm')}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyLink(hw.share_token, hw.title)}
                      title="Copy homework link"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenHomework(hw.share_token)}
                      title="Open homework"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletingHomeworkId(hw.id)}
                      title="Delete homework"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingHomeworkId} onOpenChange={(open) => !open && setDeletingHomeworkId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Homework Assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The student will no longer be able to access this homework.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingHomeworkId && handleDeleteHomework(deletingHomeworkId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Create Homework Modal */}
      {firstWorksheet && (
        <CreateHomeworkModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          worksheetId={selectedWorksheetForHomework || firstWorksheet.id}
          worksheetTitle={firstWorksheet.title || 'Worksheet'}
          exercises={firstWorksheet.ai_response ? JSON.parse(firstWorksheet.ai_response).exercises || [] : []}
          teacherId={teacherId}
          students={students.map(s => ({
            id: s.id,
            name: s.name,
            english_level: s.english_level
          }))}
          preselectedStudent={studentId}
        />
      )}
    </div>
  );
};
