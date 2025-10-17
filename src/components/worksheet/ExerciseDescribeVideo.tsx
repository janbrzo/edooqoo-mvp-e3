import React from 'react';
import { Video } from 'lucide-react';

interface ExerciseDescribeVideoProps {
  exercise: {
    title: string;
    content: string;
    video_url?: string;
    video_title?: string;
    channel_title?: string;
  };
}

export default function ExerciseDescribeVideo({ exercise }: ExerciseDescribeVideoProps) {
  return (
    <div className="space-y-4">
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
        <div className="flex items-center gap-2 mb-2">
          <Video className="h-5 w-5 text-red-600" />
          <p className="font-medium text-red-800">Video-Based Exercise</p>
        </div>
        <p className="text-sm text-red-700">
          Watch the video in the "Lesson Media" section above and complete this exercise.
        </p>
      </div>
      
      <div className="prose max-w-none">
        <p className="whitespace-pre-line leading-snug">{exercise.content}</p>
      </div>
    </div>
  );
}
