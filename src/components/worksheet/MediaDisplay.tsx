import React from 'react';

interface MediaDisplayProps {
  exercise: any;
}

export const MediaDisplay: React.FC<MediaDisplayProps> = ({ exercise }) => {
  const imageUrl = exercise.image_url || exercise.imageUrl;
  const photographer = exercise.photographer;
  const photographerUrl = exercise.photographer_url || exercise.photographerUrl;

  // Don't render if no image URL
  if (!imageUrl) {
    return null;
  }

  return (
    <div className="my-4 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
      <img 
        src={imageUrl} 
        alt={exercise.image_description || exercise.imageDescription || 'Exercise image'} 
        className="w-full h-auto"
        onError={(e) => {
          // Hide image if fails to load
          e.currentTarget.style.display = 'none';
          // Also hide the parent container
          const parent = e.currentTarget.closest('.my-4');
          if (parent) {
            (parent as HTMLElement).style.display = 'none';
          }
        }}
      />
      {photographer && (
        <div className="bg-gray-50 px-3 py-2 text-sm text-gray-600">
          Photo by{' '}
          {photographerUrl ? (
            <a 
              href={photographerUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-worksheet-purple hover:underline font-medium"
            >
              {photographer}
            </a>
          ) : (
            <span className="font-medium">{photographer}</span>
          )}{' '}
          on Unsplash
        </div>
      )}
    </div>
  );
};
