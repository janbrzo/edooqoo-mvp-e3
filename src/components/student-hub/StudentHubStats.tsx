import React from 'react';
import { Card } from '@/components/ui/card';
import { BookOpen, ClipboardList, FileText, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface StatsProps {
  stats: {
    totalLessons: number;
    completedLessons: number;
    upcomingLessons: number;
    activeHomeworks: number;
    flashcardSetsCount: number;
    totalFlashcards: number;
    masteredFlashcards: number;
  };
  nextLesson?: {
    slot_date: string;
    start_time: string;
  } | null;
}

export function StudentHubStats({ stats, nextLesson }: StatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card className="p-4 space-y-1">
        <div className="flex items-center gap-2 text-muted-foreground">
          <BookOpen className="h-4 w-4" />
          <span className="text-xs font-medium">Flashcards</span>
        </div>
        <p className="text-2xl font-bold">{stats.flashcardSetsCount}</p>
        <p className="text-xs text-muted-foreground">
          {stats.masteredFlashcards}/{stats.totalFlashcards} mastered
        </p>
      </Card>

      <Card className="p-4 space-y-1">
        <div className="flex items-center gap-2 text-muted-foreground">
          <ClipboardList className="h-4 w-4" />
          <span className="text-xs font-medium">Homework</span>
        </div>
        <p className="text-2xl font-bold">{stats.activeHomeworks}</p>
        <p className="text-xs text-muted-foreground">active assignments</p>
      </Card>

      <Card className="p-4 space-y-1">
        <div className="flex items-center gap-2 text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span className="text-xs font-medium">Lessons</span>
        </div>
        <p className="text-2xl font-bold">{stats.completedLessons}</p>
        <p className="text-xs text-muted-foreground">completed of {stats.totalLessons}</p>
      </Card>

      <Card className="p-4 space-y-1">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span className="text-xs font-medium">Next Lesson</span>
        </div>
        {nextLesson ? (
          <>
            <p className="text-lg font-bold">{format(parseISO(nextLesson.slot_date), 'MMM d')}</p>
            <p className="text-xs text-muted-foreground">at {nextLesson.start_time.slice(0, 5)}</p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">None scheduled</p>
        )}
      </Card>
    </div>
  );
}
