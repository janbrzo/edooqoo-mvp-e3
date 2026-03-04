import React, { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CalendarSettings } from '@/hooks/useCalendarSettings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Calendar, Clock, X, ArrowRightLeft, Info, FileText, History, Video } from 'lucide-react';
import { format, parseISO, differenceInHours, isBefore } from 'date-fns';
import { toast } from 'sonner';

interface Booking {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  status: string;
  confirmed_at: string | null;
  student_notes: string | null;
  worksheet_id?: string | null;
  share_token?: string | null;
  notes?: string | null;
  meeting_link?: string | null;
  reschedule_to?: { slot_date: string; start_time: string; end_time: string } | null;
  reschedule_from?: { slot_date: string; start_time: string; end_time: string } | null;
}

interface StudentBookingsSectionProps {
  settings: CalendarSettings;
  token: string;
  availableSlots: Array<{ id: string; slot_date: string; start_time: string; end_time: string }>;
  onBookingChanged: () => void;
  onRescheduleStart?: (bookingId: string) => void;
  rescheduleBookingId?: string | null;
  defaultEmail?: string;
}

export function StudentBookingsSection({ settings, token, availableSlots, onBookingChanged, onRescheduleStart, rescheduleBookingId, defaultEmail }: StudentBookingsSectionProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const [historyLogs, setHistoryLogs] = useState<Record<string, any[]>>({});
  const [showPast, setShowPast] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);
  const [cancelledBookings, setCancelledBookings] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const email = defaultEmail || '';

  useEffect(() => {
    if (email.trim()) {
      fetchBookings();
    }
  }, [email, token, showPast]);

  const fetchBookings = useCallback(async () => {
    if (!email.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-student-bookings', {
        body: { token, email: email.trim(), includePast: showPast },
      });
      if (error) throw error;
      setBookings(data?.bookings || []);
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      toast.error('Could not fetch bookings');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [email, token, showPast]);

  useEffect(() => {
    if (showCancelled && email.trim()) {
      supabase.functions.invoke('get-student-bookings', {
        body: { token, email: email.trim(), action: 'get_cancelled' },
      }).then(({ data }) => {
        setCancelledBookings(data?.cancelledBookings || []);
      }).catch(() => setCancelledBookings([]));
    }
  }, [showCancelled, email, token]);

  const handleCancel = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this lesson?')) return;
    try {
      const { error } = await supabase.functions.invoke('get-student-bookings', {
        body: { token, email: email.trim(), action: 'cancel', slotId: bookingId },
      });
      if (error) throw error;
      toast.success('Lesson cancelled');
      await fetchBookings();
      onBookingChanged();
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel');
    }
  };

  const handleRescheduleClick = (bookingId: string) => {
    if (onRescheduleStart) {
      onRescheduleStart(bookingId);
    }
  };

  const fetchLogs = async (slotId: string) => {
    try {
      const { data } = await supabase.functions.invoke('get-student-bookings', {
        body: { token, email: email.trim(), action: 'get_logs', slotId },
      });
      setHistoryLogs(prev => ({ ...prev, [slotId]: data?.logs || [] }));
    } catch (_) {}
  };

  const toggleHistory = (slotId: string) => {
    if (expandedHistory === slotId) {
      setExpandedHistory(null);
    } else {
      setExpandedHistory(slotId);
      if (!historyLogs[slotId]) fetchLogs(slotId);
    }
  };

  const canCancel = (booking: Booking) => {
    const isPending = booking.status === 'booked' && !booking.confirmed_at;
    if (isPending) return true;
    if (!settings.min_cancellation_hours) return true;
    const lessonTime = parseISO(`${booking.slot_date}T${booking.start_time}`);
    return differenceInHours(lessonTime, new Date()) >= settings.min_cancellation_hours;
  };

  if (!email || bookings.length === 0 && !loading && !searched) return null;

  // Filter bookings by status
  const filteredBookings = bookings.filter(b => {
    if (!statusFilter) return true;
    if (statusFilter === 'completed') return b.status === 'completed';
    if (statusFilter === 'no_show') return b.status === 'no_show';
    if (statusFilter === 'needs_review') return b.status === 'needs_review';
    return true;
  });

  const FILTERS = ['completed', 'no_show', 'needs_review'];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-4 w-4" /> Your Lessons
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Switch checked={showPast} onCheckedChange={setShowPast} id="show-past" />
              <Label htmlFor="show-past" className="text-xs cursor-pointer">Show past</Label>
            </div>
            <Button
              variant={showCancelled ? 'default' : 'outline'}
              size="sm" className="text-xs h-7"
              onClick={() => setShowCancelled(!showCancelled)}
            >
              {showCancelled ? 'Hide Cancelled' : 'Show Cancelled'}
            </Button>
          </div>
        </div>
        {/* Status filters */}
        <div className="flex gap-1 flex-wrap mt-2">
          {FILTERS.map(f => (
            <Button key={f} variant={statusFilter === f ? 'default' : 'outline'} size="sm" className="text-xs h-6 px-2"
              onClick={() => setStatusFilter(statusFilter === f ? null : f)}>
              {f.replace(/_/g, ' ')}
            </Button>
          ))}
          {statusFilter && (
            <Button variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={() => setStatusFilter(null)}>
              <X className="h-3 w-3 mr-1" /> Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && <p className="text-sm text-muted-foreground text-center py-4">Loading your lessons...</p>}

        {searched && filteredBookings.length === 0 && !loading && (
          <p className="text-sm text-muted-foreground text-center py-4">No lessons found.</p>
        )}

        {filteredBookings.length > 0 && (
          <div className="space-y-2">
            {filteredBookings.map(booking => {
              const isPending = booking.status === 'booked' && !booking.confirmed_at;
              const isActiveReschedule = rescheduleBookingId === booking.id;
              const isPast = isBefore(parseISO(`${booking.slot_date}T${booking.end_time}`), new Date());
              const canCancelResult = canCancel(booking);

              return (
                <div key={booking.id} className={`border rounded-lg p-3 space-y-2 ${isActiveReschedule ? 'ring-2 ring-primary bg-primary/5' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{format(parseISO(booking.slot_date), 'EEE, MMM d, yyyy')}</span>
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm">{booking.start_time.slice(0, 5)} – {booking.end_time.slice(0, 5)}</span>
                    </div>
                    {/* Multiple status badges with tooltips (Problem 9B) */}
                    <div className="flex gap-1 flex-wrap">
                      {booking.confirmed_at && !isPending && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-700" title="Your lesson is confirmed and scheduled">Confirmed</Badge>
                      )}
                      {isPending && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700" title="Waiting for teacher to confirm your booking">Pending</Badge>
                      )}
                      {booking.status === 'completed' && (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700" title="This lesson has been completed">✓ Completed</Badge>
                      )}
                      {booking.status === 'no_show' && (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-700" title="You were marked as absent for this lesson">NS No Show</Badge>
                      )}
                      {booking.status === 'needs_review' && (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-700" title="Teacher hasn't reviewed this lesson yet">? Needs Review</Badge>
                      )}
                    </div>
                  </div>

                  {/* Notes from teacher */}
                  {booking.notes && (
                    <p className="text-xs text-muted-foreground">{booking.notes}</p>
                  )}

                  {/* Reschedule info */}
                  {booking.reschedule_to && (
                    <div className="flex items-start gap-1 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 rounded px-2 py-1">
                      <ArrowRightLeft className="h-3 w-3 mt-0.5 shrink-0" />
                      <span>You requested to reschedule this to {booking.reschedule_to.slot_date} {booking.reschedule_to.start_time.slice(0,5)}–{booking.reschedule_to.end_time.slice(0,5)}</span>
                    </div>
                  )}
                  {booking.reschedule_from && (
                    <div className="flex items-start gap-1 text-xs text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400 rounded px-2 py-1">
                      <ArrowRightLeft className="h-3 w-3 mt-0.5 shrink-0" />
                      <span>This is a reschedule from {booking.reschedule_from.slot_date} {booking.reschedule_from.start_time.slice(0,5)}–{booking.reschedule_from.end_time.slice(0,5)}</span>
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap items-center">
                    {canCancelResult && !isPast && (
                      <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => handleCancel(booking.id)}>
                        <X className="h-3 w-3 mr-1" /> Cancel
                      </Button>
                    )}
                    {!canCancelResult && !isPast && booking.status === 'booked' && (
                      <span className="text-xs text-muted-foreground">
                        Cancellation window closed ({settings.min_cancellation_hours}h before lesson)
                      </span>
                    )}
                    {!isPast && (
                      <Button
                        variant={isActiveReschedule ? 'default' : 'outline'}
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => handleRescheduleClick(booking.id)}
                      >
                        <ArrowRightLeft className="h-3 w-3 mr-1" /> Reschedule
                      </Button>
                    )}
                    {booking.share_token && (
                      <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => window.open(`/shared/${booking.share_token}`, '_blank')}>
                        <FileText className="h-3 w-3 mr-1" /> Open Worksheet
                      </Button>
                    )}
                    {booking.meeting_link && (
                      <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => window.open(booking.meeting_link!, '_blank')}>
                        <Video className="h-3 w-3 mr-1" /> Join Meeting
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground" onClick={() => toggleHistory(booking.id)}>
                      <History className="h-3 w-3 mr-1" /> History
                    </Button>
                  </div>

                  {/* History logs — full details (Problem 8D) */}
                  {expandedHistory === booking.id && (
                    <div className="border-t pt-2 space-y-1">
                      {!historyLogs[booking.id] ? (
                        <p className="text-xs text-muted-foreground">Loading...</p>
                      ) : historyLogs[booking.id].length === 0 ? (
                        <p className="text-xs text-muted-foreground">No history</p>
                      ) : (
                        historyLogs[booking.id].map((log: any, i: number) => (
                          <div key={i} className="text-xs border-l-2 border-border pl-2 py-0.5">
                            <span className="font-medium">{log.action.replace(/_/g, ' ')}</span>
                            <span className="text-muted-foreground ml-1">by {log.actor}</span>
                            <span className="text-muted-foreground ml-1">{format(new Date(log.created_at), 'MMM d HH:mm')}</span>
                            {log.details?.student_name && <span className="text-muted-foreground"> — {log.details.student_name}</span>}
                            {log.details?.slot_date && <span className="text-muted-foreground"> — {log.details.slot_date}</span>}
                            {log.details?.start_time && <span className="text-muted-foreground"> at {String(log.details.start_time).slice(0, 5)}</span>}
                            {log.details?.old_status && <span className="text-muted-foreground"> ({log.details.old_status} → {log.details.new_status})</span>}
                            {log.details?.previous_student && <span className="text-muted-foreground"> (was: {log.details.previous_student})</span>}
                            {log.details?.previous_time && <span className="text-muted-foreground"> (was: {log.details.previous_time})</span>}
                            {log.details?.student_email && <span className="text-muted-foreground"> ({log.details.student_email})</span>}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {isActiveReschedule && (
                    <div className="border-t pt-2 flex items-start gap-2 text-xs text-muted-foreground">
                      <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <p>Click on an available slot in the calendar above to reschedule this lesson.</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Cancelled bookings section (Problem 9C) */}
        {showCancelled && cancelledBookings.length > 0 && (
          <div className="space-y-2 border-t pt-4">
            <h3 className="text-sm font-medium text-muted-foreground">Cancelled Lessons</h3>
            {cancelledBookings.map((cb: any) => (
              <div key={cb.id} className="border rounded-lg p-3 opacity-60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{cb.slot_date}</span>
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm">{cb.start_time?.slice(0, 5)} – {cb.end_time?.slice(0, 5)}</span>
                  </div>
                  <Badge variant="outline" className={cb.cancelled_by === 'student' ? 'bg-amber-50 text-amber-700 border-amber-300' : 'bg-blue-50 text-blue-700 border-blue-300'}
                    title={cb.cancelled_by === 'student' ? 'You cancelled this lesson' : 'Teacher cancelled this lesson'}>
                    {cb.cancelled_by === 'student' ? 'SC' : 'TC'} Cancelled
                  </Badge>
                </div>
                {cb.cancellation_reason && <p className="text-xs text-muted-foreground mt-1">{cb.cancellation_reason}</p>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
