import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bell, Calendar, UserPlus, CheckCircle2 } from 'lucide-react';
import { useCalendarNotifications, CalendarNotification } from '@/hooks/useCalendarNotifications';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface CalendarNotificationBellProps {
  teacherId?: string;
  students?: Array<{ id: string; name: string; student_email?: string | null }>;
  onNotificationClick?: (notification: CalendarNotification) => void;
  onAddStudentClick?: (name: string, email: string) => void;
}

export function CalendarNotificationBell({ teacherId, students, onNotificationClick, onAddStudentClick }: CalendarNotificationBellProps) {
  const { notifications, unreadCount, markAllRead } = useCalendarNotifications(teacherId);

  return (
    <Popover onOpenChange={(open) => { if (open) markAllRead(); }}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 relative">
          <Bell className="h-3.5 w-3.5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1.5 -right-1.5 h-4 min-w-4 p-0 flex items-center justify-center text-[10px] bg-destructive text-destructive-foreground">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="px-3 py-2 border-b border-border">
          <span className="text-sm font-medium">Calendar Notifications</span>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">No notifications yet</div>
          ) : (
            notifications.map(n => {
              const metadata = n.metadata || {};
              const isNewStudent = n.notification_type === 'new_student';
              const isResolved = (n as any).is_resolved;
              
              // Check if student email from metadata already exists in students list
              const studentAlreadyAdded = isNewStudent && students?.some(s => 
                s.student_email && metadata.student_email && 
                s.student_email.toLowerCase() === metadata.student_email.toLowerCase()
              );

              return (
                <div
                  key={n.id}
                  className={cn(
                    'px-3 py-2 border-b border-border last:border-b-0 cursor-pointer hover:bg-muted/50 transition-colors',
                    !n.is_read && 'bg-primary/5',
                    isResolved && 'opacity-60'
                  )}
                  onClick={() => onNotificationClick?.(n)}
                >
                  <div className="flex items-start gap-2">
                    <Calendar className="h-3.5 w-3.5 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs">{n.message}</p>
                      {n.student_name && <p className="text-xs text-muted-foreground">Student: {n.student_name}</p>}
                      <p className="text-[10px] text-muted-foreground mt-0.5">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
                      
                      {/* Resolved badge */}
                      {isResolved && (
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-green-600 dark:text-green-400">
                          <CheckCircle2 className="h-3 w-3" /> Done
                        </div>
                      )}

                      {/* New student — Add Student or "Already added" */}
                      {isNewStudent && !isResolved && (
                        <div className="mt-1.5">
                          {studentAlreadyAdded ? (
                            <p className="text-[10px] text-green-600 dark:text-green-400 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Student added
                            </p>
                          ) : (
                            <>
                              <p className="text-[10px] text-amber-600 dark:text-amber-400">This student is not in your list yet.</p>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-[10px] mt-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const email = metadata.student_email || '';
                                  const name = metadata.student_name_raw || n.student_name || '';
                                  onAddStudentClick?.(name, email);
                                }}
                              >
                                <UserPlus className="h-3 w-3 mr-1" /> Add Student
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
