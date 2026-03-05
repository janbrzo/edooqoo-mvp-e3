import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { usePublicBooking } from '@/hooks/usePublicBooking';
import { useCalendarVacations } from '@/hooks/useCalendarVacations';
import { CalendarSlot } from '@/hooks/useCalendarSlots';
import { StudentBookingsSection } from '@/components/calendar/StudentBookingsSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { ChevronLeft, ChevronRight, Calendar, Clock, AlertTriangle, Palmtree, Globe, X } from 'lucide-react';
import { format, addDays, parseISO, isToday, isBefore, addWeeks, isSameDay } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { toStudentLocalTimeRange, getStudentTimeZone } from '@/utils/timezoneUtils';
import { cn } from '@/lib/utils';

const EMAIL_STORAGE_KEY = 'book_student_email';
const NAME_STORAGE_KEY = 'book_student_name';
const TTL_DAYS = 7;

function getSavedValue(key: string): string | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { value, expiresAt } = JSON.parse(raw);
    if (new Date(expiresAt) < new Date()) { localStorage.removeItem(key); return null; }
    return value;
  } catch { return null; }
}

function saveValue(key: string, value: string) {
  const expiresAt = new Date(Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  localStorage.setItem(key, JSON.stringify({ value, expiresAt }));
}

const PublicBookingPage = () => {
  const { token } = useParams<{ token: string }>();
  const { settings, slots, loading, error, weekStart, weekEnd, bookSlot, navigateWeek, getSlotsForDay, refetchSlots } = usePublicBooking(token);

  const [selectedSlot, setSelectedSlot] = useState<CalendarSlot | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [booking, setBooking] = useState(false);
  const [bookWeekly, setBookWeekly] = useState(false);
  const [untilDate, setUntilDate] = useState('');
  const [rescheduleBookingId, setRescheduleBookingId] = useState<string | null>(null);
  const [slotFilter, setSlotFilter] = useState<string | null>(null); // 'available' or null

  const { vacations } = useCalendarVacations(settings?.teacher_id);
  
  const studentTz = useMemo(() => getStudentTimeZone(), []);
  const teacherTz = settings?.timezone || 'Europe/Warsaw';
  const showTzInfo = studentTz !== teacherTz;

  useEffect(() => {
    const savedEmail = getSavedValue(EMAIL_STORAGE_KEY);
    const savedName = getSavedValue(NAME_STORAGE_KEY);
    if (savedEmail) { setEmail(savedEmail); setEmailVerified(true); }
    if (savedName) setName(savedName);
  }, []);

  const handleEmailSubmit = () => {
    if (!email.trim()) return;
    saveValue(EMAIL_STORAGE_KEY, email.trim());
    setEmailVerified(true);
  };

  const formatSlotTime = useCallback((slot: { slot_date: string; start_time: string; end_time: string }) => {
    if (!showTzInfo) {
      return { primary: `${slot.start_time.slice(0, 5)}–${slot.end_time.slice(0, 5)}`, secondary: null };
    }
    const conv = toStudentLocalTimeRange(slot.slot_date, slot.start_time, slot.end_time, teacherTz, studentTz);
    return {
      primary: `${conv.studentStartHHMM}–${conv.studentEndHHMM}`,
      secondary: `Teacher: ${conv.teacherStartHHMM}–${conv.teacherEndHHMM}`,
    };
  }, [showTzInfo, teacherTz, studentTz]);

  const [weeklySlotIds, setWeeklySlotIds] = useState<string[]>([]);
  const [weeklyLoading, setWeeklyLoading] = useState(false);

  useEffect(() => {
    if (!selectedSlot || !bookWeekly || !untilDate || !settings) {
      setWeeklySlotIds([]);
      return;
    }
    const fetchWeeklySlots = async () => {
      setWeeklyLoading(true);
      try {
        const slotDayOfWeek = parseISO(selectedSlot.slot_date).getDay();
        const slotTime = selectedSlot.start_time.slice(0, 5);
        
        const { data } = await supabase
          .from('calendar_slots')
          .select('id, slot_date, start_time')
          .eq('teacher_id', settings.teacher_id)
          .eq('status', 'available')
          .neq('slot_type', 'block')
          .gte('slot_date', selectedSlot.slot_date)
          .lte('slot_date', untilDate)
          .order('slot_date');

        if (data) {
          const matching = data.filter(s => {
            const d = parseISO(s.slot_date);
            return d.getDay() === slotDayOfWeek && s.start_time.slice(0, 5) === slotTime;
          });
          setWeeklySlotIds(matching.map(s => s.id));
        }
      } catch (err) {
        console.error('Error fetching weekly slots:', err);
      } finally {
        setWeeklyLoading(false);
      }
    };
    fetchWeeklySlots();
  }, [selectedSlot, bookWeekly, untilDate, settings]);

  const recurringCount = weeklySlotIds.length;

  const isVacationDay = (date: Date): string | null => {
    const dateStr = format(date, 'yyyy-MM-dd');
    for (const v of vacations) {
      if (dateStr >= v.start_date && dateStr <= v.end_date) return v.label || 'Vacation';
    }
    return null;
  };

  // Email-first screen
  if (!emailVerified && !loading && !error && settings) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Calendar className="h-10 w-10 mx-auto text-primary mb-2" />
            <CardTitle className="text-2xl">Book a Lesson</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Enter your email to get started</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Your Email</Label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                onKeyDown={e => e.key === 'Enter' && handleEmailSubmit()}
              />
            </div>
            <Button className="w-full" onClick={handleEmailSubmit} disabled={!email.trim()}>
              Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  const handleSlotClick = async (slot: CalendarSlot) => {
    if (rescheduleBookingId && slot.status === 'available') {
      const confirmMsg = settings.allow_student_reschedule
        ? 'Reschedule your lesson to this time?'
        : 'Request reschedule to this time? Teacher will need to confirm.';
      if (!window.confirm(confirmMsg)) return;

      try {
        const { data, error: err } = await supabase.functions.invoke('get-student-bookings', {
          body: { token, email: email.trim(), action: 'reschedule', slotId: rescheduleBookingId, newSlotId: slot.id },
        });
        if (err) throw err;
        if (data?.success === false) {
          toast.error(data?.error || 'Slot no longer available');
          refetchSlots();
          setRescheduleBookingId(null);
          return;
        }
        const autoRescheduled = data?.autoRescheduled;
        toast.success(autoRescheduled ? 'Lesson rescheduled successfully!' : 'Reschedule request sent to teacher');
        setRescheduleBookingId(null);
        refetchSlots();
      } catch (err: any) {
        toast.error(err.message || 'Failed to reschedule');
      }
      return;
    }

    setSelectedSlot(slot);
  };

  const handleBook = async () => {
    if (!selectedSlot || !name.trim() || !email.trim()) return;
    setBooking(true);
    saveValue(EMAIL_STORAGE_KEY, email.trim());
    saveValue(NAME_STORAGE_KEY, name.trim());

    if (bookWeekly && untilDate && weeklySlotIds.length > 0) {
      try {
        const { data, error } = await supabase.functions.invoke('get-student-bookings', {
          body: { token, email: email.trim(), action: 'book_batch', slotIds: weeklySlotIds, studentName: name.trim() },
        });
        if (error) throw error;
        if (data?.booked > 0) toast.success(`Booked ${data.booked} lessons!`);
        if (data?.failed > 0) toast.info(`${data.failed} slots were no longer available.`);
        refetchSlots();
      } catch (err: any) {
        toast.error(err.message || 'Booking failed');
      }
      setBooking(false);
      setSelectedSlot(null); setName(getSavedValue(NAME_STORAGE_KEY) || ''); setBookWeekly(false); setUntilDate('');
    } else {
      const success = await bookSlot(selectedSlot.id, name.trim(), email.trim());
      setBooking(false);
      if (success) { setSelectedSlot(null); setBookWeekly(false); setUntilDate(''); }
      else { setSelectedSlot(null); }
    }
  };

  const handleRescheduleStart = (bookingId: string) => {
    setRescheduleBookingId(rescheduleBookingId === bookingId ? null : bookingId);
  };

  const selectedDayName = selectedSlot ? format(parseISO(selectedSlot.slot_date), 'EEEE') : '';

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Book a Lesson</h1>
          <p className="text-muted-foreground">Select an available time slot below</p>
          {emailVerified && (
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs text-muted-foreground">{email}</span>
              <Button variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={() => {
                localStorage.removeItem(EMAIL_STORAGE_KEY);
                localStorage.removeItem(NAME_STORAGE_KEY);
                setEmailVerified(false);
                setEmail('');
                setName('');
              }}>
                Log out
              </Button>
            </div>
          )}
          {showTzInfo && (
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <Globe className="h-3 w-3" />
              <span>Times shown in: {studentTz} (your time)</span>
            </div>
          )}
        </div>

        {rescheduleBookingId && (
          <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/30 rounded-lg text-sm">
            <AlertTriangle className="h-4 w-4 text-primary shrink-0" />
            <p>Select a new slot from the calendar to reschedule your lesson.</p>
            <Button variant="outline" size="sm" className="ml-auto text-xs h-7" onClick={() => setRescheduleBookingId(null)}>Cancel</Button>
          </div>
        )}

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

        {/* Problem 10: Legend with A/P badges and filter */}
        <div className="flex items-center gap-4 justify-center text-xs">
          <button
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded transition-colors',
              slotFilter === 'available' ? 'ring-2 ring-primary bg-primary/10' : 'hover:bg-muted/50'
            )}
            onClick={() => setSlotFilter(slotFilter === 'available' ? null : 'available')}
          >
            <span className="w-4 h-4 rounded border border-green-400 bg-green-200 text-[8px] font-bold flex items-center justify-center">A</span>
            Available
          </button>
          <button
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-muted/50"
            onClick={() => setSlotFilter(null)}
          >
            <span className="w-4 h-4 rounded border border-amber-400 bg-amber-200 text-[8px] font-bold flex items-center justify-center">P</span>
            Pending
          </button>
          {slotFilter && (
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setSlotFilter(null)}>
              <X className="h-3 w-3 mr-1" /> Clear
            </Button>
          )}
        </div>

        {/* Week grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {days.map(date => {
            const daySlots = getSlotsForDay(date);
            const isPastDay = isBefore(date, today) && !isToday(date);
            const vacLabel = isVacationDay(date);
            const now = new Date();

            // Filter out slots that have already passed
            const visibleSlots = daySlots.filter(slot => {
              const [h, m] = slot.start_time.split(':').map(Number);
              const slotStart = new Date(date);
              slotStart.setHours(h, m, 0, 0);
              if (isBefore(slotStart, now)) return false; // past start time -> hide completely
              return true;
            });

            // Apply slot filter
            const filteredVisibleSlots = visibleSlots.filter(slot => {
              const isAvailable = slot.status === 'available';
              const isPending = slot.status === 'booked' && !slot.confirmed_at;
              if (slotFilter === 'available' && !isAvailable) return false;
              if (!isAvailable && !isPending) return false; // only show available and pending
              return true;
            });

            return (
              <Card key={date.toISOString()} className={`${isPastDay ? 'opacity-40' : ''} ${isToday(date) ? 'ring-2 ring-primary' : ''} ${vacLabel ? 'bg-orange-50 dark:bg-orange-950/20' : ''}`}>
                <CardHeader className="p-3 pb-1">
                  <CardTitle className="text-xs font-medium text-center">
                    {format(date, 'EEE')}
                    <br />
                    <span className="text-lg">{format(date, 'd')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 space-y-1">
                  {vacLabel && filteredVisibleSlots.length === 0 && (
                    <div className="flex flex-col items-center gap-1 py-2 text-orange-600 dark:text-orange-400">
                      <Palmtree className="h-4 w-4" />
                      <span className="text-[10px] text-center">{vacLabel}</span>
                    </div>
                  )}

                  {filteredVisibleSlots.length === 0 && !vacLabel ? (
                    <p className="text-xs text-muted-foreground text-center py-2">No slots</p>
                  ) : (
                    filteredVisibleSlots.map(slot => {
                      const isPending = slot.status === 'booked' && !slot.confirmed_at;
                      const isAvailable = slot.status === 'available';
                      const timeDisplay = formatSlotTime(slot);

                      // Both pending and available use same structure, differ only in color
                      const colorClasses = isPending
                        ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        : rescheduleBookingId
                          ? 'border-primary bg-primary/10 hover:bg-primary/20 text-primary'
                          : 'border-green-300 bg-green-50 hover:bg-green-100 text-green-800 dark:border-green-700 dark:bg-green-950 dark:text-green-300';

                      if (isPending) {
                        // Pending: same layout as available but not clickable
                        return (
                          <div
                            key={slot.id}
                            className={`w-full text-xs py-1.5 px-2 rounded-md border ${colorClasses} text-center`}
                          >
                            <span className="flex items-center justify-center gap-1">
                              <Clock className="h-3 w-3" />
                              {timeDisplay.primary}
                            </span>
                            {timeDisplay.secondary && (
                              <span className="text-[9px] opacity-60">{timeDisplay.secondary}</span>
                            )}
                          </div>
                        );
                      }

                      return (
                        <Button
                          key={slot.id}
                          variant="outline"
                          size="sm"
                          className={`w-full text-xs h-auto py-1.5 flex-col ${colorClasses}`}
                          onClick={() => handleSlotClick(slot)}
                        >
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {timeDisplay.primary}
                          </span>
                          {timeDisplay.secondary && (
                            <span className="text-[9px] opacity-60 font-normal">{timeDisplay.secondary}</span>
                          )}
                        </Button>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {settings && token && emailVerified && (
          <StudentBookingsSection
            settings={settings}
            token={token}
            availableSlots={slots.filter(s => s.status === 'available').map(s => ({ id: s.id, slot_date: s.slot_date, start_time: s.start_time, end_time: s.end_time }))}
            onBookingChanged={refetchSlots}
            onRescheduleStart={handleRescheduleStart}
            rescheduleBookingId={rescheduleBookingId}
            defaultEmail={email}
          />
        )}
      </div>

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
                {(() => {
                  const t = formatSlotTime(selectedSlot);
                  return (
                    <>
                      <p className="text-lg font-bold">{t.primary}</p>
                      {t.secondary && <p className="text-xs text-muted-foreground">{t.secondary} ({teacherTz})</p>}
                    </>
                  );
                })()}
              </div>

              <div>
                <Label>Your Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" />
              </div>
              <div>
                <Label>Your Email</Label>
                <Input type="email" value={email} readOnly className="bg-muted/50 cursor-not-allowed" />
              </div>

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
                          {weeklyLoading ? 'Checking available slots...' : (
                            <>
                              You are booking a weekly recurring lesson every <strong>{selectedDayName}</strong> at <strong>{formatSlotTime(selectedSlot).primary}</strong> until <strong>{format(parseISO(untilDate), 'MMM d, yyyy')}</strong>.
                              {recurringCount > 0 && (
                                <> This will book <strong>{recurringCount}</strong> lesson{recurringCount !== 1 ? 's' : ''} (only available slots).</>
                              )}
                            </>
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
            <Button onClick={handleBook} disabled={booking || !name.trim() || !email.trim() || (bookWeekly && (!untilDate || weeklyLoading))}>
              {booking ? 'Booking...' : bookWeekly ? `Book ${recurringCount} Lessons` : 'Book Lesson'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PublicBookingPage;
