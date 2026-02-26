import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { usePublicBooking } from '@/hooks/usePublicBooking';
import { CalendarSlot } from '@/hooks/useCalendarSlots';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';
import { format, addDays, parseISO, isToday, isBefore } from 'date-fns';

const PublicBookingPage = () => {
  const { token } = useParams<{ token: string }>();
  const { settings, slots, loading, error, weekStart, weekEnd, bookSlot, navigateWeek, getSlotsForDay } = usePublicBooking(token);

  const [selectedSlot, setSelectedSlot] = useState<CalendarSlot | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [booking, setBooking] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading calendar...</p>
      </div>
    );
  }

  if (error || !settings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive font-medium">{error || 'Calendar not available.'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = new Date();

  const handleBook = async () => {
    if (!selectedSlot || !name.trim() || !email.trim()) return;
    setBooking(true);
    const success = await bookSlot(selectedSlot.id, name.trim(), email.trim());
    setBooking(false);
    if (success) {
      setSelectedSlot(null);
      setName('');
      setEmail('');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Book a Lesson</h1>
          <p className="text-muted-foreground">Select an available time slot below</p>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigateWeek('today')}>Today</Button>
          <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium ml-2">
            {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d, yyyy')}
          </span>
        </div>

        {/* Week grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {days.map(date => {
            const daySlots = getSlotsForDay(date);
            const isPast = isBefore(date, today) && !isToday(date);

            return (
              <Card key={date.toISOString()} className={`${isPast ? 'opacity-50' : ''} ${isToday(date) ? 'ring-2 ring-primary' : ''}`}>
                <CardHeader className="p-3 pb-1">
                  <CardTitle className="text-xs font-medium text-center">
                    {format(date, 'EEE')}
                    <br />
                    <span className="text-lg">{format(date, 'd')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 space-y-1">
                  {daySlots.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-2">No slots</p>
                  ) : (
                    daySlots.map(slot => (
                      <Button
                        key={slot.id}
                        variant="outline"
                        size="sm"
                        className="w-full text-xs h-auto py-1.5 border-green-300 bg-green-50 hover:bg-green-100 text-green-800 dark:border-green-700 dark:bg-green-950 dark:text-green-300"
                        onClick={() => !isPast && setSelectedSlot(slot)}
                        disabled={isPast}
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {slot.start_time.slice(0, 5)}
                      </Button>
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Booking Modal */}
      <Dialog open={!!selectedSlot} onOpenChange={open => { if (!open) setSelectedSlot(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" /> Confirm Booking
            </DialogTitle>
          </DialogHeader>

          {selectedSlot && (
            <div className="space-y-4">
              <div className="text-center p-3 rounded-lg bg-muted">
                <p className="font-medium">{format(parseISO(selectedSlot.slot_date), 'EEEE, MMMM d, yyyy')}</p>
                <p className="text-lg font-bold">{selectedSlot.start_time.slice(0, 5)} – {selectedSlot.end_time.slice(0, 5)}</p>
              </div>

              <div>
                <Label>Your Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" />
              </div>
              <div>
                <Label>Your Email</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="john@example.com" />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedSlot(null)}>Cancel</Button>
            <Button onClick={handleBook} disabled={booking || !name.trim() || !email.trim()}>
              {booking ? 'Booking...' : 'Book Lesson'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PublicBookingPage;
