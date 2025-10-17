import React from 'react';
import { ExternalLink, Pin, X, ChevronDown, ChevronUp, Maximize2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import DemoWatermark from './DemoWatermark';

interface MediaSectionProps {
  selectedImage?: {
    id: string;
    url: string;
    description: string;
    photographer: string;
    photographerUrl: string;
  } | null;
  selectedVideo?: {
    id: string;
    url: string;
    title: string;
    channelTitle: string;
  } | null;
  isDownloadUnlocked: boolean;
  isPinned?: boolean;
  onTogglePin?: () => void;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
}

export default function MediaSection({ 
  selectedImage, 
  selectedVideo,
  isDownloadUnlocked,
  isPinned = false,
  onTogglePin,
  isFullScreen = false,
  onToggleFullScreen
}: MediaSectionProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  
  if (!selectedImage && !selectedVideo) return null;

  return (
    <>
      <div className="mb-8 bg-white border rounded-lg overflow-hidden shadow-sm p-6 relative">
        {!isDownloadUnlocked && <DemoWatermark />}
        
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Lesson Media {selectedVideo ? '(Video)' : '(Image)'}
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
          {selectedImage && (
            <>
              <div className="relative rounded-lg overflow-hidden border-2 border-gray-200 shadow-sm max-w-3xl mx-auto">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.description || 'Lesson image'}
                  className="w-full h-auto object-contain max-h-[400px] cursor-pointer"
                  onClick={onToggleFullScreen}
                  title="Click to expand image"
                />
                {!isPinned && onTogglePin && onToggleFullScreen && (
                  <div className="absolute top-2 right-2 flex flex-col gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePin();
                      }}
                      className="bg-white/90 hover:bg-white shadow-md"
                      title="Pin image"
                    >
                      <Pin className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFullScreen();
                      }}
                      className="bg-white/90 hover:bg-white shadow-md"
                      title="Expand image"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </div>
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
            </>
          )}

          {selectedVideo && (
            <div className="relative rounded-lg overflow-hidden border-2 border-gray-200 shadow-sm max-w-3xl mx-auto">
              <div className="relative pt-[56.25%]">
                <iframe
                  src={selectedVideo.url}
                  title={selectedVideo.title}
                  className="absolute top-0 left-0 w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              
              <div className="p-3 bg-gray-50 border-t">
                <p className="text-sm font-medium text-gray-800">{selectedVideo.title}</p>
                <p className="text-xs text-gray-600 mt-1">Channel: {selectedVideo.channelTitle}</p>
              </div>
            </div>
          )}
        </div>
      )}
      </div>

      {/* Full screen modal */}
      {isFullScreen && onToggleFullScreen && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-pointer"
          onClick={onToggleFullScreen}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFullScreen();
            }}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white"
          >
            <X className="h-6 w-6" />
          </Button>
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
