import { Clock, FileText, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';
import { DeleteWorksheetButton } from '@/components/DeleteWorksheetButton';
import { StudentSelector } from '@/components/StudentSelector';
import { WorksheetHomeworkList } from './WorksheetHomeworkList';
import type { HomeworkAssignment } from '@/hooks/useAllWorksheetHomework';

interface WorksheetCardWithHomeworkProps {
  worksheet: any;
  homework: HomeworkAssignment[];
  onOpen: (id: string) => void;
  onDelete: (id: string) => Promise<{ success: boolean; error?: string; }>;
  formatTitle: (data: any) => string;
  formatDescription: (data: any) => string;
  getStudentName: (studentId: string | null) => string | undefined;
}

export const WorksheetCardWithHomework = ({
  worksheet,
  homework,
  onOpen,
  onDelete,
  formatTitle,
  formatDescription,
  getStudentName,
}: WorksheetCardWithHomeworkProps) => {
  const [isHomeworkOpen, setIsHomeworkOpen] = useState(false);
  const homeworkCount = homework.length;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base mb-2 line-clamp-2">
              {formatTitle(worksheet.form_data)}
            </h3>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {formatDescription(worksheet.form_data)}
            </p>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {worksheet.student_id && (
                <Badge variant="outline" className="text-xs">
                  {getStudentName(worksheet.student_id)}
                </Badge>
              )}
              {worksheet.generation_time_seconds && (
                <Badge variant="secondary" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {worksheet.generation_time_seconds}s
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs">
                <FileText className="h-3 w-3 mr-1" />
                {new Date(worksheet.created_at).toLocaleDateString()}
              </Badge>
            </div>

            <div className="flex gap-2 mb-3">
              <Button 
                variant="default" 
                size="sm"
                onClick={() => onOpen(worksheet.id)}
              >
                Open
              </Button>
              <StudentSelector 
                worksheetId={worksheet.id}
                currentStudentId={worksheet.student_id}
              />
              <DeleteWorksheetButton 
                worksheetId={worksheet.id}
                worksheetTitle={formatTitle(worksheet.form_data)}
                onDelete={onDelete}
              />
            </div>

            {/* Homework Section */}
            {homeworkCount > 0 && (
              <Collapsible open={isHomeworkOpen} onOpenChange={setIsHomeworkOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between hover:bg-accent/50"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <BookOpen className="h-4 w-4 text-primary" />
                      Homework Assignments ({homeworkCount})
                    </span>
                    {isHomeworkOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <WorksheetHomeworkList homework={homework} />
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
