import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useDownloadTracking } from "@/hooks/useDownloadTracking";
import { usePaymentTracking } from "@/hooks/usePaymentTracking";
import { updateWorksheet } from "@/services/worksheetService";
import WorksheetHeader from "./worksheet/WorksheetHeader";
import InputParamsCard from "./worksheet/InputParamsCard";
import WorksheetToolbar from "./worksheet/WorksheetToolbar";
import WorksheetContainer from "./worksheet/WorksheetContainer";
import WorksheetContent from "./worksheet/WorksheetContent";
import WorksheetViewTracking from "./worksheet/WorksheetViewTracking";
import { useDownloadStatus } from "@/hooks/useDownloadStatus";
import { useIsMobile } from "@/hooks/use-mobile";
import { StudentKnowledgeFAB } from "@/components/student-knowledge/StudentKnowledgeFAB";
import { StudentKnowledgeMiniList } from "@/components/student-knowledge/StudentKnowledgeMiniList";
import { StudentKnowledgeToggleButton } from "@/components/student-knowledge/StudentKnowledgeToggleButton";
import { StudentKnowledgeFloatingPanel } from "@/components/student-knowledge/StudentKnowledgeFloatingPanel";
import { useStudentKnowledge } from "@/hooks/useStudentKnowledge";
import type { NewKnowledgeEntry, StudentKnowledgeEntry, UpdateKnowledgeEntry, KnowledgeCategory } from "@/types/studentKnowledge";

interface Exercise {
  type: string;
  title: string;
  icon: string;
  time: number;
  instructions: string;
  content?: string;
  questions?: any[];
  items?: any[];
  sentences?: any[];
  dialogue?: any[];
  word_bank?: string[];
  expressions?: string[];
  expression_instruction?: string;
  teacher_tip: string;
}

export interface Worksheet {
  title: string;
  subtitle: string;
  introduction: string;
  exercises: Exercise[];
  vocabulary_sheet: {
    term: string;
    meaning: string;
  }[];
}

interface WorksheetDisplayProps {
  worksheet: Worksheet;
  inputParams: any;
  generationTime: number;
  sourceCount: number;
  onBack: () => void;
  wordBankOrder?: any;
  onDownload?: () => void;
  worksheetId?: string | null;
  onFeedbackSubmit?: (rating: number, feedback: string) => void;
  editableWorksheet: any;
  setEditableWorksheet: (worksheet: any) => void;
  userId?: string;
  studentName?: string;
  studentId?: string;
  onStudentChange?: () => void;
}

export default function WorksheetDisplay({
  worksheet,
  inputParams,
  generationTime,
  sourceCount,
  onBack,
  wordBankOrder,
  onDownload,
  worksheetId,
  onFeedbackSubmit,
  editableWorksheet,
  setEditableWorksheet,
  userId,
  studentName,
  studentId,
  onStudentChange
}: WorksheetDisplayProps) {
  const [viewMode, setViewMode] = useState<'student' | 'teacher'>('student');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expandAllRef, setExpandAllRef] = useState<(() => void) | null>(null);
  const [closeSidebarRef, setCloseSidebarRef] = useState<(() => void) | null>(null);
  const [isPinned, setIsPinned] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const { toast } = useToast();
  const { isDownloadUnlocked, userIp, handleDownloadUnlock, trackDownload, checkTokenGeneratedWorksheet } = useDownloadStatus();
  const isMobile = useIsMobile();
  const { trackDownloadAttempt } = useDownloadTracking(userId);
  const { trackPaymentButtonClick } = usePaymentTracking(userId);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<'add' | 'view' | 'edit'>('add');
  const [selectedEntry, setSelectedEntry] = useState<StudentKnowledgeEntry | null>(null);
  const [isMiniListOpen, setIsMiniListOpen] = useState(false);
  const [miniListPage, setMiniListPage] = useState(1);
  const [miniListCategoryFilter, setMiniListCategoryFilter] = useState<KnowledgeCategory | null>(null);
  const MINI_LIST_PAGE_SIZE = 8;
  
  // Initialize student knowledge hook only if we have studentId and userId (teacherId)
  const shouldShowFAB = !!(studentId && userId && worksheetId);
  const studentKnowledge = useStudentKnowledge({
    studentId: studentId || '',
    teacherId: userId || ''
  });
  
  const shouldShowMiniList = shouldShowFAB && (studentKnowledge.entries?.length || 0) > 0;
  
  // CRITICAL FIX: Reconstruct selectedAudio/selectedImage from database fields
  // This fixes Problem 2 - media not loading from Dashboard
  useEffect(() => {
    if (!editableWorksheet || !worksheetId) return;
    
    console.log('🔍 Media reconstruction check:', {
      worksheetId,
      hasSelectedAudio: !!editableWorksheet.selected_audio,
      hasAudioUrl: !!editableWorksheet.audio_url,
      hasSelectedImage: !!editableWorksheet.selected_image,
      hasImageInFormData: !!editableWorksheet.form_data?.selectedImage
    });
    
    let needsUpdate = false;
    const updatedWorksheet = { ...editableWorksheet };
    
    // Reconstruct selectedAudio if NULL but audio_url exists
    if (!updatedWorksheet.selected_audio && updatedWorksheet.audio_url) {
      console.log('🎵 Reconstructing selectedAudio from database fields:', {
        audio_url: updatedWorksheet.audio_url,
        audio_transcript: updatedWorksheet.audio_transcript,
        audio_duration: updatedWorksheet.audio_duration,
        audio_voice: updatedWorksheet.audio_voice
      });
      updatedWorksheet.selected_audio = {
        url: updatedWorksheet.audio_url,
        ai_generated_audio_url: updatedWorksheet.audio_url,
        transcript: updatedWorksheet.audio_transcript || null,
        duration: updatedWorksheet.audio_duration || null,
        voice: updatedWorksheet.audio_voice || null,
        source: 'database-reconstructed'
      };
      needsUpdate = true;
    }
    
    // Reconstruct selectedImage if NULL but form_data has selectedImage
    if (!updatedWorksheet.selected_image && updatedWorksheet.form_data?.selectedImage) {
      console.log('🖼️ Reconstructing selectedImage from form_data');
      updatedWorksheet.selected_image = updatedWorksheet.form_data.selectedImage;
      needsUpdate = true;
    }
    
    if (needsUpdate) {
      console.log('✅ Media reconstructed successfully, updating state');
      setEditableWorksheet(updatedWorksheet);
    } else {
      console.log('✅ No media reconstruction needed');
    }
  }, [worksheetId, editableWorksheet?.audio_url, editableWorksheet?.selected_audio, editableWorksheet?.selected_image]); // Run when worksheet or media fields change
  
  useEffect(() => {
    validateWorksheetStructure();
    
    // AUTO-UNLOCK: Check if this is a token-generated worksheet
    if (userId && worksheetId) {
      console.log('🔍 Checking if worksheet should be auto-unlocked for user:', userId);
      checkTokenGeneratedWorksheet(worksheetId, userId);
    }
    
    const style = document.createElement('style');
    style.textContent = `
      @media print {
        @page {
          margin: 10mm;
        }
        
        .page-number {
          position: fixed;
          bottom: 10mm;
          right: 10mm;
          font-size: 10pt;
          color: #666;
        }
        
        .page-number::before {
          content: "Page " counter(page) " of " counter(pages);
        }
      }
      
      /* Mobile responsive styles */
      @media (max-width: 767px) {
        .container {
          padding: 10px !important;
        }
        
        .worksheet-content {
          padding: 15px !important;
        }
        
        .grid.grid-cols-1.md\\:grid-cols-4 {
          grid-template-columns: 1fr !important;
        }
        
        .grid.grid-cols-1.md\\:grid-cols-3 {
          grid-template-columns: 1fr !important;
        }
        
        .text-3xl {
          font-size: 1.5rem !important;
          line-height: 2rem !important;
        }
        
        .text-xl {
          font-size: 1.125rem !important;
          line-height: 1.5rem !important;
        }
        
        .p-6 {
          padding: 1rem !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, [userId, worksheetId, checkTokenGeneratedWorksheet]);
  
  const validateWorksheetStructure = () => {
    if (!worksheet) {
      toast({
        title: "Invalid worksheet data",
        description: "The worksheet data is missing or invalid.",
        variant: "destructive"
      });
      return;
    }
    
    if (!Array.isArray(worksheet.exercises) || worksheet.exercises.length === 0) {
      toast({
        title: "Missing exercises",
        description: "The worksheet doesn't contain any exercises.",
        variant: "destructive"
      });
      return;
    }
  };
  
  const handleEdit = () => {
    setIsEditing(true);
  };
  
  const handleSave = async () => {
    if (!worksheetId) {
      toast({
        title: "Cannot save changes",
        description: "Missing worksheet ID",
        variant: "destructive"
      });
      return;
    }

    // Handle anonymous users - save locally only
    if (!userId) {
      setIsEditing(false);
      toast({
        title: "Changes saved locally",
        description: "Your changes have been saved in this browser. Log in to save them to your account.",
        className: "bg-green-50 border-green-200"
      });
      console.log('📝 Anonymous user changes saved locally');
      return;
    }

    // Handle logged-in users - save to database
    setIsSaving(true);
    
    try {
      console.log('💾 Saving worksheet changes to database...');
      await updateWorksheet(worksheetId, editableWorksheet, userId);
      
      setIsEditing(false);
      toast({
        title: "Changes saved successfully",
        description: "Your worksheet has been updated and saved to the database.",
        className: "bg-green-50 border-green-200"
      });
      
      console.log('✅ Worksheet changes saved successfully');
    } catch (error) {
      console.error('❌ Error saving worksheet changes:', error);
      toast({
        title: "Failed to save changes",
        description: error instanceof Error ? error.message : "An unexpected error occurred while saving.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Enhanced download handler with tracking
  const handleDownloadWithTracking = () => {
    // Track download attempt with proper locked/unlocked distinction
    trackDownloadAttempt(isDownloadUnlocked, worksheetId || 'unknown');

    trackDownload();
    if (onDownload) {
      onDownload();
    }
  };

  // Enhanced payment unlock handler with tracking
  const handleDownloadUnlockWithTracking = (token: string) => {
    trackPaymentButtonClick(worksheetId || 'unknown', 1);

    handleDownloadUnlock(token);
  };

  const handleSaveEntry = async (data: NewKnowledgeEntry | { entryId: string; updates: UpdateKnowledgeEntry }) => {
    try {
      if ('entryId' in data) {
        // Edit existing entry
        await studentKnowledge.updateEntry(data.entryId, data.updates);
        toast({
          title: "Note updated",
          description: "Student knowledge entry has been updated successfully.",
          className: "bg-green-50 border-green-200"
        });
      } else {
        // Add new entry
        await studentKnowledge.addEntry(data);
        toast({
          title: "Note added",
          description: "Student knowledge entry has been added successfully.",
          className: "bg-green-50 border-green-200"
        });
      }
      setIsPanelOpen(false);
      setSelectedEntry(null);
      setPanelMode('add');
    } catch (error) {
      console.error('Error saving entry:', error);
      toast({
        title: "Error",
        description: "Failed to save the note. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleViewEntry = (entry: StudentKnowledgeEntry) => {
    setSelectedEntry(entry);
    setPanelMode('view');
    setIsPanelOpen(true);
  };

  const handleAddNote = () => {
    setSelectedEntry(null);
    setPanelMode('add');
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    setSelectedEntry(null);
    setPanelMode('add');
  };

  const handleLoadMoreMiniList = () => {
    setMiniListPage(prev => prev + 1);
  };

  const totalEntries = studentKnowledge.entries?.length || 0;
  const hasMoreEntries = totalEntries >= miniListPage * MINI_LIST_PAGE_SIZE;

  return (
    <WorksheetViewTracking worksheetId={worksheetId} userId={userId}>
      {/* Student Knowledge FAB, Toggle Button, and Mini List */}
      {shouldShowFAB && (
        <>
          <StudentKnowledgeFAB onClick={handleAddNote} />
          <StudentKnowledgeToggleButton
            count={totalEntries}
            isOpen={isMiniListOpen}
            onClick={() => setIsMiniListOpen(!isMiniListOpen)}
          />
          {!isPanelOpen && (
            <StudentKnowledgeMiniList
              entries={studentKnowledge.entries || []}
              onViewEntry={handleViewEntry}
              onLoadMore={handleLoadMoreMiniList}
              hasMore={hasMoreEntries}
              isLoading={studentKnowledge.isLoading}
              isLoadingMore={false}
              isOpen={isMiniListOpen}
              onToggle={() => setIsMiniListOpen(!isMiniListOpen)}
              selectedCategory={miniListCategoryFilter}
              onCategoryFilter={setMiniListCategoryFilter}
            />
          )}
        </>
      )}

      {/* Student Knowledge Floating Panel */}
      {shouldShowFAB && (
        <StudentKnowledgeFloatingPanel
          mode={panelMode}
          isOpen={isPanelOpen}
          onClose={handleClosePanel}
          entry={selectedEntry}
          studentId={studentId!}
          teacherId={userId!}
          studentName={studentName || ''}
          worksheetId={worksheetId || undefined}
          onSave={handleSaveEntry}
          suggestedTags={studentKnowledge.suggestedTags || []}
          onEdit={() => setPanelMode('edit')}
        />
      )}
      
      <WorksheetContainer
        worksheetId={worksheetId}
        onDownload={handleDownloadWithTracking}
        isDownloadUnlocked={isDownloadUnlocked}
        viewMode={viewMode}
        editableWorksheet={editableWorksheet}
        selectedImage={inputParams?.selectedImage || editableWorksheet?.selected_image}
        selectedAudio={(() => {
          // Reconstruct selectedAudio from editableWorksheet
          return (editableWorksheet?.audio_url)
            ? {
                url: editableWorksheet.audio_url || null,
                ai_generated_audio_url: editableWorksheet.audio_url || null,
                transcript: editableWorksheet.audio_transcript || null,
                duration: editableWorksheet.audio_duration || null,
              }
            : (inputParams?.selectedAudio || editableWorksheet?.selected_audio || null);
        })()}
        isPinned={isPinned}
        onTogglePin={() => setIsPinned(!isPinned)}
        isFullScreen={isFullScreen}
        onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
      >
        <div className={`mb-6 ${isMobile ? 'px-2' : ''}`}>
          <WorksheetHeader
            onBack={onBack}
            generationTime={generationTime}
            sourceCount={sourceCount}
            inputParams={inputParams}
            studentName={studentName}
            worksheetId={worksheetId}
            onStudentChange={onStudentChange}
          />
          <InputParamsCard 
            inputParams={inputParams} 
            selectedExercises={inputParams.selectedExercises}
          />
          <WorksheetToolbar
            viewMode={viewMode}
            setViewMode={setViewMode}
            isEditing={isEditing}
            isSaving={isSaving}
            handleEdit={handleEdit}
            handleSave={handleSave}
            worksheetId={worksheetId}
            userIp={userIp}
            isDownloadUnlocked={isDownloadUnlocked}
            onDownloadUnlock={handleDownloadUnlockWithTracking}
            onTrackDownload={trackDownload}
            showPdfButton={false}
            editableWorksheet={editableWorksheet}
            userId={userId}
            onExpandAll={expandAllRef || (() => {})}
            onCloseSidebar={closeSidebarRef || (() => {})}
          />

          <WorksheetContent
            editableWorksheet={editableWorksheet}
            isEditing={isEditing}
            viewMode={viewMode}
            setEditableWorksheet={setEditableWorksheet}
            worksheetId={worksheetId}
            onFeedbackSubmit={onFeedbackSubmit}
            isDownloadUnlocked={isDownloadUnlocked}
            inputParams={inputParams}
            userId={userId}
            onExpandAll={(expandFn: () => void) => setExpandAllRef(() => expandFn)}
            onCloseSidebar={(closeFn: () => void) => setCloseSidebarRef(() => closeFn)}
            isPinned={isPinned}
            onTogglePin={() => setIsPinned(!isPinned)}
            isFullScreen={isFullScreen}
            onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
          />
        </div>
      </WorksheetContainer>
    </WorksheetViewTracking>
  );
}
