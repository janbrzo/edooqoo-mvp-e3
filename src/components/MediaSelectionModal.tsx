import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ImageSuggestion {
  id: string;
  url: string;
  thumbnail: string;
  description: string;
  photographer: string;
  photographerUrl: string;
}

interface VideoSuggestion {
  id: string;
  url: string;
  thumbnail: string;
  title: string;
  description: string;
  channelTitle: string;
  publishedAt: string;
}

interface MediaSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSelect?: (image: ImageSuggestion) => void;
  onVideoSelect?: (video: VideoSuggestion) => void;
  searchQuery: string;
  mediaType: 'picture' | 'video';
}

export default function MediaSelectionModal({
  isOpen,
  onClose,
  onImageSelect,
  onVideoSelect,
  searchQuery,
  mediaType
}: MediaSelectionModalProps) {
  const [images, setImages] = useState<ImageSuggestion[]>([]);
  const [videos, setVideos] = useState<VideoSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [selectedImage, setSelectedImage] = useState<ImageSuggestion | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoSuggestion | null>(null);

  // Fetch images when modal opens
  useEffect(() => {
    if (isOpen && searchQuery) {
      fetchImages();
    }
  }, [isOpen, searchQuery]);

  // Countdown timer for auto-selection
  useEffect(() => {
    const hasMedia = mediaType === 'picture' ? images.length > 0 : videos.length > 0;
    if (!isOpen || !hasMedia) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Auto-select random media when countdown reaches 0
          if (mediaType === 'picture' && images.length > 0) {
            const randomImage = images[Math.floor(Math.random() * images.length)];
            handleImageClick(randomImage);
          } else if (mediaType === 'video' && videos.length > 0) {
            const randomVideo = videos[Math.floor(Math.random() * videos.length)];
            handleVideoClick(randomVideo);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, images, videos, mediaType]);

  const fetchImages = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-media', {
        body: { query: searchQuery, count: 4, mediaType }
      });

      if (error) throw error;

      if (mediaType === 'picture' && data?.images) {
        setImages(data.images);
        setCountdown(30);
      } else if (mediaType === 'video' && data?.videos) {
        setVideos(data.videos);
        setCountdown(30);
      }
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageClick = (image: ImageSuggestion) => {
    setSelectedImage(image);
    if (onImageSelect) {
      onImageSelect(image);
    }
    onClose();
  };

  const handleVideoClick = (video: VideoSuggestion) => {
    setSelectedVideo(video);
    if (onVideoSelect) {
      onVideoSelect(video);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-worksheet-purpleDark">
            Select {mediaType === 'picture' ? 'an Image' : 'a Video'} for Your Lesson
          </DialogTitle>
          <DialogDescription className="text-base">
            Choose one of these {mediaType === 'picture' ? 'images' : 'videos'} to enhance your {mediaType}-based exercises.
            {countdown > 0 && ` Auto-selecting in ${countdown}s...`}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-worksheet-purple" />
          </div>
        ) : mediaType === 'picture' ? (
          <div className="grid grid-cols-2 gap-4 py-4">
            {images.map((image) => (
              <button
                key={image.id}
                onClick={() => handleImageClick(image)}
                className="group relative overflow-hidden rounded-lg border-2 border-gray-200 hover:border-worksheet-purple transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-worksheet-purple"
              >
                <img
                  src={image.thumbnail}
                  alt={image.description}
                  className="w-full h-64 object-cover transition-transform duration-200 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end">
                  <div className="p-4 text-white text-sm">
                    <p className="font-medium">{image.description}</p>
                    <p className="text-xs text-gray-300 mt-1">
                      Photo by {image.photographer}
                    </p>
                  </div>
                </div>
                <div className="absolute top-2 right-2 bg-white/90 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <ImageIcon className="h-4 w-4 text-worksheet-purple" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 py-4">
            {videos.map((video) => (
              <button
                key={video.id}
                onClick={() => handleVideoClick(video)}
                className="group relative overflow-hidden rounded-lg border-2 border-gray-200 hover:border-worksheet-purple transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-worksheet-purple"
              >
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-64 object-cover transition-transform duration-200 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end">
                  <div className="p-4 text-white text-sm">
                    <p className="font-medium line-clamp-2">{video.title}</p>
                    <p className="text-xs text-gray-300 mt-1">
                      {video.channelTitle}
                    </p>
                  </div>
                </div>
                <div className="absolute top-2 right-2 bg-white/90 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M10 16.5l6-4.5-6-4.5v9zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Countdown indicator */}
        {!isLoading && (images.length > 0 || videos.length > 0) && countdown > 0 && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-worksheet-purple transition-all duration-1000 ease-linear"
                style={{ width: `${(countdown / 30) * 100}%` }}
              />
            </div>
            <span className="whitespace-nowrap font-medium">{countdown}s</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
