import { BookOpen, Copy, ExternalLink, Calendar, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { HomeworkAssignment } from '@/hooks/useAllWorksheetHomework';

interface WorksheetHomeworkListProps {
  homework: HomeworkAssignment[];
}

export const WorksheetHomeworkList = ({ homework }: WorksheetHomeworkListProps) => {
  const handleCopyLink = (shareToken: string | null, title: string) => {
    if (!shareToken) {
      toast.error('Share link not available');
      return;
    }
    const url = `${window.location.origin}/homework/${shareToken}`;
    navigator.clipboard.writeText(url);
    toast.success(`Link copied for "${title}"`);
  };

  const handleOpenHomework = (shareToken: string | null) => {
    if (!shareToken) {
      toast.error('Share link not available');
      return;
    }
    window.open(`/homework/${shareToken}`, '_blank');
  };

  if (homework.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic py-2">
        No homework assignments yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {homework.map((hw) => (
        <div
          key={hw.id}
          className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border bg-card/50 hover:bg-card/80 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">
                  {hw.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  Student: {hw.student_name}
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {hw.deadline && (
                <Badge variant="outline" className="text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  Due: {format(new Date(hw.deadline), 'MMM dd, yyyy')}
                </Badge>
              )}
              {hw.view_count > 0 && (
                <Badge variant="secondary" className="text-xs">
                  <Eye className="h-3 w-3 mr-1" />
                  Viewed {hw.view_count}x
                </Badge>
              )}
              {hw.viewed_at && (
                <Badge variant="secondary" className="text-xs">
                  Last viewed: {format(new Date(hw.viewed_at), 'MMM dd')}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopyLink(hw.share_token, hw.title)}
              title="Copy homework link"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenHomework(hw.share_token)}
              title="Open homework"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
