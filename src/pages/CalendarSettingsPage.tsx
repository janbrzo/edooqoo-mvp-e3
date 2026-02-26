import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthFlow } from '@/hooks/useAuthFlow';
import { useCalendarSettings } from '@/hooks/useCalendarSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Copy } from 'lucide-react';
import { toast } from 'sonner';

const CalendarSettingsPage = () => {
  const { user, loading: authLoading, isRegisteredUser } = useAuthFlow();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !isRegisteredUser) navigate('/login');
  }, [authLoading, isRegisteredUser, navigate]);

  const { settings, loading, updateSettings, generatePublicToken } = useCalendarSettings(user?.id);

  if (authLoading || loading || !settings) return null;

  const publicUrl = settings.public_calendar_token
    ? `${window.location.origin}/book/${settings.public_calendar_token}`
    : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/calendar')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Calendar
          </Button>
          <h1 className="text-2xl font-bold">Calendar Settings</h1>
        </div>

        {/* General */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Default Lesson Duration (minutes)</Label>
              <Input
                type="number"
                className="w-24"
                value={settings.default_lesson_duration_minutes}
                onChange={e => updateSettings({ default_lesson_duration_minutes: Number(e.target.value) })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Timezone</Label>
              <Select
                value={settings.timezone}
                onValueChange={v => updateSettings({ timezone: v })}
              >
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    'Europe/Warsaw', 'Europe/London', 'Europe/Berlin', 'Europe/Paris',
                    'Europe/Madrid', 'Europe/Rome', 'Europe/Prague', 'Europe/Bucharest',
                    'Europe/Athens', 'Europe/Istanbul', 'Europe/Moscow',
                    'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
                    'America/Sao_Paulo', 'America/Mexico_City', 'America/Buenos_Aires',
                    'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Seoul', 'Asia/Kolkata',
                    'Asia/Dubai', 'Asia/Bangkok', 'Asia/Singapore',
                    'Australia/Sydney', 'Australia/Melbourne',
                    'Pacific/Auckland',
                    'Africa/Cairo', 'Africa/Johannesburg',
                  ].map(tz => (
                    <SelectItem key={tz} value={tz}>{tz.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Min. Cancellation Hours</Label>
              <Input
                type="number"
                className="w-24"
                value={settings.min_cancellation_hours || ''}
                onChange={e => updateSettings({ min_cancellation_hours: e.target.value ? Number(e.target.value) : null })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Booking */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Booking Rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Default Booking Mode</Label>
              <Select
                value={settings.default_booking_mode}
                onValueChange={v => updateSettings({ default_booking_mode: v as any })}
              >
                <SelectTrigger className="w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto_confirm">Auto-confirm</SelectItem>
                  <SelectItem value="requires_confirmation">Requires confirmation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Max slots per student per week</Label>
              <Input
                type="number"
                className="w-24"
                value={settings.max_slots_per_student_per_week ?? ''}
                onChange={e => updateSettings({ max_slots_per_student_per_week: e.target.value ? Number(e.target.value) : null })}
                placeholder="No limit"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Enforce slot limit</Label>
                <p className="text-xs text-muted-foreground">Block vs. warning only</p>
              </div>
              <Switch checked={settings.enforce_slot_limit} onCheckedChange={v => updateSettings({ enforce_slot_limit: v })} />
            </div>
          </CardContent>
        </Card>

        {/* Public Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Public Calendar</CardTitle>
            <CardDescription>Let students book available slots via a shareable link</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Enable Public Calendar</Label>
              <Switch
                checked={settings.public_calendar_enabled}
                onCheckedChange={async v => {
                  if (v && !settings.public_calendar_token) {
                    await generatePublicToken();
                  } else {
                    await updateSettings({ public_calendar_enabled: v });
                  }
                }}
              />
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

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Notify on new booking</Label>
              <Switch checked={settings.notify_on_booking} onCheckedChange={v => updateSettings({ notify_on_booking: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Notify on cancellation</Label>
              <Switch checked={settings.notify_on_cancellation} onCheckedChange={v => updateSettings({ notify_on_cancellation: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Student reminder (hours before)</Label>
              <Input
                type="number"
                className="w-24"
                value={settings.notify_student_reminder_hours ?? ''}
                onChange={e => updateSettings({ notify_student_reminder_hours: e.target.value ? Number(e.target.value) : null })}
                placeholder="None"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CalendarSettingsPage;
