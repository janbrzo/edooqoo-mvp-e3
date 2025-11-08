import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthFlow } from '@/hooks/useAuthFlow';
import { useWorksheetHistory } from '@/hooks/useWorksheetHistory';
import { useStudents } from '@/hooks/useStudents';
import { useDeletedWorksheets } from '@/hooks/useDeletedWorksheets';
import { supabase } from '@/integrations/supabase/client';
import { DeleteWorksheetButton } from '@/components/DeleteWorksheetButton';
import { format } from 'date-fns';
import { 
  FileText, 
  Search, 
  Filter, 
  Calendar,
  User,
  Star,
  ArrowLeft,
  Download,
  Eye,
  Edit3,
  Share,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { MediaBadges } from '@/components/worksheet/MediaBadges';
import { hasImage, hasAudio } from '@/utils/worksheetUtils';

interface WorksheetHistoryItem {
  id: string;
  title: string;
  created_at: string;
  form_data: any;
  ai_response: string;
  html_content: string;
  student_id?: string;
  generation_time_seconds?: number;
}

type Student = Tables<'students'>;

const AllWorksheetsPage = () => {
  const { user, loading: authLoading, isRegisteredUser } = useAuthFlow();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  // State for filtering and sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'student' | 'rating'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedWorksheets, setSelectedWorksheets] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'deleted'>('active');
  
  // Pass selectedStudent filter to hooks for server-side filtering
  const studentFilter = (selectedStudent === 'all' || selectedStudent === 'unassigned') 
    ? (selectedStudent === 'unassigned' ? 'unassigned' : undefined)
    : selectedStudent;

  // ✅ Server-side pagination with listView mode and student filtering
  const { worksheets, loading, deleteWorksheet, restoreWorksheet, totalCount, refetch: refetchWorksheets } = 
    useWorksheetHistory(studentFilter, false, true, currentPage, itemsPerPage);
  const { students } = useStudents();
  // ✅ Server-side pagination for deleted worksheets
  const { deletedWorksheets, loading: deletedLoading, restoreWorksheet: restoreDeleted, totalCount: deletedTotalCount, refetch: refetchDeleted } = 
    useDeletedWorksheets(studentFilter, false, true, currentPage, itemsPerPage);
  const navigate = useNavigate();

  // Authentication check
  useEffect(() => {
    if (!authLoading && !isRegisteredUser) {
      navigate('/');
    }
  }, [authLoading, isRegisteredUser, navigate]);

  // Refetch when page or tab changes
  useEffect(() => {
    if (activeTab === 'active') {
      refetchWorksheets();
    } else {
      refetchDeleted();
    }
  }, [currentPage, activeTab]);

  // Reset to page 1 and refetch when filters change
  useEffect(() => {
    setCurrentPage(1);
    if (activeTab === 'active') {
      refetchWorksheets();
    } else {
      refetchDeleted();
    }
  }, [activeTab, searchQuery, selectedStudent]);

  // Helper functions
  const getStudentName = (studentId: string | null) => {
    if (!studentId) return 'Unassigned';
    const student = students.find(s => s.id === studentId);
    return student?.name || 'Unknown Student';
  };

  const formatWorksheetTitle = (worksheet: WorksheetHistoryItem) => {
    try {
      const formData = worksheet.form_data as any;
      return formData?.lessonTopic || worksheet.title || 'Untitled Worksheet';
    } catch {
      return worksheet.title || 'Untitled Worksheet';
    }
  };

  // Filter and sort worksheets based on active tab
  const currentWorksheets = activeTab === 'active' ? worksheets : deletedWorksheets;
  // Student filtering is now server-side, only search filter is client-side
  const filteredAndSortedWorksheets = currentWorksheets
    .filter(worksheet => {
      const matchesSearch = searchQuery === '' || 
        formatWorksheetTitle(worksheet).toLowerCase().includes(searchQuery.toLowerCase()) ||
        getStudentName(worksheet.student_id).toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesSearch;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'name':
          comparison = formatWorksheetTitle(a).localeCompare(formatWorksheetTitle(b));
          break;
        case 'student':
          comparison = getStudentName(a.student_id).localeCompare(getStudentName(b.student_id));
          break;
        case 'rating':
          // This would need to be implemented if we track ratings
          comparison = 0;
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

  // Server-side pagination - worksheets are already paginated from the hook
  const currentTotalCount = activeTab === 'active' ? totalCount : deletedTotalCount;
  const totalPages = Math.ceil(currentTotalCount / itemsPerPage);
  const paginatedWorksheets = filteredAndSortedWorksheets; // Already paginated from server

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedWorksheets(paginatedWorksheets.map(w => w.id));
    } else {
      setSelectedWorksheets([]);
    }
  };

  const handleSelectWorksheet = (worksheetId: string, checked: boolean) => {
    if (checked) {
      setSelectedWorksheets(prev => [...prev, worksheetId]);
    } else {
      setSelectedWorksheets(prev => prev.filter(id => id !== worksheetId));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedWorksheets.length === 0) return;
    
    const confirmed = window.confirm(`Are you sure you want to delete ${selectedWorksheets.length} worksheet(s)?`);
    if (!confirmed) return;

    for (const worksheetId of selectedWorksheets) {
      await deleteWorksheet(worksheetId);
    }
    setSelectedWorksheets([]);
  };

  const handleWorksheetOpen = async (worksheet: WorksheetHistoryItem) => {
    try {
      // ✅ FIX: In listView mode, we don't have ai_response, so fetch it separately
      let worksheetData = worksheet;
      
      if (!worksheet.ai_response) {
        console.log('[AllWorksheets] Fetching full worksheet data for:', worksheet.id);
        const { data, error } = await supabase
          .from('worksheets')
          .select('*')
          .eq('id', worksheet.id)
          .single();
        
        if (error) throw error;
        if (!data) throw new Error('Worksheet not found');
        
        worksheetData = data as any;
      }
      
      // Parse the AI response to get the worksheet data
      const parsedData = JSON.parse(worksheetData.ai_response);
      
      // Store worksheet data in sessionStorage for restoration
      const restoredWorksheet = {
        ...worksheetData,
        ai_response: JSON.stringify(parsedData)
      };
      
      sessionStorage.setItem('restoredWorksheet', JSON.stringify(restoredWorksheet));
      
      // Navigate to the main worksheet view
      navigate('/');
    } catch (error) {
      console.error('Error opening worksheet:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">All Worksheets</h1>
              <p className="text-gray-600 mt-1">
                {filteredAndSortedWorksheets.length} worksheet{filteredAndSortedWorksheets.length !== 1 ? 's' : ''} found
              </p>
            </div>
            <Button asChild>
              <Link to="/">
                <FileText className="h-4 w-4 mr-2" />
                Generate New
              </Link>
            </Button>
          </div>
        </div>

        {/* Tabs for Active/Deleted */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'active' | 'deleted')} className="mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="active">
              Active ({worksheets.length})
            </TabsTrigger>
            <TabsTrigger value="deleted">
              Deleted ({deletedWorksheets.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search worksheets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Student Filter */}
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="All Students" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  {students.map(student => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort By */}
              <Select value={sortBy} onValueChange={(value: 'date' | 'name' | 'student' | 'rating') => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Sort by Date</SelectItem>
                  <SelectItem value="name">Sort by Name</SelectItem>
                  <SelectItem value="student">Sort by Student</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort Order */}
              <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest First</SelectItem>
                  <SelectItem value="asc">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedWorksheets.length > 0 && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-orange-800">
                  {selectedWorksheets.length} worksheet{selectedWorksheets.length !== 1 ? 's' : ''} selected
                </span>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleBulkDelete}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete Selected
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Worksheets List */}
        <Card>
          <CardContent className="p-0">
            {/* Table Header */}
            <div className="border-b bg-gray-50 p-4">
              <div className="grid grid-cols-12 gap-4 items-center text-sm font-medium text-gray-700">
                <div className="col-span-1">
                  <Checkbox
                    checked={selectedWorksheets.length === paginatedWorksheets.length && paginatedWorksheets.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </div>
                <div className="col-span-5">Worksheet</div>
                <div className="col-span-2">Student</div>
                <div className="col-span-2">Created</div>
                <div className="col-span-2">Actions</div>
              </div>
            </div>

            {/* Worksheets */}
            {paginatedWorksheets.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No worksheets found</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery || selectedStudent ? 'Try adjusting your filters' : 'Generate your first worksheet to get started'}
                </p>
                <Button asChild>
                  <Link to="/">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Worksheet
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {paginatedWorksheets.map((worksheet) => (
                  <div
                    key={worksheet.id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* Checkbox */}
                      <div className="col-span-1">
                        <Checkbox
                          checked={selectedWorksheets.includes(worksheet.id)}
                          onCheckedChange={(checked) => handleSelectWorksheet(worksheet.id, checked as boolean)}
                        />
                      </div>

                      {/* Worksheet Info */}
                      <div className="col-span-5">
                        <div
                          className="cursor-pointer group"
                          onClick={() => handleWorksheetOpen(worksheet)}
                        >
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900 group-hover:text-primary transition-colors truncate">
                              {formatWorksheetTitle(worksheet)}
                            </h3>
                            <MediaBadges 
                              hasImage={hasImage(worksheet)} 
                              hasAudio={hasAudio(worksheet)}
                              size="sm"
                            />
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            ID: {worksheet.id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>

                      {/* Student */}
                      <div className="col-span-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-700 truncate">
                            {getStudentName(worksheet.student_id)}
                          </span>
                        </div>
                      </div>

                      {/* Date */}
                      <div className="col-span-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-700">
                            {format(new Date(worksheet.created_at), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="col-span-2">
                        <div className="flex items-center gap-1">
                          {activeTab === 'active' ? (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleWorksheetOpen(worksheet)}
                                className="text-gray-600 hover:text-primary"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <DeleteWorksheetButton
                                worksheetId={worksheet.id}
                                worksheetTitle={formatWorksheetTitle(worksheet)}
                                onDelete={deleteWorksheet}
                                size="sm"
                              />
                            </>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                const result = await restoreDeleted(worksheet.id);
                                if (result.success) {
                                  // Refresh both lists
                                  window.location.reload();
                                }
                              }}
                              className="border-green-500 text-green-700 hover:bg-green-50"
                            >
                              <RotateCcw className="h-4 w-4 mr-1" />
                              Restore
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-700">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, currentTotalCount)} of{' '}
              {currentTotalCount} results
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-3 py-1 text-sm bg-gray-100 rounded">
                {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllWorksheetsPage;