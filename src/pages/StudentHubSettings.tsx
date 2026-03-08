import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Settings, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { StudentHubLayout } from '@/components/student-hub/StudentHubLayout';
import { getSavedHubEmail } from '@/hooks/useStudentHubData';
import { toast } from 'sonner';

const GCAL_COLORS = [
  { v: '1', l: 'Lavender' }, { v: '2', l: 'Sage' }, { v: '3', l: 'Grape' },
  { v: '4', l: 'Flamingo' }, { v: '5', l: 'Banana' }, { v: '6', l: 'Tangerine' },
  { v: '7', l: 'Peacock' }, { v: '9', l: 'Blueberry' }, { v: '10', l: 'Basil' },
  { v: '11', l: 'Tomato' },
];

const GCAL_COLOR_HEX: Record<string, string> = {
  '1': '#7986cb', '2': '#33b679', '3': '#8e24aa', '4': '#e67c73',
  '5': '#f6bf26', '6': '#f4511e', '7': '#039be5', '9': '#3f51b5',
  '10': '#0b8043', '11': '#d50000',
};

export default function StudentHubSettings() {
  const { teacherToken } = useParams<{ teacherToken: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const email = getSavedHubEmail();
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [settings, setSettings] = useState({
    auto_add: true,
    reminder_minutes: 30,
    color_id: '9',
  });

  // Check for successful gcal connection via callback redirect
  useEffect(() => {
    const gcal = searchParams.get('gcal');
    if (gcal === 'connected') {
      setConnected(true);
      setSearchParams({});
    } else if (gcal === 'error') {
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  // Fetch current state
  useEffect(() => {
    if (!email || !teacherToken) return;
    fetchConnectionStatus();
  }, [email, teacherToken]);

  const fetchConnectionStatus = async () => {
    setLoading(true);
    try {
      // We need to check via edge function since student has no auth
      const { data } = await supabase.functions.invoke('get-student-hub-data', {
        body: { token: teacherToken, email, action: 'get_gcal_status' },
      });
      if (data?.gcal_connected) {
        setConnected(true);
        if (data.gcal_settings) {
          setSettings(data.gcal_settings);
        }
      }
    } catch (err) {
      console.error('Error checking gcal status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('student-gcal-auth-start', {
        body: { email, teacherToken, origin: window.location.origin },
      });
      if (error) throw error;
      if (data?.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (err: any) {
      toast.error('Failed to start Google Calendar connection');
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const { error } = await supabase.functions.invoke('get-student-hub-data', {
        body: { token: teacherToken, email, action: 'disconnect_gcal' },
      });
      if (error) throw error;
      setConnected(false);
      toast.success('Google Calendar disconnected');
    } catch (err) {
      toast.error('Failed to disconnect');
    }
  };

  const updateSetting = async (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    try {
      await supabase.functions.invoke('get-student-hub-data', {
        body: { token: teacherToken, email, action: 'update_gcal_settings', gcalSettings: newSettings },
      });
    } catch (err) {
      console.error('Error saving gcal settings:', err);
    }
  };

  if (!email) {
    return null;
  }

  return (
    <StudentHubLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" /> Settings
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your preferences</p>
        </div>

        {/* Google Calendar Sync */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" /> Google Calendar Sync
            </CardTitle>
            <CardDescription>
              Connect your Google Calendar to automatically add lessons to your personal calendar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Checking connection...
              </div>
            ) : connected ? (
              <>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-700">Connected to Google Calendar</span>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto-add lessons to calendar</Label>
                      <p className="text-xs text-muted-foreground">Automatically add new lessons when booked</p>
                    </div>
                    <Switch
                      checked={settings.auto_add}
                      onCheckedChange={v => updateSetting('auto_add', v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Reminder before lesson</Label>
                      <p className="text-xs text-muted-foreground">Get a popup reminder in Google Calendar</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        className="w-20 h-8 text-sm"
                        value={settings.reminder_minutes}
                        onChange={e => updateSetting('reminder_minutes', parseInt(e.target.value) || 30)}
                        min={5}
                        max={1440}
                      />
                      <span className="text-sm text-muted-foreground">min</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Event color</Label>
                      <p className="text-xs text-muted-foreground">Color for lesson events in your calendar</p>
                    </div>
                    <Select value={settings.color_id} onValueChange={v => updateSetting('color_id', v)}>
                      <SelectTrigger className="w-40">
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: GCAL_COLOR_HEX[settings.color_id] || '#3f51b5' }} />
                          <SelectValue />
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        {GCAL_COLORS.map(c => (
                          <SelectItem key={c.v} value={c.v}>
                            <span className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: GCAL_COLOR_HEX[c.v] }} />
                              {c.l}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-2">
                  <Button variant="outline" size="sm" className="text-destructive" onClick={handleDisconnect}>
                    <XCircle className="h-3.5 w-3.5 mr-1" /> Disconnect Google Calendar
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  When connected, your booked lessons will automatically appear in your Google Calendar with reminders.
                </p>
                <Button onClick={handleConnect} disabled={connecting}>
                  {connecting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Calendar className="h-4 w-4 mr-2" />}
                  Connect Google Calendar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info card */}
        <Card>
          <CardContent className="pt-6">
            <div className="bg-muted/50 rounded-md p-4 text-sm text-muted-foreground space-y-2">
              <p className="font-medium">How it works:</p>
              <ul className="list-disc pl-4 space-y-1 text-xs">
                <li>When you connect your Google account, new lessons will be automatically added to your calendar.</li>
                <li>Each lesson gets a reminder notification before it starts.</li>
                <li>If a lesson is cancelled, it will be removed from your calendar.</li>
                <li>Your Google account is only used for calendar events — we don't access any other data.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </StudentHubLayout>
  );
}
