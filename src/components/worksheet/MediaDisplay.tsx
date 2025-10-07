import React from 'react';
import { Loader2 } from 'lucide-react';

interface MediaDisplayProps {
  mediaUrl?: string;
  mediaDescription?: string;
  mediaPhotographer?: string;
  mediaPhotographerUrl?: string;
  isPending?: boolean;
  className?: string;
}

export default function MediaDisplay({
  mediaUrl,
  mediaDescription,
  mediaPhotographer,
  mediaPhotographerUrl,
  isPending = false,
  className = ''
}: MediaDisplayProps) {
  if (isPending) {
    return (
      <div className={`bg-gray-100 rounded-lg p-8 flex flex-col items-center justify-center ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-worksheet-purple mb-3" />
        <p className="text-gray-600 text-sm">Loading image...</p>
        <p className="text-gray-500 text-xs mt-1">The exercise content will appear shortly</p>
      </div>
    );
  }

  if (!mediaUrl) {
    return null;
  }

  return (
    <div className={`mb-4 ${className}`}>
      <div className="relative rounded-lg overflow-hidden border border-gray-200 shadow-sm">
        <img
          src={mediaUrl}
          alt={mediaDescription || 'Exercise image'}
          className="w-full h-auto object-cover"
          loading="lazy"
        />
        {mediaPhotographer && (
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-2">
            Photo by{' '}
            {mediaPhotographerUrl ? (
              <a
                href={mediaPhotographerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-gray-300"
              >
                {mediaPhotographer}
              </a>
            ) : (
              mediaPhotographer
            )}
            {' '}on Unsplash
          </div>
        )}
      </div>
      {mediaDescription && (
        <p className="text-sm text-gray-600 mt-2 italic">
          {mediaDescription}
        </p>
      )}
    </div>
  );
}
