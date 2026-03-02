import React, { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CalendarSettings } from '@/hooks/useCalendarSettings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, X, ArrowRightLeft, Info } from 'lucide-react';
import { format, parseISO, differenceInHours } from 'date-fns';
import { toast } from 'sonner';

interface Booking {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  status: string;
  confirmed_at: string | null;
  student_notes: string | null;
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

  const email = defaultEmail || '';

  // Auto-fetch when email available
  useEffect(() => {
    if (email.trim()) {
      fetchBookings();
    }
  }, [email, token]);

  const fetchBookings = useCallback(async () => {
    if (!email.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-student-bookings', {
        body: { token, email: email.trim() },
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
  }, [email, token]);

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

  const canCancel = (booking: Booking) => {
    const isPending = booking.status === 'booked' && !booking.confirmed_at;
    if (isPending) return true;
    if (!settings.min_cancellation_hours) return true;
    const lessonTime = parseISO(`${booking.slot_date}T${booking.start_time}`);
    return differenceInHours(lessonTime, new Date()) >= settings.min_cancellation_hours;
  };

  if (!email || bookings.length === 0 && !loading && !searched) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-4 w-4" /> Your Lessons
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && <p className="text-sm text-muted-foreground text-center py-4">Loading your lessons...</p>}

        {searched && bookings.length === 0 && !loading && (
          <p className="text-sm text-muted-foreground text-center py-4">No upcoming lessons found.</p>
        )}

        {bookings.length > 0 && (
          <div className="space-y-2">
            {bookings.map(booking => {
              const isPending = booking.status === 'booked' && !booking.confirmed_at;
              const isActiveReschedule = rescheduleBookingId === booking.id;

              return (
                <div key={booking.id} className={`border rounded-lg p-3 space-y-2 ${isActiveReschedule ? 'ring-2 ring-primary bg-primary/5' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{format(parseISO(booking.slot_date), 'EEE, MMM d, yyyy')}</span>
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm">{booking.start_time.slice(0, 5)} – {booking.end_time.slice(0, 5)}</span>
                    </div>
                    {isPending ? (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700">Pending</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-700">Confirmed</Badge>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {canCancel(booking) && (
                      <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => handleCancel(booking.id)}>
                        <X className="h-3 w-3 mr-1" /> Cancel
                      </Button>
                    )}
                    <Button
                      variant={isActiveReschedule ? 'default' : 'outline'}
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => handleRescheduleClick(booking.id)}
                    >
                      <ArrowRightLeft className="h-3 w-3 mr-1" /> Reschedule
                    </Button>
                  </div>

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
      </CardContent>
    </Card>
  );
}
