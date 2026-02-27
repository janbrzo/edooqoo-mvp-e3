import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CalendarNotification {
  id: string;
  teacher_id: string;
  notification_type: string;
  message: string;
  slot_id: string | null;
  student_name: string | null;
  is_read: boolean;
  created_at: string;
}

export function useCalendarNotifications(teacherId?: string) {
  const [notifications, setNotifications] = useState<CalendarNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!teacherId) return;
    try {
      const { data, error } = await supabase
        .from('calendar_notifications')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      const items = (data || []) as unknown as CalendarNotification[];
      setNotifications(items);
      setUnreadCount(items.filter(n => !n.is_read).length);
    } catch (err) {
      console.error('Error fetching calendar notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!teacherId) return;
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [teacherId, fetchNotifications]);

  const markAllRead = useCallback(async () => {
    if (!teacherId) return;
    const unread = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unread.length === 0) return;
    await supabase
      .from('calendar_notifications')
      .update({ is_read: true } as any)
      .eq('teacher_id', teacherId)
      .eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, [teacherId, notifications]);

  return { notifications, unreadCount, loading, markAllRead, refetch: fetchNotifications };
}
