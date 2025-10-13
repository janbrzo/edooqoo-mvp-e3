import React from 'react';
import { ExternalLink } from 'lucide-react';
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
}

export default function MediaSection({ selectedImage, isDownloadUnlocked }: MediaSectionProps) {
  if (!selectedImage) return null;

  return (
    <div className="mb-8 bg-white border rounded-lg overflow-hidden shadow-sm p-6 relative">
      {!isDownloadUnlocked && <DemoWatermark />}
      
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        Lesson Media
      </h2>
      
      <div className="space-y-3">
        <div className="relative rounded-lg overflow-hidden border-2 border-gray-200 shadow-sm max-w-3xl mx-auto">
          <img
            src={selectedImage.url}
            alt={selectedImage.description || 'Lesson image'}
            className="w-full h-auto object-contain max-h-[400px] cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(selectedImage.url, '_blank')}
            title="Click to view full size"
          />
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
    </div>
  );
}
