import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MediaSuggestion {
  id: string;
  url: string;
  thumbnail: string;
  description: string;
  photographer: string;
  photographerUrl: string;
  downloadLocation: string;
}

interface MediaSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selectedMedia: MediaSuggestion) => void;
  mediaType: string;
  searchQuery: string;
}

export default function MediaSelectionModal({
  isOpen,
  onClose,
  onSelect,
  mediaType,
  searchQuery
}: MediaSelectionModalProps) {
  const [suggestions, setSuggestions] = useState<MediaSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [countdown, setCountdown] = useState(10);
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

  // Fetch media suggestions
  useEffect(() => {
    if (!isOpen) return;

    const fetchSuggestions = async () => {
      setIsLoading(true);
      setCountdown(10);
      setHasAutoSelected(false);

      try {
        console.log('Fetching media suggestions:', { mediaType, searchQuery });

        const { data, error } = await supabase.functions.invoke('fetch-media', {
          body: { mediaType, searchQuery }
        });

        if (error) {
          console.error('Error fetching media:', error);
          toast.error('Failed to load images. Please try again.');
          onClose();
          return;
        }

        if (data?.suggestions && data.suggestions.length > 0) {
          setSuggestions(data.suggestions);
        } else {
          console.warn('No suggestions returned');
          toast.error('No images found. Generating worksheet without media.');
          onClose();
        }
      } catch (err) {
        console.error('Error in fetchSuggestions:', err);
        toast.error('Failed to load images. Please try again.');
        onClose();
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [isOpen, mediaType, searchQuery, onClose]);

  // Countdown timer and auto-select
  useEffect(() => {
    if (!isOpen || isLoading || suggestions.length === 0 || hasAutoSelected) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Auto-select random image
          const randomIndex = Math.floor(Math.random() * suggestions.length);
          const selected = suggestions[randomIndex];
          console.log('Auto-selecting image:', selected.id);
          setHasAutoSelected(true);
          onSelect(selected);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isLoading, suggestions, onSelect, hasAutoSelected]);

  const handleImageClick = (suggestion: MediaSuggestion) => {
    console.log('User selected image:', suggestion.id);
    onSelect(suggestion);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-worksheet-purple">
            Select an Image for Your Worksheet
          </DialogTitle>
          <DialogDescription className="text-base">
            Choose an image that best fits your lesson. Click on any image to select it.
            {!isLoading && suggestions.length > 0 && (
              <span className="block mt-2 text-worksheet-purple font-semibold">
                Auto-selecting in {countdown} seconds...
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-worksheet-purple mb-4" />
            <p className="text-gray-600">Finding the perfect images for your lesson...</p>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-gray-600">No images found. Please try again.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 py-4">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                onClick={() => handleImageClick(suggestion)}
                className="relative group cursor-pointer rounded-lg overflow-hidden border-2 border-gray-200 hover:border-worksheet-purple transition-all duration-200 hover:shadow-lg"
              >
                <div className="aspect-video relative overflow-hidden bg-gray-100">
                  <img
                    src={suggestion.thumbnail}
                    alt={suggestion.description}
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white text-worksheet-purple px-4 py-2 rounded-lg font-semibold">
                      Select this image
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-white">
                  <p className="text-sm text-gray-700 line-clamp-2 mb-1">
                    {suggestion.description}
                  </p>
                  <p className="text-xs text-gray-500">
                    Photo by{' '}
                    <a
                      href={suggestion.photographerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-worksheet-purple hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {suggestion.photographer}
                    </a>
                    {' '}on Unsplash
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center text-xs text-gray-500 mt-4 pt-4 border-t">
          Images provided by{' '}
          <a
            href="https://unsplash.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-worksheet-purple hover:underline"
          >
            Unsplash
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
