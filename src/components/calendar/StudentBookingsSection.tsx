import React, { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CalendarSettings } from '@/hooks/useCalendarSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Search, X, ArrowRightLeft } from 'lucide-react';
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
}

export function StudentBookingsSection({ settings, token, availableSlots, onBookingChanged }: StudentBookingsSectionProps) {
  const [email, setEmail] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [rescheduleSlotId, setRescheduleSlotId] = useState<string | null>(null);
  const [selectedNewSlotId, setSelectedNewSlotId] = useState<string | null>(null);

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

  const handleReschedule = async (oldSlotId: string, newSlotId: string) => {
    try {
      const { error } = await supabase.functions.invoke('get-student-bookings', {
        body: { token, email: email.trim(), action: 'reschedule', slotId: oldSlotId, newSlotId },
      });
      if (error) throw error;
      toast.success(settings.allow_student_reschedule ? 'Lesson rescheduled!' : 'Reschedule request sent to teacher');
      setRescheduleSlotId(null);
      setSelectedNewSlotId(null);
      await fetchBookings();
      onBookingChanged();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reschedule');
    }
  };

  const canCancel = (booking: Booking) => {
    if (!settings.min_cancellation_hours) return true;
    const lessonTime = parseISO(`${booking.slot_date}T${booking.start_time}`);
    return differenceInHours(lessonTime, new Date()) >= settings.min_cancellation_hours;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Search className="h-4 w-4" /> Already have a booking?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground">Enter your email to check bookings</Label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              onKeyDown={e => e.key === 'Enter' && fetchBookings()}
            />
          </div>
          <Button onClick={fetchBookings} disabled={loading || !email.trim()} className="self-end">
            {loading ? 'Checking...' : 'Check'}
          </Button>
        </div>

        {searched && bookings.length === 0 && !loading && (
          <p className="text-sm text-muted-foreground text-center py-4">No bookings found for this email.</p>
        )}

        {bookings.length > 0 && (
          <div className="space-y-2">
            {bookings.map(booking => {
              const isPending = booking.status === 'booked' && !booking.confirmed_at;
              const isRescheduling = rescheduleSlotId === booking.id;

              return (
                <div key={booking.id} className="border rounded-lg p-3 space-y-2">
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
                    <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => setRescheduleSlotId(isRescheduling ? null : booking.id)}>
                      <ArrowRightLeft className="h-3 w-3 mr-1" /> Reschedule
                    </Button>
                  </div>

                  {isRescheduling && (
                    <div className="border-t pt-2 space-y-2">
                      <p className="text-xs text-muted-foreground">Select a new time slot:</p>
                      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                        {availableSlots.filter(s => s.id !== booking.id).map(slot => (
                          <Button
                            key={slot.id}
                            variant={selectedNewSlotId === slot.id ? 'default' : 'outline'}
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => setSelectedNewSlotId(slot.id)}
                          >
                            {format(parseISO(slot.slot_date), 'MMM d')} {slot.start_time.slice(0, 5)}
                          </Button>
                        ))}
                        {availableSlots.filter(s => s.id !== booking.id).length === 0 && (
                          <p className="text-xs text-muted-foreground">No available slots to reschedule to.</p>
                        )}
                      </div>
                      {selectedNewSlotId && (
                        <Button size="sm" className="text-xs" onClick={() => handleReschedule(booking.id, selectedNewSlotId)}>
                          {settings.allow_student_reschedule ? 'Confirm Reschedule' : 'Request Reschedule'}
                        </Button>
                      )}
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
