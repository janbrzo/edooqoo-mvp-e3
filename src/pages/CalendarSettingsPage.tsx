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
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Copy, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

const SECTIONS = [
  { id: 'general', label: 'General' },
  { id: 'booking', label: 'Booking Rules' },
  { id: 'public', label: 'Public Calendar' },
  { id: 'gcal', label: 'Google Calendar' },
  { id: 'vacations', label: 'Vacations' },
  { id: 'payments', label: 'Payment Tracking' },
  { id: 'notifications', label: 'In-App Notifications' },
  { id: 'email-notifications', label: 'Email Alerts' },
];

const GCAL_COLORS = [
  { v: '1', l: 'Lavender' }, { v: '2', l: 'Sage' }, { v: '3', l: 'Grape' },
  { v: '4', l: 'Flamingo' }, { v: '5', l: 'Banana' }, { v: '6', l: 'Tangerine' },
  { v: '7', l: 'Peacock' }, { v: '9', l: 'Blueberry' }, { v: '10', l: 'Basil' },
  { v: '11', l: 'Tomato' },
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
  const [gcalConnected, setGcalConnected] = useState(false);
  const [gcalLoading, setGcalLoading] = useState(false);

  // Check GCal connection status
  const fetchGcalStatus = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase.from('calendar_gcal_tokens').select('id').eq('teacher_id', user.id).maybeSingle();
    setGcalConnected(!!data);
  }, [user?.id]);

  useEffect(() => { fetchGcalStatus(); }, [fetchGcalStatus]);

  // Handle OAuth callback from Google
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code && user?.id) {
      setGcalLoading(true);
      supabase.functions.invoke('gcal-auth-callback', {
        body: { code, redirectUri: `${window.location.origin}/calendar/settings`, teacherId: user.id },
      }).then(({ error }) => {
        if (error) {
          toast.error('Failed to connect Google Calendar');
        } else {
          toast.success('Google Calendar connected!');
          fetchGcalStatus();
        }
        window.history.replaceState({}, '', '/calendar/settings');
        setGcalLoading(false);
      });
    }
  }, [user?.id]);

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

  const handleConnectGcal = async () => {
    setGcalLoading(true);
    try {
      const redirectUri = `${window.location.origin}/calendar/settings`;
      const { data, error } = await supabase.functions.invoke('gcal-auth-start', {
        body: { teacherId: user?.id, redirectUri },
      });
      if (error) throw error;
      if (data?.authUrl) window.location.href = data.authUrl;
    } catch (err: any) {
      toast.error('Failed to start Google Calendar connection');
      setGcalLoading(false);
    }
  };

  const handleDisconnectGcal = async () => {
    if (!user?.id) return;
    await supabase.from('calendar_gcal_tokens').delete().eq('teacher_id', user.id);
    await updateSettings({ gcal_integration_enabled: false });
    setGcalConnected(false);
    toast.success('Google Calendar disconnected');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6 sticky top-0 z-10 bg-background py-3 border-b">
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

            {/* Google Calendar */}
            <Card id="gcal">
              <CardHeader>
                <CardTitle className="text-lg">Google Calendar</CardTitle>
                <CardDescription>Sync confirmed lessons to your Google Calendar automatically</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {gcalConnected ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700">✓ Connected</Badge>
                      <Button variant="outline" size="sm" className="text-xs h-7" onClick={handleDisconnectGcal}>Disconnect</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div><Label>Auto-sync confirmed lessons</Label><p className="text-xs text-muted-foreground">Automatically create Google Calendar events for confirmed lessons</p></div>
                      <Switch checked={settings.gcal_integration_enabled} onCheckedChange={v => updateSettings({ gcal_integration_enabled: v })} />
                    </div>
                    {/* Per-status colors */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Event colors by status</Label>
                      {[
                        { key: 'gcal_color_booked', label: 'Booked lesson', def: '9' },
                        { key: 'gcal_color_available', label: 'Available slot', def: '2' },
                        { key: 'gcal_color_pending', label: 'Pending booking', def: '5' },
                        { key: 'gcal_color_completed', label: 'Completed lesson', def: '10' },
                        { key: 'gcal_color_no_show', label: 'No Show', def: '6' },
                      ].map(item => (
                        <div key={item.key} className="flex items-center justify-between">
                          <Label className="text-sm">{item.label}</Label>
                          <Select value={(settings as any)[item.key] || item.def} onValueChange={v => updateSettings({ [item.key]: v } as any)}>
                            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {GCAL_COLORS.map(c => (
                                <SelectItem key={c.v} value={c.v}>{c.l}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                    {/* Reminder toggle */}
                    <div className="flex items-center justify-between">
                      <div><Label>Reminder before lesson</Label><p className="text-xs text-muted-foreground">Get notified before each lesson in Google Calendar</p></div>
                      <Switch checked={settings.gcal_default_reminder_minutes !== null && settings.gcal_default_reminder_minutes !== undefined}
                        onCheckedChange={v => updateSettings({ gcal_default_reminder_minutes: v ? 30 : null })} />
                    </div>
                    {settings.gcal_default_reminder_minutes !== null && settings.gcal_default_reminder_minutes !== undefined && (
                      <div className="flex items-center justify-between">
                        <Label>Minutes before</Label>
                        <Input type="number" className="w-24" value={settings.gcal_default_reminder_minutes} onChange={e => updateSettings({ gcal_default_reminder_minutes: Number(e.target.value) })} />
                      </div>
                    )}
                    {/* Sync mode */}
                    <div className="flex items-center justify-between">
                      <div><Label>What to sync</Label><p className="text-xs text-muted-foreground">Which slots appear in Google Calendar</p></div>
                      <Select value={(settings as any).gcal_sync_mode || 'booked_only'} onValueChange={v => updateSettings({ gcal_sync_mode: v } as any)}>
                        <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="booked_only">Only booked lessons</SelectItem>
                          <SelectItem value="booked_and_pending">Booked + pending</SelectItem>
                          <SelectItem value="all">All (including available slots)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {/* On cancellation */}
                    <div className="flex items-center justify-between">
                      <div><Label>On cancellation</Label><p className="text-xs text-muted-foreground">What happens to the GCal event when a lesson is cancelled</p></div>
                      <Select value={(settings as any).gcal_on_cancel_action || 'update'} onValueChange={v => updateSettings({ gcal_on_cancel_action: v } as any)}>
                        <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="update">Update to Available Slot</SelectItem>
                          <SelectItem value="delete">Delete event</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Auto-create Google Meet */}
                    <div className="flex items-center justify-between">
                      <div><Label>Auto-create Google Meet</Label><p className="text-xs text-muted-foreground">Automatically generate a Google Meet link for each booked lesson</p></div>
                      <Switch checked={(settings as any).auto_create_meet_link || false} onCheckedChange={v => updateSettings({ auto_create_meet_link: v } as any)} />
                    </div>
                  </>
                ) : (
                  <Button onClick={handleConnectGcal} disabled={gcalLoading} variant="outline">
                    {gcalLoading ? 'Connecting...' : '🗓️ Connect Google Calendar'}
                  </Button>
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
                <p className="text-xs text-muted-foreground">
                  When enabled, each lesson shows a "Mark Paid / Unpaid" button. Unpaid lessons appear in the 💰 counter in the calendar toolbar. You can set per-student prices in each student's profile page.
                </p>
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
                <CardTitle className="text-lg">Your Email Notifications</CardTitle>
                <CardDescription>Email notifications sent to you when calendar events happen. Student email preferences can be configured individually in each student's profile. By default, all students receive all notifications.</CardDescription>
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
