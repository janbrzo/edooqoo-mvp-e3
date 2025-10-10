import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Image as ImageIcon } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export interface SelectedImage {
  id: string;
  url: string;
  description: string;
  photographer: string;
  photographerUrl: string;
}

interface MediaSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (image: SelectedImage) => void;
  lessonTopic: string;
}

export const MediaSelectionModal: React.FC<MediaSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectImage,
  lessonTopic
}) => {
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);
  const [error, setError] = useState<string | null>(null);

  // Fetch images from Unsplash when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchImages = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const UNSPLASH_ACCESS_KEY = 'bM02r2IEeq0vNJKEyQ5G4zT22yLMYTxXr-gqFG2Qhok';
        
        // Use lessonTopic as search query, fallback to "education"
        const searchQuery = lessonTopic || 'education';
        
        const response = await fetch(
          `https://api.unsplash.com/photos/random?query=${encodeURIComponent(searchQuery)}&count=4&orientation=landscape`,
          {
            headers: {
              Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch images from Unsplash');
        }

        const data = await response.json();
        
        const formattedImages: SelectedImage[] = data.map((img: any) => ({
          id: img.id,
          url: img.urls.regular,
          description: img.description || img.alt_description || searchQuery,
          photographer: img.user.name,
          photographerUrl: img.user.links.html
        }));

        setImages(formattedImages);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching images:', err);
        setError('Failed to load images. Please try again.');
        setIsLoading(false);
      }
    };

    fetchImages();
  }, [isOpen, lessonTopic]);

  // Countdown timer with auto-select
  useEffect(() => {
    if (!isOpen || isLoading || images.length === 0) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Auto-select first image when countdown reaches 0
          if (!selectedImageId && images.length > 0) {
            handleImageSelect(images[0]);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isLoading, images, selectedImageId]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setImages([]);
      setIsLoading(true);
      setSelectedImageId(null);
      setCountdown(30);
      setError(null);
    }
  }, [isOpen]);

  const handleImageSelect = (image: SelectedImage) => {
    setSelectedImageId(image.id);
    onSelectImage(image);
    onClose();
  };

  const progressValue = ((30 - countdown) / 30) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500">
            Select an Image for Your Worksheet
          </DialogTitle>
          <DialogDescription>
            Choose an image that best matches your lesson topic: <span className="font-semibold text-foreground">"{lessonTopic}"</span>
          </DialogDescription>
        </DialogHeader>

        {/* Countdown Progress Bar */}
        {!isLoading && images.length > 0 && countdown > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Auto-selecting first image in:</span>
              <span className="font-semibold text-foreground">{countdown}s</span>
            </div>
            <Progress value={progressValue} className="h-2" />
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-worksheet-purple" />
            <p className="text-muted-foreground">Finding perfect images for your lesson...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <ImageIcon className="w-12 h-12 text-destructive" />
            <p className="text-destructive">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </div>
        )}

        {/* Images Grid */}
        {!isLoading && !error && images.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            {images.map((image, index) => (
              <button
                key={image.id}
                onClick={() => handleImageSelect(image)}
                className="group relative overflow-hidden rounded-lg border-2 border-gray-200 hover:border-worksheet-purple transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-worksheet-purple focus:ring-offset-2"
              >
                <div className="aspect-video relative">
                  <img
                    src={image.url}
                    alt={image.description}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                    <span className="text-white font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      Select Image
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 group-hover:bg-worksheet-purpleLight transition-colors duration-300">
                  <p className="text-xs text-gray-600 group-hover:text-gray-800 truncate">
                    Photo by <span className="font-medium">{image.photographer}</span>
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Helper Text */}
        {!isLoading && !error && images.length > 0 && (
          <p className="text-xs text-center text-muted-foreground mt-4">
            Click on any image to use it in your worksheet exercises
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};
