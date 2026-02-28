import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { usePublicBooking } from '@/hooks/usePublicBooking';
import { CalendarSlot } from '@/hooks/useCalendarSlots';
import { StudentBookingsSection } from '@/components/calendar/StudentBookingsSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { ChevronLeft, ChevronRight, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { format, addDays, parseISO, isToday, isBefore, addWeeks, isSameDay } from 'date-fns';

const PublicBookingPage = () => {
  const { token } = useParams<{ token: string }>();
  const { settings, slots, loading, error, weekStart, weekEnd, bookSlot, navigateWeek, getSlotsForDay, refetchSlots } = usePublicBooking(token);

  const [selectedSlot, setSelectedSlot] = useState<CalendarSlot | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [booking, setBooking] = useState(false);
  const [bookWeekly, setBookWeekly] = useState(false);
  const [untilDate, setUntilDate] = useState('');

  // Calculate how many weekly slots are available for recurring booking
  const recurringInfo = useMemo(() => {
    if (!selectedSlot || !bookWeekly || !untilDate) return { count: 0, slotIds: [] as string[] };
    
    const slotDayOfWeek = parseISO(selectedSlot.slot_date).getDay();
    const slotTime = selectedSlot.start_time.slice(0, 5);
    const endDate = parseISO(untilDate);
    
    // Find all available slots matching same weekday + time
    const matchingIds: string[] = [];
    for (const slot of slots) {
      const slotDate = parseISO(slot.slot_date);
      if (
        slotDate.getDay() === slotDayOfWeek &&
        slot.start_time.slice(0, 5) === slotTime &&
        !isBefore(endDate, slotDate) &&
        slot.id !== selectedSlot.id
      ) {
        matchingIds.push(slot.id);
      }
    }
    
    return { count: matchingIds.length + 1, slotIds: [selectedSlot.id, ...matchingIds] };
  }, [selectedSlot, bookWeekly, untilDate, slots]);

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

    if (bookWeekly && untilDate && recurringInfo.slotIds.length > 0) {
      // Book all matching slots
      let successCount = 0;
      for (const slotId of recurringInfo.slotIds) {
        const ok = await bookSlot(slotId, name.trim(), email.trim());
        if (ok) successCount++;
      }
      setBooking(false);
      setSelectedSlot(null);
      setName('');
      setEmail('');
      setBookWeekly(false);
      setUntilDate('');
    } else {
      const success = await bookSlot(selectedSlot.id, name.trim(), email.trim());
      setBooking(false);
      if (success) {
        setSelectedSlot(null);
        setName('');
        setEmail('');
        setBookWeekly(false);
        setUntilDate('');
      }
    }
  };

  const selectedDayName = selectedSlot ? format(parseISO(selectedSlot.slot_date), 'EEEE') : '';
  const selectedTime = selectedSlot ? selectedSlot.start_time.slice(0, 5) : '';

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

        {/* Student bookings portal */}
        {settings && token && (
          <StudentBookingsSection
            settings={settings}
            token={token}
            availableSlots={slots.map(s => ({ id: s.id, slot_date: s.slot_date, start_time: s.start_time, end_time: s.end_time }))}
            onBookingChanged={refetchSlots}
          />
        )}
      </div>

      {/* Booking Modal */}
      <Dialog open={!!selectedSlot} onOpenChange={open => { if (!open) { setSelectedSlot(null); setBookWeekly(false); setUntilDate(''); } }}>
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

              {/* Recurring booking option */}
              <div className="border rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="book-weekly" className="text-sm font-medium cursor-pointer">Book weekly</Label>
                  <Switch id="book-weekly" checked={bookWeekly} onCheckedChange={setBookWeekly} />
                </div>

                {bookWeekly && (
                  <>
                    <div>
                      <Label className="text-xs text-muted-foreground">Until date</Label>
                      <Input
                        type="date"
                        value={untilDate}
                        onChange={e => setUntilDate(e.target.value)}
                        min={format(addWeeks(parseISO(selectedSlot.slot_date), 1), 'yyyy-MM-dd')}
                      />
                    </div>

                    {untilDate && (
                      <div className="flex items-start gap-2 p-2 rounded bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
                        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                        <p className="text-xs text-amber-800 dark:text-amber-300">
                          You are booking a weekly recurring lesson every <strong>{selectedDayName}</strong> at <strong>{selectedTime}</strong> until <strong>{format(parseISO(untilDate), 'MMM d, yyyy')}</strong>.
                          {recurringInfo.count > 0 && (
                            <> This will book <strong>{recurringInfo.count}</strong> lesson{recurringInfo.count !== 1 ? 's' : ''} (only available slots).</>
                          )}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setSelectedSlot(null); setBookWeekly(false); setUntilDate(''); }}>Cancel</Button>
            <Button onClick={handleBook} disabled={booking || !name.trim() || !email.trim() || (bookWeekly && !untilDate)}>
              {booking ? 'Booking...' : bookWeekly ? `Book ${recurringInfo.count} Lessons` : 'Book Lesson'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PublicBookingPage;
