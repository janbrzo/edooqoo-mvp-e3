import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthFlow } from '@/hooks/useAuthFlow';
import { useCalendarSettings } from '@/hooks/useCalendarSettings';
import { useCalendarVacations } from '@/hooks/useCalendarVacations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Copy, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const SECTIONS = [
  { id: 'general', label: 'General' },
  { id: 'booking', label: 'Booking Rules' },
  { id: 'public', label: 'Public Calendar' },
  { id: 'vacations', label: 'Vacations' },
  { id: 'payments', label: 'Payment Tracking' },
  { id: 'notifications', label: 'In-App Notifications' },
  { id: 'email-notifications', label: 'Email Alerts' },
];

const CalendarSettingsPage = () => {
  const { user, loading: authLoading, isRegisteredUser } = useAuthFlow();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !isRegisteredUser) navigate('/login');
  }, [authLoading, isRegisteredUser, navigate]);

  const { settings, loading, updateSettings, generatePublicToken } = useCalendarSettings(user?.id);
  const { vacations, addVacation, removeVacation } = useCalendarVacations(user?.id);

  const [vacStart, setVacStart] = useState('');
  const [vacEnd, setVacEnd] = useState('');
  const [vacLabel, setVacLabel] = useState('Vacation');
  const [activeSection, setActiveSection] = useState('general');
  const observerRef = useRef<IntersectionObserver | null>(null);

  // IntersectionObserver for active section
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );

    SECTIONS.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [settings]);

  const scrollToSection = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  if (authLoading || loading || !settings) return null;

  const publicUrl = settings.public_calendar_token
    ? `${window.location.origin}/book/${settings.public_calendar_token}`
    : null;

  const handleAddVacation = async () => {
    if (!vacStart || !vacEnd) return;
    await addVacation(vacStart, vacEnd, vacLabel || 'Vacation');
    setVacStart(''); setVacEnd(''); setVacLabel('Vacation');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/calendar')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Calendar
          </Button>
          <h1 className="text-2xl font-bold">Calendar Settings</h1>
        </div>

        <div className="flex gap-6">
          {/* Sidebar navigation — hidden on mobile */}
          <nav className="hidden lg:block w-48 shrink-0">
            <div className="sticky top-20 space-y-1">
              {SECTIONS.map(s => (
                <button
                  key={s.id}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                    activeSection === s.id
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  )}
                  onClick={() => scrollToSection(s.id)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </nav>

          {/* Content */}
          <div className="flex-1 space-y-6 max-w-2xl">
            {/* General */}
            <Card id="general">
              <CardHeader>
                <CardTitle className="text-lg">General</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Default Lesson Duration (minutes)</Label>
                  <Input type="number" className="w-24" value={settings.default_lesson_duration_minutes} onChange={e => updateSettings({ default_lesson_duration_minutes: Number(e.target.value) })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Timezone</Label>
                  <Select value={settings.timezone} onValueChange={v => updateSettings({ timezone: v })}>
                    <SelectTrigger className="w-56"><SelectValue placeholder="Select timezone" /></SelectTrigger>
                    <SelectContent>
                      {['Europe/Warsaw','Europe/London','Europe/Berlin','Europe/Paris','Europe/Madrid','Europe/Rome','Europe/Prague','Europe/Bucharest','Europe/Athens','Europe/Istanbul','Europe/Moscow','America/New_York','America/Chicago','America/Denver','America/Los_Angeles','America/Sao_Paulo','America/Mexico_City','America/Buenos_Aires','Asia/Tokyo','Asia/Shanghai','Asia/Seoul','Asia/Kolkata','Asia/Dubai','Asia/Bangkok','Asia/Singapore','Australia/Sydney','Australia/Melbourne','Pacific/Auckland','Africa/Cairo','Africa/Johannesburg'].map(tz => (
                        <SelectItem key={tz} value={tz}>{tz.replace('_', ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Min. Cancellation Hours</Label>
                  <Input type="number" className="w-24" value={settings.min_cancellation_hours || ''} onChange={e => updateSettings({ min_cancellation_hours: e.target.value ? Number(e.target.value) : null })} />
                </div>
                <div className="flex items-center justify-between">
                  <div><Label>Display Start Hour</Label><p className="text-xs text-muted-foreground">First hour visible on calendar grid</p></div>
                  <Input type="number" className="w-24" min={0} max={23} value={settings.display_start_hour} onChange={e => updateSettings({ display_start_hour: Number(e.target.value) })} />
                </div>
                <div className="flex items-center justify-between">
                  <div><Label>Display End Hour</Label><p className="text-xs text-muted-foreground">Last hour visible on calendar grid</p></div>
                  <Input type="number" className="w-24" min={1} max={24} value={settings.display_end_hour} onChange={e => updateSettings({ display_end_hour: Number(e.target.value) })} />
                </div>
                <div className="flex items-center justify-between">
                  <div><Label>Buffer Between Lessons (minutes)</Label><p className="text-xs text-muted-foreground">Minimum gap between consecutive lessons</p></div>
                  <Input type="number" className="w-24" min={0} value={settings.buffer_minutes} onChange={e => updateSettings({ buffer_minutes: Number(e.target.value) })} />
                </div>
              </CardContent>
            </Card>

            {/* Booking */}
            <Card id="booking">
              <CardHeader><CardTitle className="text-lg">Booking Rules</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Default Booking Mode</Label>
                  <Select value={settings.default_booking_mode} onValueChange={v => updateSettings({ default_booking_mode: v as any })}>
                    <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto_confirm">Auto-confirm</SelectItem>
                      <SelectItem value="requires_confirmation">Requires confirmation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Max slots per student per week</Label>
                  <Input type="number" className="w-24" value={settings.max_slots_per_student_per_week ?? ''} onChange={e => updateSettings({ max_slots_per_student_per_week: e.target.value ? Number(e.target.value) : null })} placeholder="No limit" />
                </div>
                <div className="flex items-center justify-between">
                  <div><Label>Enforce slot limit</Label><p className="text-xs text-muted-foreground">Block vs. warning only</p></div>
                  <Switch checked={settings.enforce_slot_limit} onCheckedChange={v => updateSettings({ enforce_slot_limit: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <div><Label>Allow student rescheduling without your confirmation</Label><p className="text-xs text-muted-foreground">Students can move their lessons to other available slots automatically</p></div>
                  <Switch checked={settings.allow_student_reschedule} onCheckedChange={v => updateSettings({ allow_student_reschedule: v })} />
                </div>
              </CardContent>
            </Card>

            {/* Public Calendar */}
            <Card id="public">
              <CardHeader>
                <CardTitle className="text-lg">Public Calendar</CardTitle>
                <CardDescription>Let students book available slots via a shareable link</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Public Calendar</Label>
                  <Switch checked={settings.public_calendar_enabled} onCheckedChange={async v => { if (v && !settings.public_calendar_token) { await generatePublicToken(); } else { await updateSettings({ public_calendar_enabled: v }); } }} />
                </div>
                {publicUrl && (
                  <div className="flex items-center gap-2">
                    <Input value={publicUrl} readOnly className="text-xs" />
                    <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(publicUrl); toast.success('Link copied!'); }}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Vacations */}
            <Card id="vacations">
              <CardHeader>
                <CardTitle className="text-lg">Vacations</CardTitle>
                <CardDescription>Mark days when you're unavailable. Students will see this on your booking page.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2 flex-wrap items-end">
                  <div><Label className="text-xs">Start</Label><Input type="date" value={vacStart} onChange={e => setVacStart(e.target.value)} className="h-9 w-40" /></div>
                  <div><Label className="text-xs">End</Label><Input type="date" value={vacEnd} onChange={e => setVacEnd(e.target.value)} className="h-9 w-40" /></div>
                  <div><Label className="text-xs">Label</Label><Input value={vacLabel} onChange={e => setVacLabel(e.target.value)} className="h-9 w-40" placeholder="Vacation" /></div>
                  <Button size="sm" className="h-9" onClick={handleAddVacation} disabled={!vacStart || !vacEnd}><Plus className="h-3.5 w-3.5 mr-1" /> Add</Button>
                </div>
                {vacations.length > 0 && (
                  <div className="space-y-2">
                    {vacations.map(v => (
                      <div key={v.id} className="flex items-center justify-between border rounded-md px-3 py-2 text-sm">
                        <div>
                          <span className="font-medium">{v.label}</span>
                          <span className="text-muted-foreground ml-2">{format(new Date(v.start_date), 'MMM d')} – {format(new Date(v.end_date), 'MMM d, yyyy')}</span>
                        </div>
                        <Button variant="ghost" size="sm" className="text-destructive h-7" onClick={() => removeVacation(v.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Tracking */}
            <Card id="payments">
              <CardHeader><CardTitle className="text-lg">Payment Tracking</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Payment Tracking</Label>
                  <Switch checked={settings.payment_tracking_enabled} onCheckedChange={v => updateSettings({ payment_tracking_enabled: v })} />
                </div>
                {settings.payment_tracking_enabled && (
                  <>
                    <div className="flex items-center justify-between">
                      <Label>Default Lesson Price</Label>
                      <Input type="number" className="w-24" value={settings.default_lesson_price ?? ''} onChange={e => updateSettings({ default_lesson_price: e.target.value ? Number(e.target.value) : null })} placeholder="0" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Currency</Label>
                      <Select value={settings.currency || 'USD'} onValueChange={v => updateSettings({ currency: v })}>
                        <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['USD','EUR','PLN','GBP','CHF','CZK','SEK','NOK','DKK','HUF','RON','BGN','HRK','TRY','BRL','MXN','ARS','JPY','KRW','CNY','INR','AED','THB','SGD','AUD','NZD','ZAR','EGP'].map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card id="notifications">
              <CardHeader>
                <CardTitle className="text-lg">In-App Notifications</CardTitle>
                <CardDescription>Bell icon notifications that appear in the calendar toolbar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between"><Label>Notify on new booking</Label><Switch checked={settings.notify_on_booking} onCheckedChange={v => updateSettings({ notify_on_booking: v })} /></div>
                <div className="flex items-center justify-between"><Label>Notify on cancellation</Label><Switch checked={settings.notify_on_cancellation} onCheckedChange={v => updateSettings({ notify_on_cancellation: v })} /></div>
                <div className="flex items-center justify-between">
                  <Label>Student reminder (hours before)</Label>
                  <Input type="number" className="w-24" value={settings.notify_student_reminder_hours ?? ''} onChange={e => updateSettings({ notify_student_reminder_hours: e.target.value ? Number(e.target.value) : null })} placeholder="None" />
                </div>
              </CardContent>
            </Card>

            {/* Email Notifications */}
            <Card id="email-notifications">
              <CardHeader>
                <CardTitle className="text-lg">Email Alerts</CardTitle>
                <CardDescription>Emails sent to you and your students when calendar events happen</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div><Label>Email on new booking</Label><p className="text-xs text-muted-foreground">Send email when a student books a lesson</p></div>
                  <Switch checked={settings.notify_email_on_booking} onCheckedChange={v => updateSettings({ notify_email_on_booking: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <div><Label>Email on cancellation</Label><p className="text-xs text-muted-foreground">Send email when a lesson is cancelled</p></div>
                  <Switch checked={settings.notify_email_on_cancellation} onCheckedChange={v => updateSettings({ notify_email_on_cancellation: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <div><Label>Email on reschedule request</Label><p className="text-xs text-muted-foreground">Send email when a student requests to reschedule</p></div>
                  <Switch checked={settings.notify_email_on_reschedule} onCheckedChange={v => updateSettings({ notify_email_on_reschedule: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <div><Label>Email on confirmation</Label><p className="text-xs text-muted-foreground">Send email when you confirm a booking</p></div>
                  <Switch checked={settings.notify_email_on_confirmation} onCheckedChange={v => updateSettings({ notify_email_on_confirmation: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <div><Label>Email on rejection</Label><p className="text-xs text-muted-foreground">Send email when you reject a booking</p></div>
                  <Switch checked={settings.notify_email_on_rejection} onCheckedChange={v => updateSettings({ notify_email_on_rejection: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <div><Label>Email on new lesson (to student)</Label><p className="text-xs text-muted-foreground">Send email to student when you create a new lesson for them</p></div>
                  <Switch checked={settings.notify_email_on_lesson_created} onCheckedChange={v => updateSettings({ notify_email_on_lesson_created: v })} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarSettingsPage;
