
import React, { useState, useRef, useEffect } from "react";
import { ArrowUp, Image, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generatePDF } from "@/utils/pdfUtils";
import { FormData } from "@/components/WorksheetForm";
import { Button } from "@/components/ui/button";

interface WorksheetContainerProps {
  children: React.ReactNode;
  worksheetId?: string | null;
  onDownload?: () => void;
  isDownloadUnlocked: boolean;
  viewMode: "student" | "teacher";
  editableWorksheet: any;
  selectedImage?: {
    id: string;
    url: string;
    description: string;
    photographer: string;
    photographerUrl: string;
  } | null;
  isPinned?: boolean;
  onTogglePin?: () => void;
}

export default function WorksheetContainer({
  children,
  worksheetId,
  onDownload,
  isDownloadUnlocked,
  viewMode,
  editableWorksheet,
  selectedImage,
  isPinned = false,
  onTogglePin
}: WorksheetContainerProps) {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const worksheetRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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

  const handleDownloadPDF = async () => {
    if (!isDownloadUnlocked) {
      toast({
        title: "Payment Required",
        description: "Please complete payment to download files.",
        variant: "destructive"
      });
      return;
    }

    if (worksheetRef.current) {
      try {
        const today = new Date();
        const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const viewModeText = viewMode === 'teacher' ? 'Teacher' : 'Student';
        const filename = `${formattedDate}-${viewModeText}-${editableWorksheet.title.replace(/\s+/g, '-').toLowerCase()}.pdf`;
        
        const result = await generatePDF('worksheet-content', filename, viewMode === 'teacher', editableWorksheet.title);
        if (result) {
          toast({
            title: "PDF Downloaded",
            description: "Your worksheet has been downloaded successfully."
          });
          if (onDownload) {
            onDownload();
          }
        } else {
          toast({
            title: "PDF Generation Failed",
            description: "There was an error generating your PDF. Please try again.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('PDF generation error:', error);
        toast({
          title: "PDF Generation Failed",
          description: "There was an error generating your PDF. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <div className="container mx-auto py-6" data-worksheet-id={worksheetId || undefined}>
      <style>{`
        @media print {
          @page {
            margin: 2mm 4.5mm 10mm 4.5mm !important;
          }
          .container {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .worksheet-content {
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
      
      {children}
      
      {/* Fixed action buttons in bottom right */}
      {showScrollTop && (
        <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50">
          {/* Pin Image button - only show if image exists */}
          {selectedImage && onTogglePin && (
            <button 
              onClick={onTogglePin}
              className="rounded-full bg-worksheet-purple text-white p-3 shadow-lg cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
              aria-label={isPinned ? "Unpin image" : "Pin image"}
              title={isPinned ? "Unpin image" : "Pin image"}
            >
              <Image className="h-5 w-5" />
            </button>
          )}
          
          {/* Scroll to top button */}
          <button 
            onClick={scrollToTop}
            className="rounded-full bg-worksheet-purple text-white p-3 shadow-lg cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
            aria-label="Scroll to top"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Pinned image in bottom right corner */}
      {isPinned && selectedImage && (
        <div 
          className="fixed bottom-6 right-24 z-40 bg-white border-2 border-gray-300 rounded-lg shadow-2xl overflow-hidden"
          style={{ width: '300px' }}
        >
          <div className="relative">
            <img
              src={selectedImage.url}
              alt={selectedImage.description || 'Lesson image'}
              className="w-full h-auto object-contain max-h-[200px]"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={onTogglePin}
              className="absolute top-1 right-1 bg-white/80 hover:bg-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
