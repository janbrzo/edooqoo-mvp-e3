import React from 'react';
import { ExternalLink, Pin, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import DemoWatermark from './DemoWatermark';

interface MediaSectionProps {
  selectedImage: {
    id: string;
    url: string;
    description: string;
    photographer: string;
    photographerUrl: string;
  } | null;
  isDownloadUnlocked: boolean;
  isPinned?: boolean;
  onTogglePin?: () => void;
}

export default function MediaSection({ 
  selectedImage, 
  isDownloadUnlocked,
  isPinned = false,
  onTogglePin
}: MediaSectionProps) {
  const [isFullScreen, setIsFullScreen] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  
  if (!selectedImage) return null;

  return (
    <>
      <div className="mb-8 bg-white border rounded-lg overflow-hidden shadow-sm p-6 relative">
        {!isDownloadUnlocked && <DemoWatermark />}
        
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Lesson Media
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-2"
          >
            {isCollapsed ? (
              <>
                <ChevronDown className="h-4 w-4" />
                Expand
              </>
            ) : (
              <>
                <ChevronUp className="h-4 w-4" />
                Collapse
              </>
            )}
          </Button>
        </div>
      
      {!isCollapsed && (
        <div className="space-y-3">
          <div className="relative rounded-lg overflow-hidden border-2 border-gray-200 shadow-sm max-w-3xl mx-auto">
            <img
              src={selectedImage.url}
              alt={selectedImage.description || 'Lesson image'}
              className="w-full h-auto object-contain max-h-[400px] cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setIsFullScreen(true)}
              title="Click to view full size"
            />
            {!isPinned && onTogglePin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin();
                }}
                className="absolute top-2 right-2 bg-white/90 hover:bg-white shadow-md flex items-center gap-1"
              >
                <Pin className="h-4 w-4" />
                <span className="text-xs">Pin</span>
              </Button>
            )}
          </div>
        
        {/* Unsplash attribution */}
        {selectedImage.photographer && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <span>Photo by</span>
            {selectedImage.photographerUrl ? (
              <a
                href={selectedImage.photographerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-worksheet-purple hover:underline inline-flex items-center gap-1"
              >
                {selectedImage.photographer}
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <span className="font-medium">{selectedImage.photographer}</span>
            )}
            <span>on</span>
            <a
              href="https://unsplash.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-worksheet-purple hover:underline inline-flex items-center gap-1"
            >
              Unsplash
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
        
          {selectedImage.description && (
            <p className="text-sm text-gray-600 text-center italic">
              {selectedImage.description}
            </p>
          )}
        </div>
      )}
      </div>

      {/* Full screen modal */}
      {isFullScreen && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setIsFullScreen(false)}
        >
          <img
            src={selectedImage.url}
            alt={selectedImage.description || 'Lesson image'}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}

    </>
  );
}
