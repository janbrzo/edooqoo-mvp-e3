

# Plan: Calendar & Booking — Runda napraw #5

## Zakres

11 problemów: 4 duże ficzery (płatności, GCal, Teams, eksport) + 7 bugów/ulepszeń UI.

---

## Problem 1: Śledzenie Płatności — pełne wdrożenie

### Obecny stan bazy danych
- `calendar_slots.is_paid` (boolean) — istnieje
- `calendar_payment_records` — tabela z kolumnami: id, teacher_id, student_id, slot_id, amount, currency, payment_type, lessons_count, is_confirmed, confirmed_at, confirmed_by, notes, created_at
- `calendar_student_settings` — kolumny: id, teacher_id, student_id, booking_mode_override, prepaid_lessons_remaining, lesson_price_override, created_at, updated_at
- `calendar_settings` — payment_tracking_enabled, default_lesson_price, currency

### Migracja SQL
```sql
-- Dodanie payment_method i payment_date
ALTER TABLE calendar_payment_records ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'cash';
ALTER TABLE calendar_payment_records ADD COLUMN IF NOT EXISTS payment_date date DEFAULT CURRENT_DATE;
```

### Zmiany w SlotDetailModal.tsx
Dodać sekcję "Payment" widoczną gdy `payment_tracking_enabled=true` i slot ma studenta (`isBooked`), po sekcji Notes:

```tsx
{/* Payment section - visible when payment_tracking_enabled */}
{paymentTrackingEnabled && isBooked && (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <Label className="text-xs">Payment</Label>
      <Badge variant={slot.is_paid ? 'default' : 'outline'}
        className={slot.is_paid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-50 text-red-700'}>
        {slot.is_paid ? '✓ Paid' : 'Unpaid'}
      </Badge>
    </div>
    <Button size="sm" variant="outline" className="text-xs h-7"
      onClick={handleTogglePaid}>
      {slot.is_paid ? 'Mark Unpaid' : 'Mark Paid'}
    </Button>
  </div>
)}
```

Logika `handleTogglePaid`:
```ts
const handleTogglePaid = async () => {
  const newPaid = !slot.is_paid;
  await onUpdate(slot.id, { is_paid: newPaid } as any);
  if (newPaid) {
    // Lookup price: student override → teacher default
    let price = defaultLessonPrice;
    if (editStudentId !== 'none') {
      const { data: ss } = await supabase.from('calendar_student_settings')
        .select('lesson_price_override').eq('student_id', editStudentId).eq('teacher_id', slot.teacher_id).maybeSingle();
      if ((ss as any)?.lesson_price_override) price = (ss as any).lesson_price_override;
    }
    await supabase.from('calendar_payment_records').insert({
      teacher_id: slot.teacher_id, student_id: editStudentId !== 'none' ? editStudentId : null,
      slot_id: slot.id, amount: price || 0, currency: currency || 'USD',
      payment_type: 'lesson', is_confirmed: true, confirmed_at: new Date().toISOString(), confirmed_by: 'teacher',
    } as any);
    // Deduct prepaid if applicable
    if (editStudentId !== 'none') {
      const { data: ss } = await supabase.from('calendar_student_settings')
        .select('prepaid_lessons_remaining').eq('student_id', editStudentId).eq('teacher_id', slot.teacher_id).maybeSingle();
      if ((ss as any)?.prepaid_lessons_remaining > 0) {
        await supabase.from('calendar_student_settings')
          .update({ prepaid_lessons_remaining: (ss as any).prepaid_lessons_remaining - 1 } as any)
          .eq('student_id', editStudentId).eq('teacher_id', slot.teacher_id);
      }
    }
  } else {
    // Remove payment record
    await supabase.from('calendar_payment_records').delete().eq('slot_id', slot.id);
  }
  await supabase.from('calendar_slot_logs').insert({
    slot_id: slot.id, teacher_id: slot.teacher_id, action: newPaid ? 'marked_paid' : 'marked_unpaid', actor: 'teacher',
    details: { amount: price, currency },
  } as any);
  toast.success(newPaid ? 'Marked as paid' : 'Marked as unpaid');
};
```

Trzeba pobrać `payment_tracking_enabled`, `default_lesson_price`, `currency` w komponencie. Dodać fetch w useEffect:
```ts
const [paymentTrackingEnabled, setPaymentTrackingEnabled] = useState(false);
const [defaultLessonPrice, setDefaultLessonPrice] = useState<number | null>(null);
const [currency, setCurrency] = useState('USD');

useEffect(() => {
  if (slot?.teacher_id) {
    supabase.from('calendar_settings')
      .select('payment_tracking_enabled, default_lesson_price, currency')
      .eq('teacher_id', slot.teacher_id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setPaymentTrackingEnabled(!!(data as any).payment_tracking_enabled);
          setDefaultLessonPrice((data as any).default_lesson_price);
          setCurrency((data as any).currency || 'USD');
        }
      });
  }
}, [slot?.teacher_id]);
```

### Widget na CalendarPage — Unpaid counter
W toolbarze dodać badge z liczbą nieopłaconych lekcji:
```tsx
// W CalendarPage, po fetch slots, policzyć unpaid
const unpaidCount = useMemo(() => slots.filter(s => 
  s.student_id && (s.status === 'booked' || s.status === 'completed' || s.status === 'needs_review') && !s.is_paid
).length, [slots]);
```
I wyświetlić obok Search:
```tsx
{unpaidCount > 0 && (
  <Button variant="outline" size="sm" className="h-8 text-xs text-red-600"
    onClick={() => setLegendFilter('unpaid')}>
    💰 {unpaidCount} unpaid
  </Button>
)}
```
Dodać filtr `unpaid` w legendzie:
```ts
if (legendFilter === 'unpaid') return !!s.student_id && !s.is_paid && ['booked','completed','needs_review'].includes(s.status);
```

### Per-student price w CalendarSettingsPage
W sekcji Payments dodać tabelkę ze studentami i ich cenami — ale to jest za duże. Prostsze: dodać link "Manage student prices" prowadzący do `/student/{id}` gdzie już są ustawienia.

**Pliki:** `src/components/calendar/SlotDetailModal.tsx`, `src/pages/CalendarPage.tsx`, migracja SQL

---

## Problem 2: Google Calendar — pełne wdrożenie

### Sekrety
User potwierdził że dodał GOOGLE_CLIENT_ID i GOOGLE_CLIENT_SECRET do Supabase secrets. ALE `fetch_secrets` nie wykazał ich — są prawdopodobnie dodane bezpośrednio w Supabase Dashboard (Edge Function secrets).

### Migracja SQL
```sql
-- Tokeny OAuth per teacher
CREATE TABLE IF NOT EXISTS calendar_gcal_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_expires_at timestamptz NOT NULL,
  gcal_calendar_id text DEFAULT 'primary',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(teacher_id)
);
ALTER TABLE calendar_gcal_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers manage own gcal tokens" ON calendar_gcal_tokens FOR ALL TO authenticated USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

-- Event ID mapping on slots
ALTER TABLE calendar_slots ADD COLUMN IF NOT EXISTS gcal_event_id text;
```

### Edge function: `gcal-auth-start/index.ts`
Generuje URL consent OAuth2:
```ts
Deno.serve(async (req) => {
  // CORS...
  const { teacherId, redirectUri } = await req.json();
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const scopes = 'https://www.googleapis.com/auth/calendar.events';
  const state = btoa(JSON.stringify({ teacherId }));
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&access_type=offline&prompt=consent&state=${state}`;
  return new Response(JSON.stringify({ authUrl }), { headers });
});
```

### Edge function: `gcal-auth-callback/index.ts`
Wymienia code na tokeny i zapisuje do `calendar_gcal_tokens`:
```ts
Deno.serve(async (req) => {
  const { code, redirectUri, teacherId } = await req.json();
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
  
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code, client_id: clientId!, client_secret: clientSecret!,
      redirect_uri: redirectUri, grant_type: 'authorization_code',
    }),
  });
  const tokens = await tokenRes.json();
  
  // Upsert to calendar_gcal_tokens
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  await supabase.from('calendar_gcal_tokens').upsert({
    teacher_id: teacherId,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
  }, { onConflict: 'teacher_id' });
  
  return new Response(JSON.stringify({ success: true }));
});
```

### Edge function: `gcal-sync/index.ts`
Tworzy/aktualizuje/usuwa eventy w GCal:
```ts
// Helper: refresh token if expired
async function getValidToken(supabase, teacherId) { ... }

// Main: sync a single slot
Deno.serve(async (req) => {
  const { teacherId, slotId, action } = await req.json(); // action: 'upsert' | 'delete'
  const supabase = createClient(...);
  
  const token = await getValidToken(supabase, teacherId);
  if (!token) return new Response(JSON.stringify({ error: 'Not connected to Google Calendar' }));
  
  const { data: slot } = await supabase.from('calendar_slots').select('*').eq('id', slotId).single();
  const { data: settings } = await supabase.from('calendar_settings').select('gcal_default_color, gcal_default_reminder_minutes, timezone').eq('teacher_id', teacherId).single();
  
  if (action === 'delete' && slot.gcal_event_id) {
    await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${slot.gcal_event_id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    });
    await supabase.from('calendar_slots').update({ gcal_event_id: null }).eq('id', slotId);
  } else if (action === 'upsert') {
    const event = {
      summary: slot.title || 'English Lesson',
      start: { dateTime: `${slot.slot_date}T${slot.start_time}`, timeZone: settings.timezone },
      end: { dateTime: `${slot.slot_date}T${slot.end_time}`, timeZone: settings.timezone },
      colorId: settings.gcal_default_color || '1',
      reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: settings.gcal_default_reminder_minutes || 30 }] },
    };
    
    if (slot.gcal_event_id) {
      // Update existing event
      await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${slot.gcal_event_id}`, {
        method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
    } else {
      // Create new event
      const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
      const created = await res.json();
      await supabase.from('calendar_slots').update({ gcal_event_id: created.id }).eq('id', slotId);
    }
  }
  return new Response(JSON.stringify({ success: true }));
});
```

### Triggery sync w kodzie frontend
W `useCalendarSlots.tsx` — po `createSlot`, `updateSlot`, po confirm/cancel w SlotDetailModal — wywołać:
```ts
if (gcalEnabled) {
  supabase.functions.invoke('gcal-sync', { body: { teacherId, slotId: data.id, action: 'upsert' } }).catch(console.error);
}
```
Warunek `gcalEnabled`: pobrać z `calendar_settings.gcal_integration_enabled`.

### UI w CalendarSettingsPage
W sekcji po Public Calendar, dodać nową kartę "Google Calendar":
```tsx
<Card id="gcal">
  <CardHeader><CardTitle>Google Calendar</CardTitle><CardDescription>Sync lessons to your Google Calendar</CardDescription></CardHeader>
  <CardContent className="space-y-4">
    {gcalConnected ? (
      <>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-700">✓ Connected</Badge>
          <Button variant="outline" size="sm" onClick={handleDisconnectGcal}>Disconnect</Button>
        </div>
        <div className="flex items-center justify-between">
          <Label>Auto-sync confirmed lessons</Label>
          <Switch checked={settings.gcal_integration_enabled} onCheckedChange={v => updateSettings({ gcal_integration_enabled: v })} />
        </div>
        <div className="flex items-center justify-between">
          <Label>Event color</Label>
          <Select value={settings.gcal_default_color || '1'} onValueChange={v => updateSettings({ gcal_default_color: v })}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[{v:'1',l:'Lavender'},{v:'2',l:'Sage'},{v:'3',l:'Grape'},{v:'4',l:'Flamingo'},{v:'5',l:'Banana'},{v:'6',l:'Tangerine'},{v:'7',l:'Peacock'},{v:'9',l:'Blueberry'},{v:'10',l:'Basil'},{v:'11',l:'Tomato'}].map(c => (
                <SelectItem key={c.v} value={c.v}>{c.l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between">
          <Label>Reminder (minutes before)</Label>
          <Input type="number" className="w-24" value={settings.gcal_default_reminder_minutes ?? 30} onChange={e => updateSettings({ gcal_default_reminder_minutes: Number(e.target.value) })} />
        </div>
      </>
    ) : (
      <Button onClick={handleConnectGcal}>
        <img src="https://www.gstatic.com/images/branding/product/1x/calendar_2020q4_48dp.png" className="h-5 w-5 mr-2" />
        Connect Google Calendar
      </Button>
    )}
  </CardContent>
</Card>
```

`handleConnectGcal`:
```ts
const redirectUri = `${window.location.origin}/calendar/settings`;
const { data } = await supabase.functions.invoke('gcal-auth-start', {
  body: { teacherId: user?.id, redirectUri },
});
if (data?.authUrl) window.location.href = data.authUrl;
```

Na stronie CalendarSettingsPage dodać useEffect sprawdzający URL params `?code=` po powrocie z Google:
```ts
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  if (code && user?.id) {
    supabase.functions.invoke('gcal-auth-callback', {
      body: { code, redirectUri: `${window.location.origin}/calendar/settings`, teacherId: user.id },
    }).then(() => { toast.success('Google Calendar connected!'); window.history.replaceState({}, '', '/calendar/settings'); fetchGcalStatus(); });
  }
}, [user?.id]);
```

Sprawdzanie statusu:
```ts
const [gcalConnected, setGcalConnected] = useState(false);
const fetchGcalStatus = async () => {
  const { data } = await supabase.from('calendar_gcal_tokens').select('id').eq('teacher_id', user?.id).maybeSingle();
  setGcalConnected(!!data);
};
useEffect(() => { if (user?.id) fetchGcalStatus(); }, [user?.id]);
```

SECTIONS dodać: `{ id: 'gcal', label: 'Google Calendar' }` po 'public'.

**Pliki:** migracja SQL, `supabase/functions/gcal-auth-start/index.ts`, `supabase/functions/gcal-auth-callback/index.ts`, `supabase/functions/gcal-sync/index.ts`, `src/pages/CalendarSettingsPage.tsx`, `src/hooks/useCalendarSlots.tsx`, `supabase/config.toml` (verify_jwt=false dla gcal functions)

---

## Problem 3: Integracja Teams — pełne wdrożenie

### Migracja SQL
```sql
ALTER TABLE calendar_slots ADD COLUMN IF NOT EXISTS meeting_link text;
```

### UI w SlotDetailModal.tsx
Po sekcji Worksheet, dodać pole Meeting Link:
```tsx
<div className="flex items-center justify-between">
  <Label className="text-xs">Meeting Link</Label>
  <div className="flex items-center gap-1">
    {editMeetingLink ? (
      <a href={editMeetingLink} target="_blank" className="text-xs text-blue-600 underline truncate max-w-[200px]">{editMeetingLink}</a>
    ) : (
      <span className="text-xs text-muted-foreground">None</span>
    )}
    <Button variant="ghost" size="sm" className="h-6 w-6 p-0"
      onClick={() => { const url = prompt('Enter meeting link (Teams/Zoom/Meet):', editMeetingLink || ''); if (url !== null) setEditMeetingLink(url); }}>
      <Link2 className="h-3 w-3" />
    </Button>
  </div>
</div>
```

State: `const [editMeetingLink, setEditMeetingLink] = useState(slot?.meeting_link || '');`
W handleSave: `updates.meeting_link = editMeetingLink || null;`
W useEffect reset: `setEditMeetingLink(slot.meeting_link || '');`

### W emailach
W `send-calendar-notification-email`, dodać `meetingLink` param i renderować przycisk "Join Meeting":
```ts
const meetingButton = meetingLink ? `<div style="margin-top: 12px;"><a href="${meetingLink}" style="display: inline-block; padding: 8px 20px; background: #7c3aed; color: white; border-radius: 6px; text-decoration: none;">Join Meeting</a></div>` : '';
```
Dodać `meetingButton` do emaili `booking_confirmation`, `lesson_reminder`, `new_booking_student`.

### Na /book
W `StudentBookingsSection`, dodać przycisk "Join Meeting" obok Open Worksheet:
```tsx
{booking.meeting_link && (
  <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => window.open(booking.meeting_link, '_blank')}>
    🎥 Join Meeting
  </Button>
)}
```
W `get-student-bookings` default query dodać `meeting_link` do select.

**Pliki:** migracja SQL, `src/components/calendar/SlotDetailModal.tsx`, `supabase/functions/send-calendar-notification-email/index.ts`, `src/components/calendar/StudentBookingsSection.tsx`, `supabase/functions/get-student-bookings/index.ts`

---

## Problem 4: Eksport danych — pełne wdrożenie

### Edge function: `calendar-export-csv/index.ts`
```ts
Deno.serve(async (req) => {
  // CORS + verify auth
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { teacherId, dateFrom, dateTo } = await req.json();
  
  const { data: slots } = await supabase.from('calendar_slots').select(`
    slot_date, start_time, end_time, status, notes, is_paid, title, student_id, confirmed_at, cancelled_at, cancelled_by
  `).eq('teacher_id', teacherId).gte('slot_date', dateFrom).lte('slot_date', dateTo).order('slot_date').order('start_time');
  
  // Get student names
  const studentIds = [...new Set((slots||[]).filter(s => s.student_id).map(s => s.student_id))];
  const { data: students } = await supabase.from('students').select('id, name, student_email').in('id', studentIds);
  const studentMap = {};
  (students || []).forEach(s => { studentMap[s.id] = s; });
  
  // Build CSV
  const headers = ['Date','Start','End','Student','Email','Status','Notes','Paid','Confirmed','Cancelled By'];
  const rows = (slots || []).map(s => {
    const st = s.student_id ? studentMap[s.student_id] : null;
    return [s.slot_date, s.start_time?.slice(0,5), s.end_time?.slice(0,5), st?.name||'', st?.student_email||'',
      s.status, (s.notes||'').replace(/,/g,';'), s.is_paid?'Yes':'No',
      s.confirmed_at?'Yes':'No', s.cancelled_by||''].join(',');
  });
  const csv = [headers.join(','), ...rows].join('\n');
  
  return new Response(csv, {
    headers: { ...corsHeaders, 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="calendar-export-${dateFrom}-${dateTo}.csv"` },
  });
});
```

### UI na CalendarToolbar lub CalendarPage
Dodać przycisk "Export" na toolbarze:
```tsx
<Button variant="outline" size="sm" onClick={handleExport}>
  <Download className="h-3 w-3 mr-1" /> Export
</Button>
```

```ts
const handleExport = async () => {
  const from = format(dateRange.from, 'yyyy-MM-dd');
  const to = format(dateRange.to, 'yyyy-MM-dd');
  const { data, error } = await supabase.functions.invoke('calendar-export-csv', {
    body: { teacherId: user?.id, dateFrom: from, dateTo: to },
  });
  if (data) {
    const blob = new Blob([data], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `calendar-${from}-${to}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }
};
```

**Pliki:** `supabase/functions/calendar-export-csv/index.ts`, `src/pages/CalendarPage.tsx`, `supabase/config.toml`

---

## Problem 5: Brak emaila po Add Lesson

**Root cause:** `send-calendar-notification-email/index.ts` NIE MA case `new_booking_student` w switch. Wywołanie z `useCalendarSlots.createSlot` (linia 252) pada na `default: → "Unknown notification type" → 400`.

**Fix:** Dodać case `new_booking_student` w edge function PRZED `default:` (po `batch_booking_student`, linia 257):

```ts
case 'new_booking_student':
  to = studentEmail;
  subject = `New lesson scheduled: ${lessonInfo}`;
  html = `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1a1a1a;">New Lesson Scheduled 📅</h2>
      <p>Hi ${studentName},</p>
      <p>Your teacher has scheduled a new lesson for you:</p>
      <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 4px 0;"><strong>Date:</strong> ${slotDate}</p>
        <p style="margin: 4px 0;"><strong>Time:</strong> ${slotTime}</p>
      </div>
      ${studentWorksheetButton}
      ${studentButton}
    </div>`;
  break;
```

Dodatkowo dodać `'new_booking_student'` do listy `isStudentEmail` (linia 30):
```ts
const isStudentEmail = ['booking_confirmation', 'booking_pending', 'booking_rejected', 'cancellation_student', 'cancellation_confirmed_by_student', 'reschedule_confirmation', 'reschedule_pending', 'reschedule_rejected', 'lesson_reminder', 'lesson_time_changed', 'new_booking_student'].includes(type);
```

**Drugi punkt:** SlotDetailModal.handleSave (linia 234-249) — po insercie notification, dodać wysyłkę emaila analogicznie do `useCalendarSlots.createSlot`. Po linii 248 (`catch (_) {}`) dodać:

```ts
// Send email to student
try {
  if ((studentData as any)?.student_email) {
    const { data: teacherProfile } = await supabase.from('profiles').select('email, first_name, last_name').eq('id', slot.teacher_id).maybeSingle();
    const { data: calSettings } = await supabase.from('calendar_settings').select('public_calendar_token, notify_email_on_lesson_created').eq('teacher_id', slot.teacher_id).maybeSingle();
    if ((calSettings as any)?.notify_email_on_lesson_created !== false) {
      const tName = [teacherProfile?.first_name, teacherProfile?.last_name].filter(Boolean).join(' ') || 'Your Teacher';
      const bUrl = calSettings?.public_calendar_token ? `${window.location.origin}/book/${calSettings.public_calendar_token}` : '';
      let sharedWsUrl: string | undefined;
      if (slot.worksheet_id) {
        const { data: ws } = await supabase.from('worksheets').select('share_token').eq('id', slot.worksheet_id).maybeSingle();
        if (ws?.share_token) sharedWsUrl = `${window.location.origin}/shared/${ws.share_token}`;
      }
      supabase.functions.invoke('send-calendar-notification-email', {
        body: {
          type: 'new_booking_student', studentEmail: (studentData as any).student_email,
          studentName: assignedName, slotDate: editDate, slotTime: editStartTime,
          teacherName: tName, teacherEmail: teacherProfile?.email || '',
          bookUrl: bUrl, sharedWorksheetUrl: sharedWsUrl,
        },
      }).catch(console.error);
    }
  }
} catch (_) {}
```

**Pliki:** `supabase/functions/send-calendar-notification-email/index.ts`, `src/components/calendar/SlotDetailModal.tsx`

---

## Problem 6: Link Worksheet na Available Slot auto-zapisuje

**Root cause:** `CalendarPage.handleWorksheetLinked` (linia 172-186) sprawdza `linkWorksheetSlot.student_id !== originalSlot.student_id` i jeśli true, ustawia `student_id`, `status: 'booked'`, `confirmed_at`. To jest błąd — worksheet linkowanie powinno zapisywać TYLKO `worksheet_id`.

**Fix:** Linia 172-186 zamienić na:
```ts
const handleWorksheetLinked = async (worksheetId: string | null) => {
  if (linkWorksheetSlot) {
    await updateSlot(linkWorksheetSlot.id, { worksheet_id: worksheetId } as any);
  }
};
```

Student zostanie zapisany gdy user kliknie "Save Changes" w SlotDetailModal, nie wcześniej.

**Plik:** `src/pages/CalendarPage.tsx`

---

## Problem 7: Przyciski "Save for Entire Series" wystają

**Fix:** Na `DraggableDialogFooter` (linia 744) dodać `max-h-[40vh] overflow-y-auto` i zmniejszyć "Save for Entire Series":

Linia 776-779:
```tsx
{isRecurring && hasChanges && (
  <Button size="sm" variant="outline" className="w-full text-xs h-7" onClick={handleEditSeries}>
    <Repeat className="h-3 w-3 mr-1" /> Save for Entire Series
  </Button>
)}
```
(Zmiana z `h-8` na `h-7`)

Plus dodać `overflow-y-auto` na content — już jest `max-h-[90vh] overflow-y-auto` na linia 580. Problem jest w footer, więc dodać `flex-shrink-0` do footer i upewnić się że content scrolluje:

Linia 744:
```tsx
<DraggableDialogFooter className="flex-col gap-1.5">
```
(Zmiana z `gap-2` na `gap-1.5`)

**Plik:** `src/components/calendar/SlotDetailModal.tsx`

---

## Problem 8: /book — ulepszenia UI

### 8A: Ukrywanie slotów po minięciu godziny startu

W `PublicBookingPage.tsx` linia 353, dodać check na `isToday(date)` i godzinę:
```tsx
daySlots.map(slot => {
  // Hide slots whose start time has passed (for today)
  if (isToday(date)) {
    const slotStart = parseISO(`${slot.slot_date}T${slot.start_time}`);
    if (isBefore(slotStart, new Date())) return null;
  }
  // ...rest
})
```

### 8B: Pending formatting jak Available

Linia 361-375 — zmienić pending slot na jednolinijkowy format:
```tsx
if (isPending) {
  return (
    <div key={slot.id} className="w-full text-xs py-1.5 px-2 rounded-md border border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300 text-center">
      <span className="flex items-center justify-center gap-1">
        <Clock className="h-3 w-3" />
        {timeDisplay.primary}
      </span>
      {timeDisplay.secondary && <span className="text-[9px] opacity-60">{timeDisplay.secondary}</span>}
    </div>
  );
}
```

### 8C: Show Past Lessons toggle + widoki

W `StudentBookingsSection.tsx`:
- Dodać state `const [showPast, setShowPast] = useState(false);`
- W CardHeader dodać toggle:
```tsx
<div className="flex items-center gap-2">
  <Switch checked={showPast} onCheckedChange={setShowPast} />
  <Label className="text-xs">Show past</Label>
</div>
```
- W `fetchBookings`, przekazać `includePast: showPast` do body
- W `get-student-bookings` default query, jeśli `body.includePast` to nie filtrować `.gte('slot_date', ...)`

Widoki (miesiąc, harmonogram, zakres dat) — dla MVP tylko Schedule (lista) jest wystarczający. Dodanie pełnych widoków to osobny feature.

### 8D: Pełne logi w History

W `StudentBookingsSection` linia 221-227, rozszerzyć render logów:
```tsx
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
```

**Pliki:** `src/pages/PublicBookingPage.tsx`, `src/components/calendar/StudentBookingsSection.tsx`, `supabase/functions/get-student-bookings/index.ts`

---

## Problem 9: /book kafelki — statusy, cancelled, filtry

### 9A: History — już jest (button istnieje linia 208-210)

### 9B: Statusy z tooltipami
Zmienić statusBadge (linia 143-149) na wielokrotne badge:
```tsx
<div className="flex gap-1 flex-wrap">
  {booking.confirmed_at && !isPending && (
    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300" title="Your lesson is confirmed and scheduled">Confirmed</Badge>
  )}
  {isPending && (
    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300" title="Waiting for teacher to confirm your booking">Pending</Badge>
  )}
  {booking.status === 'completed' && (
    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300" title="This lesson has been completed">✓ Completed</Badge>
  )}
  {booking.status === 'no_show' && (
    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300" title="You were marked as absent for this lesson">NS No Show</Badge>
  )}
  {booking.status === 'needs_review' && (
    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300" title="Teacher hasn't reviewed this lesson yet">? Needs Review</Badge>
  )}
</div>
```

### 9C: Show Cancelled
Dodać state `const [showCancelled, setShowCancelled] = useState(false);`
Przycisk w CardHeader:
```tsx
<Button variant={showCancelled ? 'default' : 'outline'} size="sm" className="text-xs h-7"
  onClick={() => setShowCancelled(!showCancelled)}>
  {showCancelled ? 'Hide Cancelled' : 'Show Cancelled'}
</Button>
```

W `get-student-bookings` dodać `includeCancelled` param. Jeśli true, dodać do query `.in('status', ['booked', 'completed', 'needs_review', 'no_show', 'cancelled'])`.

Ale cancelled sloty mają `student_id = null`. Więc lepsze podejście: osobne query na logi:
```ts
if (body.includeCancelled) {
  const { data: cancelledLogs } = await supabase.from('calendar_slot_logs')
    .select('slot_id, action, details, created_at')
    .eq('teacher_id', teacherId)
    .in('action', ['cancelled_by_student', 'cancelled_by_teacher'])
    .ilike('details->>student_email', email)
    .order('created_at', { ascending: false }).limit(20);
  // For each, fetch slot data
  const cancelledSlotIds = [...new Set((cancelledLogs||[]).map(l => l.slot_id))];
  if (cancelledSlotIds.length > 0) {
    const { data: cancelledSlots } = await supabase.from('calendar_slots')
      .select('id, slot_date, start_time, end_time, status, cancelled_at, cancelled_by, cancellation_reason, notes')
      .in('id', cancelledSlotIds);
    // Return as "cancelledBookings" in response
  }
}
```

W `StudentBookingsSection` wyświetlać cancelled bookings z badge SC/TC.

### 9D: Filtry
Dodać toolbar filtrów:
```tsx
const [statusFilter, setStatusFilter] = useState<string | null>(null);
// ...
<div className="flex gap-1 flex-wrap">
  {['completed', 'no_show', 'student_cancelled', 'teacher_cancelled'].map(f => (
    <Button key={f} variant={statusFilter === f ? 'default' : 'outline'} size="sm" className="text-xs h-6"
      onClick={() => setStatusFilter(statusFilter === f ? null : f)}>
      {f.replace(/_/g, ' ')}
    </Button>
  ))}
</div>
```

Filtrowanie:
```ts
const filteredBookings = bookings.filter(b => {
  if (!statusFilter) return true;
  if (statusFilter === 'completed') return b.status === 'completed';
  if (statusFilter === 'no_show') return b.status === 'no_show';
  return true;
});
```

**Pliki:** `src/components/calendar/StudentBookingsSection.tsx`, `supabase/functions/get-student-bookings/index.ts`

---

## Problem 10: E2E Test Plan

Checklist po implementacji:
1. Add Lesson + worksheet → email do studenta ✓
2. Available Slot → student + Link Worksheet → student NIE zapisany → Save Changes → student zapisany + email ✓
3. /book: book → notification + email ✓
4. /book: pending cancel → "cancelled request" (nie lesson) ✓
5. Recurring change time → przyciski mieszczą się ✓
6. /book: past slots znikają po godzinie startu ✓
7. /book: pending wygląda jednolinijkowo ✓
8. /book: History pełne logi ✓
9. Payment: Mark Paid/Unpaid ✓
10. GCal: connect → create lesson → event w GCal ✓

---

## Problem 11: Readiness Checklist

Plik `docs/CALENDAR_READINESS_CHECKLIST.md` — pełna lista gotowości.

---

## Kolejność wdrożenia

1. **Migracje SQL** (payment_method, gcal_tokens, gcal_event_id, meeting_link)
2. **Edge function fix** — `new_booking_student` case (Problem 5)
3. **handleWorksheetLinked fix** (Problem 6)
4. **SlotDetailModal** — email w handleSave, payment sekcja, meeting link, footer fix (Problem 5, 1, 3, 7)
5. **Edge functions** — gcal-auth-start, gcal-auth-callback, gcal-sync, calendar-export-csv (Problem 2, 4)
6. **CalendarSettingsPage** — GCal section + export (Problem 2, 4)
7. **CalendarPage** — unpaid counter, export button (Problem 1, 4)
8. **/book: past slots + pending format + show past** (Problem 8)
9. **/book: statusy, cancelled, filtry** (Problem 9)
10. **get-student-bookings** — includePast, includeCancelled, meeting_link (Problem 8, 9, 3)
11. **Deploy edge functions + docs**

## Pliki (podsumowanie)

| Plik | Zmiany |
|---|---|
| Migracja SQL | payment_method, gcal_tokens, gcal_event_id, meeting_link |
| `supabase/functions/send-calendar-notification-email/index.ts` | case `new_booking_student`, meetingButton |
| `supabase/functions/gcal-auth-start/index.ts` | Nowy |
| `supabase/functions/gcal-auth-callback/index.ts` | Nowy |
| `supabase/functions/gcal-sync/index.ts` | Nowy |
| `supabase/functions/calendar-export-csv/index.ts` | Nowy |
| `src/pages/CalendarPage.tsx` | handleWorksheetLinked fix, unpaid counter, export |
| `src/components/calendar/SlotDetailModal.tsx` | Email w handleSave, payment, meeting_link, footer |
| `src/pages/CalendarSettingsPage.tsx` | GCal section, SECTIONS update |
| `src/hooks/useCalendarSlots.tsx` | gcal-sync trigger po createSlot |
| `src/pages/PublicBookingPage.tsx` | Past slots, pending format |
| `src/components/calendar/StudentBookingsSection.tsx` | Show past, pełne logi, statusy+tooltips, cancelled, filtry |
| `supabase/functions/get-student-bookings/index.ts` | includePast, includeCancelled, meeting_link |
| `supabase/config.toml` | verify_jwt=false dla gcal + export functions |
| `docs/CALENDAR_READINESS_CHECKLIST.md` | Nowy |
| Docs (7 plików) | Update |

