import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bell, Calendar, X as XIcon } from 'lucide-react';
import { useCalendarNotifications, CalendarNotification } from '@/hooks/useCalendarNotifications';
import { formatDistanceToNow } from 'date-fns';

interface CalendarNotificationBellProps {
  teacherId?: string;
}

export function CalendarNotificationBell({ teacherId }: CalendarNotificationBellProps) {
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
            notifications.map(n => (
              <div key={n.id} className={`px-3 py-2 border-b border-border last:border-b-0 ${!n.is_read ? 'bg-primary/5' : ''}`}>
                <div className="flex items-start gap-2">
                  <Calendar className="h-3.5 w-3.5 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs">{n.message}</p>
                    {n.student_name && <p className="text-xs text-muted-foreground">Student: {n.student_name}</p>}
                    <p className="text-[10px] text-muted-foreground mt-0.5">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
