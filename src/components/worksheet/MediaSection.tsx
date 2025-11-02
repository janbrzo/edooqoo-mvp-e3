import React from 'react';
import { ExternalLink, Pin, X, ChevronDown, ChevronUp, Maximize2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import DemoWatermark from './DemoWatermark';
import AudioPlayer from './AudioPlayer';

interface MediaSectionProps {
  selectedImage?: {
    id: string;
    url: string;
    ai_generated_url?: string;
    description?: string;
    detailedDescription?: string;
    photographer?: string;
    photographerUrl?: string;
    source?: string;
  } | null;
  selectedAudio?: {
    id: string;
    url: string;
    ai_generated_audio_url?: string;
    audio_base64_backup?: string;
    transcript?: string;
    detailedTranscript?: string;
    duration?: number;
    voice?: string;
    source?: string;
  } | null;
  base64Backup?: string;
  isDownloadUnlocked: boolean;
  isPinned?: boolean;
  onTogglePin?: () => void;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
}

export default function MediaSection({
  selectedImage,
  selectedAudio,
  base64Backup,
  isDownloadUnlocked,
  isPinned = false,
  onTogglePin,
  isFullScreen = false,
  onToggleFullScreen
}: MediaSectionProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);
  const [imageLoading, setImageLoading] = React.useState(true);
  const { toast } = useToast();
  
  // DEBUGGING: Log media data
  console.log('🖼️ [MEDIASECTION] Rendering with media:', {
    hasImage: !!selectedImage,
    hasAudio: !!selectedAudio,
    imageId: selectedImage?.id,
    audioId: selectedAudio?.id,
    audioUrl: selectedAudio?.url?.substring(0, 50),
    source: selectedImage?.source || selectedAudio?.source,
  });
  
  if (!selectedImage && !selectedAudio) return null;

  // If audio is present, render audio player
  if (selectedAudio && (selectedAudio.url || selectedAudio.ai_generated_audio_url || selectedAudio.audio_base64_backup)) {
    return (
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
          <AudioPlayer
            audioUrl={
              selectedAudio.ai_generated_audio_url || 
              selectedAudio.url || 
              (selectedAudio.audio_base64_backup ? `data:audio/mpeg;base64,${selectedAudio.audio_base64_backup}` : '')
            }
            transcript={selectedAudio.transcript}
            duration={selectedAudio.duration}
            voice={selectedAudio.voice}
          />
        )}
      </div>
    );
  }

  // If image is present, render image (existing logic)

  // Priority: detailedDescription (Vertex AI) > description (Unsplash)
  const displayDescription = selectedImage.detailedDescription || selectedImage.description || 'Lesson image';
  const isVertexAIGenerated = selectedImage.source === 'vertex-ai-generated';
  
  // Determine which URL to use with intelligent fallback
  const imageUrl = React.useMemo(() => {
    if (!selectedImage) return "";
    
    // Priority 1: Try R2 URL first (ai_generated_url or url if not base64)
    if (!imageError) {
      if (selectedImage.ai_generated_url) {
        console.log('🖼️ [MEDIASECTION] Using R2 URL (ai_generated_url):', selectedImage.ai_generated_url?.substring(0, 80) + '...');
        return selectedImage.ai_generated_url;
      }
      if (selectedImage.url && !selectedImage.url.startsWith('data:')) {
        console.log('🖼️ [MEDIASECTION] Using R2 URL (url field):', selectedImage.url?.substring(0, 80) + '...');
        return selectedImage.url;
      }
    }
    
    // Priority 2: Emergency fallback to base64 from separate database column (NEW!)
    if (base64Backup) {
      console.log('🔄 [MEDIASECTION] Falling back to base64_backup from separate database column');
      return base64Backup;
    }
    
    // Priority 3: Last resort - url field (might be base64 from old worksheets)
    console.log('🔄 [MEDIASECTION] Using url field as last resort (backward compatibility)');
    return selectedImage.url || "";
  }, [selectedImage, imageError, base64Backup]);

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
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 min-h-[200px]">
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin h-8 w-8 border-4 border-worksheet-purple border-t-transparent rounded-full"></div>
                  <p className="text-sm text-gray-600">Loading image...</p>
                </div>
              </div>
            )}
            <img
              src={imageUrl}
              alt={displayDescription}
              className="w-full h-auto object-contain max-h-[400px] cursor-pointer"
              onClick={onToggleFullScreen}
              onLoad={() => {
                setImageLoading(false);
                console.log('✅ [MEDIASECTION] Image loaded successfully:', imageUrl?.substring(0, 80));
              }}
              onError={(e) => {
                console.error('❌ [MEDIASECTION] Image load failed:', imageUrl?.substring(0, 80));
                setImageLoading(false);
                if (!imageError) {
                  setImageError(true);  // Trigger re-render with fallback
                  toast({
                    title: "Image loading issue",
                    description: "Trying alternative image source...",
                    variant: "default",
                  });
                } else {
                  // Even fallback failed - show error
                  console.error('❌ [MEDIASECTION] Both R2 and base64 failed');
                  toast({
                    title: "Failed to load image",
                    description: "Please try regenerating the worksheet or contact support.",
                    variant: "destructive",
                  });
                }
              }}
              title="Click to expand image"
            />
            {onTogglePin && onToggleFullScreen && (
              <div className="absolute top-2 right-2 flex flex-col gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePin();
                  }}
                  className={cn(
                    "bg-white/90 hover:bg-white shadow-md",
                    isPinned && "bg-worksheet-purple text-white"
                  )}
                  title={isPinned ? "Unpin image" : "Pin image"}
                >
                  <Pin className={cn("h-4 w-4", isPinned && "fill-current")} />
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
        
        {/* Attribution - conditional based on source */}
        {isVertexAIGenerated ? (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <span>Photo by: </span>
            <a
              href="https://deepmind.google/models/imagen/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-worksheet-purple hover:underline inline-flex items-center gap-1"
            >
              Google Imagen 4.0 Fast
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        ) : selectedImage.photographer && (
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
        
          {displayDescription && (
            <p className="text-sm text-gray-600 text-center italic">
              {displayDescription}
            </p>
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
            src={imageUrl}
            alt={displayDescription}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}

    </>
  );
}
