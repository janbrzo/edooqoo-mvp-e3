import { useState } from 'react';
import { ChevronDown, ChevronUp, Eye, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StudentKnowledgeEntry, getCategoryMetadata, formatTagForDisplay } from '@/types/studentKnowledge';
import { cn } from '@/lib/utils';

interface StudentKnowledgeMiniListProps {
  entries: StudentKnowledgeEntry[];
  onViewEntry: (entry: StudentKnowledgeEntry) => void;
  isLoading?: boolean;
}

export const StudentKnowledgeMiniList = ({
  entries,
  onViewEntry,
  isLoading = false,
}: StudentKnowledgeMiniListProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (isLoading) {
    return (
      <Card className="fixed bottom-24 right-6 w-80 p-4 shadow-lg z-40 bg-background/95 backdrop-blur">
        <div className="flex items-center gap-2">
          <StickyNote className="h-4 w-4 animate-pulse" />
          <span className="text-sm text-muted-foreground">Loading notes...</span>
        </div>
      </Card>
    );
  }

  if (entries.length === 0) {
    return null;
  }

  const displayedEntries = isExpanded ? entries.slice(0, 5) : entries.slice(0, 3);

  return (
    <Card className="fixed bottom-24 right-6 w-80 shadow-lg z-40 bg-background/95 backdrop-blur border-amber-200">
      <div className="p-3 border-b bg-amber-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-amber-600" />
            <h3 className="text-sm font-semibold text-foreground">Recent Notes</h3>
            <Badge variant="secondary" className="text-xs">
              {entries.length}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 p-0"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <ScrollArea className={cn('transition-all', isExpanded ? 'h-[280px]' : 'h-[180px]')}>
        <div className="p-2 space-y-2">
          {displayedEntries.map((entry) => {
            const categoryMeta = getCategoryMetadata(entry.category);
            return (
              <Card
                key={entry.id}
                className="p-2 hover:bg-accent/50 transition-colors cursor-pointer border-border/50"
                onClick={() => onViewEntry(entry)}
              >
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span className="text-sm">{categoryMeta?.icon}</span>
                      <span className="text-xs font-medium text-muted-foreground truncate">
                        {categoryMeta?.label}
                      </span>
                    </div>
                    <Eye className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  </div>
                  <p className="text-xs text-foreground line-clamp-2 leading-relaxed">
                    {entry.content}
                  </p>
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {entry.tags.slice(0, 2).map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-[10px] px-1 py-0 h-4"
                        >
                          {formatTagForDisplay(tag)}
                        </Badge>
                      ))}
                      {entry.tags.length > 2 && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                          +{entry.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(entry.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </ScrollArea>

      {entries.length > 5 && isExpanded && (
        <div className="p-2 border-t bg-muted/30 text-center">
          <p className="text-xs text-muted-foreground">
            Showing 5 of {entries.length} notes
          </p>
        </div>
      )}
    </Card>
  );
};
