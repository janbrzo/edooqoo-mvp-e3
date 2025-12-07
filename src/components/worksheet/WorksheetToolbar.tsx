import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit, Lightbulb, User, Download, Lock, Loader2, Share2, Gift, BookOpen, Copy } from "lucide-react";
import { isFreeCustomDemoWeek } from "@/utils/promoUtils";
import PaymentPopup from "@/components/PaymentPopup";
import ShareWorksheetModal from "@/components/ShareWorksheetModal";
import { DuplicateWorksheetButton } from "@/components/DuplicateWorksheetButton";
import { exportAsHTML } from "@/utils/htmlExport";
import { trackWorksheetEvent } from "@/services/worksheetService";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDownloadTracking } from "@/hooks/useDownloadTracking";
import { useAuthFlow } from "@/hooks/useAuthFlow";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WorksheetToolbarProps {
  viewMode: "student" | "teacher";
  setViewMode: (mode: "student" | "teacher") => void;
  isEditing: boolean;
  isSaving?: boolean;
  handleEdit: () => void;
  handleSave: () => void;
  onDiscardChanges?: () => void;
  worksheetId?: string | null;
  userIp?: string | null;
  isDownloadUnlocked?: boolean;
  onDownloadUnlock?: (token: string) => void;
  onTrackDownload?: () => void;
  showPdfButton?: boolean;
  editableWorksheet: any;
  userId?: string;
  onExpandAll?: () => void;
  onCloseSidebar?: () => void;
  onCreateHomework?: () => void;
  onDuplicateSuccess?: () => void;
}

const WorksheetToolbar = ({
  viewMode,
  setViewMode,
  isEditing,
  isSaving = false,
  handleEdit,
  handleSave,
  onDiscardChanges,
  worksheetId,
  userIp,
  isDownloadUnlocked = false,
  onDownloadUnlock,
  onTrackDownload,
  showPdfButton = false,
  editableWorksheet,
  userId,
  onExpandAll,
  onCloseSidebar,
  onCreateHomework,
  onDuplicateSuccess,
}: WorksheetToolbarProps) => {
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'html-student' | 'html-teacher' | 'pdf' | null>(null);
  const isMobile = useIsMobile();
  const { trackDownloadAttempt } = useDownloadTracking(userId);
  const { user, isRegisteredUser } = useAuthFlow();

  const handleDownloadHTML = async (downloadViewMode: "student" | "teacher") => {
    const originalViewMode = viewMode;

    const performExport = async () => {
      // Close sidebar before export to prevent overlay
      if (onCloseSidebar) {
        onCloseSidebar();
        // Wait for sidebar close to complete
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Expand all exercises before export to ensure full content is captured
      if (onExpandAll) {
        onExpandAll();
        // Wait for expansion to complete
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      // Get the actual worksheet title from editableWorksheet
      const title = editableWorksheet?.title || 'English Worksheet';
      
      const timestamp = new Date().toISOString().split('T')[0];
      const viewModeText = downloadViewMode === 'teacher' ? 'Teacher' : 'Student';
      const sanitizedTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      const filename = `${timestamp}-${viewModeText}-${sanitizedTitle}.html`;
      
      console.log(`Preparing to download HTML for ${downloadViewMode} view.`);
      
      const success = await exportAsHTML('worksheet-content', filename, downloadViewMode, title);
      
      if (success) {
        if (onTrackDownload) {
          onTrackDownload();
        }
        
        if (worksheetId) {
          try {
            console.log(`Attempting to track download for worksheet: ${worksheetId}`);
            await trackWorksheetEvent('download', worksheetId, userIp || 'anonymous');
            console.log('Download tracked successfully in worksheets table');
          } catch (error) {
            console.error('Failed to track download in worksheets table:', error);
          }
        } else {
          console.log('No worksheetId provided, skipping worksheet table tracking');
        }
      }
      if (!success) {
        console.error('Failed to export HTML');
      }
    };

    if (originalViewMode === downloadViewMode) {
      await performExport();
    } else {
      // Switch view, wait for DOM update, export, then switch back.
      setViewMode(downloadViewMode);
      // Use a short timeout to allow React to re-render the component tree.
      await new Promise(resolve => setTimeout(resolve, 200)); 
      try {
        await performExport();
      } finally {
        // Switch back to the original view mode.
        setViewMode(originalViewMode);
      }
    }
  };

  const handleDownloadClick = async (type: 'html-student' | 'html-teacher' | 'pdf') => {
    // Track download attempt with proper locked/unlocked distinction
    trackDownloadAttempt(!isDownloadUnlocked, worksheetId || 'unknown', {
      downloadType: type
    });

    if (isDownloadUnlocked) {
      if (type === 'html-student') {
        handleDownloadHTML('student');
      } else if (type === 'html-teacher') {
        handleDownloadHTML('teacher');
      }
    } else {
      setPendingAction(type);
      setShowPaymentPopup(true);
    }
  };

  const handlePaymentSuccess = (token: string) => {
    if (onDownloadUnlock) {
      onDownloadUnlock(token);
    }
    
    if (pendingAction === 'html-student') {
      handleDownloadHTML('student');
    } else if (pendingAction === 'html-teacher') {
      handleDownloadHTML('teacher');
    }
    
    setPendingAction(null);
  };

  const handlePaymentPopupClose = () => {
    setShowPaymentPopup(false);
    setPendingAction(null);
  };

  const handleShareClick = () => {
    console.log('Share button clicked');
    console.log('User:', user);
    console.log('Is registered user:', isRegisteredUser);
    console.log('Worksheet ID:', worksheetId);
    
    setShowShareModal(true);
  };

  // Check if user can share worksheets (registered user with valid worksheetId)
  const canShareWorksheet = isRegisteredUser && worksheetId && !user?.is_anonymous;
  
  // Check if FREE DEMO WEEK is active to show gift icon instead of lock
  const isFreeWeek = isFreeCustomDemoWeek();
  const shouldShowGiftIcon = isFreeWeek && !isDownloadUnlocked;

  return (
    <>
      <div className="sticky top-0 z-10 bg-white border-b mb-6 py-3 px-4">
        <div className={`flex ${isMobile ? 'flex-col gap-3' : 'justify-between items-center'} max-w-[98%] mx-auto`}>
          <div className={`flex ${isMobile ? 'justify-center' : ''} space-x-2`}>
            <Button
              variant={viewMode === 'student' ? 'default' : 'outline'}
              onClick={() => setViewMode('student')}
              className={viewMode === 'student' ? 'bg-worksheet-purple hover:bg-worksheet-purpleDark' : ''}
              size="sm"
            >
              <User className="mr-2 h-4 w-4" />
              Student
            </Button>
            <Button
              variant={viewMode === 'teacher' ? 'default' : 'outline'}
              onClick={() => setViewMode('teacher')}
              className={viewMode === 'teacher' ? 'bg-worksheet-purple hover:bg-worksheet-purpleDark' : ''}
              size="sm"
            >
              <Lightbulb className="mr-2 h-4 w-4" />
              Teacher
            </Button>
          </div>
          <div className={`flex ${isMobile ? 'flex-col gap-2' : 'items-center'}`}>
            {!isEditing && (
              <>
                <Button
                  variant="outline"
                  onClick={handleEdit}
                  className={`border-worksheet-purple text-worksheet-purple ${isMobile ? '' : 'mr-2'}`}
                  size="sm"
                >
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
                
                {/* Duplicate Worksheet Button (Problem 5) */}
                {worksheetId && (
                  <DuplicateWorksheetButton
                    worksheetId={worksheetId}
                    worksheetTitle={editableWorksheet?.title || 'Worksheet'}
                    onDuplicate={onDuplicateSuccess || (() => {})}
                    variant="outline"
                    size="sm"
                    className="border-worksheet-purple text-worksheet-purple mr-2"
                  />
                )}
                
                {canShareWorksheet && (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleShareClick}
                      className={`border-worksheet-purple text-worksheet-purple ${isMobile ? '' : 'mr-2'}`}
                      size="sm"
                    >
                      <Share2 className="mr-2 h-4 w-4" /> Share
                    </Button>
                    
                    {onCreateHomework && (
                      <Button
                        variant="outline"
                        onClick={onCreateHomework}
                        className={`border-worksheet-purple text-worksheet-purple ${isMobile ? '' : 'mr-2'}`}
                        size="sm"
                      >
                        <BookOpen className="mr-2 h-4 w-4" /> Create Homework
                      </Button>
                    )}
                  </>
                )}
              </>
            )}
            {isEditing && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      className={`bg-green-600 hover:bg-green-700 ${isMobile ? '' : 'mr-2'}`}
                      size="sm"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Ctrl+S / Cmd+S</p>
                  </TooltipContent>
                </Tooltip>
                {onDiscardChanges && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={onDiscardChanges}
                        disabled={isSaving}
                        variant="outline"
                        className={`border-red-500 text-red-500 hover:bg-red-50 ${isMobile ? '' : 'mr-2'}`}
                        size="sm"
                      >
                        Discard Changes
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Press Escape</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </>
            )}
            <div className={`flex ${isMobile ? 'flex-col gap-2' : 'gap-2'}`}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => handleDownloadClick('html-student')}
                    className={`${isDownloadUnlocked 
                      ? 'bg-worksheet-purple hover:bg-worksheet-purpleDark' 
                      : 'bg-gray-400 hover:bg-gray-500'} ${isMobile ? 'w-full' : ''}`}
                    size="sm"
                  >
                    {isDownloadUnlocked ? (
                      <Download className="mr-2 h-4 w-4" />
                    ) : shouldShowGiftIcon ? (
                      <Gift className="mr-2 h-4 w-4" />
                    ) : (
                      <Lock className="mr-2 h-4 w-4" />
                    )}
                    {isMobile ? 'Student (HTML)' : 'Download STUDENT'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Download as HTML file. Best quality, works offline. Double-click to open.</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => handleDownloadClick('html-teacher')}
                    className={`${isDownloadUnlocked 
                      ? 'bg-worksheet-purple hover:bg-worksheet-purpleDark' 
                      : 'bg-gray-400 hover:bg-gray-500'} ${isMobile ? 'w-full' : ''}`}
                    size="sm"
                  >
                    {isDownloadUnlocked ? (
                      <Download className="mr-2 h-4 w-4" />
                    ) : shouldShowGiftIcon ? (
                      <Gift className="mr-2 h-4 w-4" />
                    ) : (
                      <Lock className="mr-2 h-4 w-4" />
                    )}
                    {isMobile ? 'Teacher (HTML)' : 'Download TEACHER'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Download as HTML file. Best quality, works offline. Double-click to open.</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      <PaymentPopup
        isOpen={showPaymentPopup}
        onClose={handlePaymentPopupClose}
        onPaymentSuccess={handlePaymentSuccess}
        worksheetId={worksheetId}
        userIp={userIp}
      />

      {canShareWorksheet && (
        <ShareWorksheetModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          worksheetId={worksheetId!}
          worksheetTitle={editableWorksheet?.title || 'English Worksheet'}
        />
      )}
    </>
  );
};

export default WorksheetToolbar;
