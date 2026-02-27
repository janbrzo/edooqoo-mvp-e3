import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { format, addDays, getDay, isAfter } from 'date-fns';
import { CalendarIcon, User, Plus, Trash2, AlertTriangle, Info } from 'lucide-react';
import { CalendarSlot, CreateSlotInput } from '@/hooks/useCalendarSlots';
import { CreateRecurrenceInput } from '@/hooks/useCalendarRecurrence';

const DAYS_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DURATIONS = [30, 45, 60, 90, 120];

interface Student {
  id: string;
  name: string;
}

interface TimeSlotEntry {
  id: string;
  start: string;
  end: string;
}

type SlotType = 'available' | 'lesson';
type AvailableMode = 'single' | 'batch';
type LessonMode = 'single' | 'recurring';

interface ConflictInfo {
  date: string;
  time: string;
  hasStudent: boolean;
  studentName?: string;
  type: 'blocked' | 'replaceable';
}

interface UnifiedSlotModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateSingle: (input: CreateSlotInput) => Promise<any>;
  onCreateBatch: (inputs: CreateSlotInput[]) => Promise<any>;
  onCreateRecurring: (input: CreateRecurrenceInput) => Promise<any>;
  onDeleteSlot: (id: string) => Promise<void>;
  students: Student[];
  defaultDuration: number;
  defaultDate?: Date;
  defaultStartTime?: string;
  currentDate: Date;
  existingSlots: CalendarSlot[];
  studentMap: Record<string, string>;
}

function computeEndTime(start: string, duration: number): string {
  const [h, m] = start.split(':').map(Number);
  const totalMin = h * 60 + m + duration;
  const eh = Math.floor(totalMin / 60);
  const em = totalMin % 60;
  if (eh >= 24) return '23:59';
  return `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
}

function normalizeTime(t: string): string {
  return t.slice(0, 5);
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export function UnifiedSlotModal({
  open, onOpenChange, onCreateSingle, onCreateBatch, onCreateRecurring,
  onDeleteSlot, students, defaultDuration, defaultDate, defaultStartTime,
  currentDate, existingSlots, studentMap,
}: UnifiedSlotModalProps) {
  const [slotType, setSlotType] = useState<SlotType>('available');
  const [availableMode, setAvailableMode] = useState<AvailableMode>('single');
  const [lessonMode, setLessonMode] = useState<LessonMode>('single');

  // Single fields
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [duration, setDuration] = useState(String(defaultDuration));
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [studentId, setStudentId] = useState<string>('none');

  // Batch fields — time slot entries instead of working hours
  const [selectedDays, setSelectedDays] = useState([true, true, true, true, true, false, false]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [timeSlotEntries, setTimeSlotEntries] = useState<TimeSlotEntry[]>([]);

  // Recurring fields
  const [recurDayOfWeek, setRecurDayOfWeek] = useState('0');
  const [recurEndMode, setRecurEndMode] = useState<'weeks' | 'date'>('weeks');
  const [recurWeeks, setRecurWeeks] = useState('4');
  const [recurUntilDate, setRecurUntilDate] = useState('');

  const [saving, setSaving] = useState(false);
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([]);
  const [conflictBlocked, setConflictBlocked] = useState(false);

  // Reset on open
  useEffect(() => {
    if (open) {
      const d = defaultDate || currentDate;
      setDate(format(d, 'yyyy-MM-dd'));
      const st = defaultStartTime || '09:00';
      setStartTime(st);
      const dur = Number(duration);
      setEndTime(computeEndTime(st, dur));
      setTitle('');
      setNotes('');
      setStudentId('none');
      setConflicts([]);
      setConflictBlocked(false);
      setDateFrom(format(d, 'yyyy-MM-dd'));
      setDateTo(format(addDays(d, 27), 'yyyy-MM-dd'));
      // Initialize batch time slots
      setTimeSlotEntries([{ id: generateId(), start: st, end: computeEndTime(st, dur) }]);
    }
  }, [open, defaultDate, defaultStartTime]);

  // Reset conflicts when inputs change
  useEffect(() => {
    if (conflicts.length > 0) {
      setConflicts([]);
      setConflictBlocked(false);
    }
  }, [date, startTime, endTime, dateFrom, dateTo, selectedDays, studentId, slotType]);

  // Auto-compute end time from duration
  const handleDurationChange = (val: string) => {
    setDuration(val);
    setEndTime(computeEndTime(startTime, Number(val)));
    // Update batch entries too
    setTimeSlotEntries(prev => prev.map(e => ({ ...e, end: computeEndTime(e.start, Number(val)) })));
  };

  const handleStartTimeChange = (val: string) => {
    setStartTime(val);
    setEndTime(computeEndTime(val, Number(duration)));
  };

  // Auto-fill title for lessons
  useEffect(() => {
    if (slotType === 'lesson' && studentId !== 'none' && !title) {
      const student = students.find(s => s.id === studentId);
      if (student) setTitle(`${student.name} — English lesson`);
    }
  }, [slotType, studentId]);

  // Batch time slot management
  const addTimeSlotEntry = () => {
    const last = timeSlotEntries[timeSlotEntries.length - 1];
    const newStart = last ? last.end : '09:00';
    setTimeSlotEntries(prev => [...prev, { id: generateId(), start: newStart, end: computeEndTime(newStart, Number(duration)) }]);
  };

  const removeTimeSlotEntry = (id: string) => {
    if (timeSlotEntries.length <= 1) return;
    setTimeSlotEntries(prev => prev.filter(e => e.id !== id));
  };

  const updateTimeSlotEntry = (id: string, field: 'start' | 'end', value: string) => {
    setTimeSlotEntries(prev => prev.map(e => {
      if (e.id !== id) return e;
      if (field === 'start') return { ...e, start: value, end: computeEndTime(value, Number(duration)) };
      return { ...e, [field]: value };
    }));
  };

  // Generate batch slots from time entries × days × date range
  const batchSlots = useMemo(() => {
    if (slotType !== 'available' || availableMode !== 'batch') return [];
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    if (isNaN(from.getTime()) || isNaN(to.getTime())) return [];
    if (timeSlotEntries.length === 0) return [];

    const jsDayToOurDay = (jsDay: number) => jsDay === 0 ? 6 : jsDay - 1;
    const slots: CreateSlotInput[] = [];

    let d = from;
    while (!isAfter(d, to)) {
      const ourDay = jsDayToOurDay(getDay(d));
      if (selectedDays[ourDay]) {
        for (const entry of timeSlotEntries) {
          slots.push({
            slot_date: format(d, 'yyyy-MM-dd'),
            start_time: entry.start,
            end_time: entry.end,
          });
        }
      }
      d = addDays(d, 1);
    }
    return slots;
  }, [slotType, availableMode, dateFrom, dateTo, selectedDays, timeSlotEntries]);

  // Check conflicts with proper time normalization and 3-scenario logic
  const checkConflicts = (newSlots: CreateSlotInput[]): { blocked: boolean; replaceable: CalendarSlot[]; info: ConflictInfo[] } => {
    const info: ConflictInfo[] = [];
    let blocked = false;
    const replaceable: CalendarSlot[] = [];
    const isAddingLesson = slotType === 'lesson';

    for (const ns of newSlots) {
      const nsStart = normalizeTime(ns.start_time);
      const nsEnd = normalizeTime(ns.end_time);

      const overlapping = existingSlots.filter(ex =>
        ex.slot_date === ns.slot_date &&
        ex.status !== 'cancelled' &&
        normalizeTime(ex.start_time) < nsEnd &&
        normalizeTime(ex.end_time) > nsStart
      );
      for (const ov of overlapping) {
        const hasStudent = ov.student_id !== null;

        if (hasStudent) {
          // Any overlap with a lesson → BLOCK
          blocked = true;
          info.push({
            date: ov.slot_date,
            time: `${normalizeTime(ov.start_time)}–${normalizeTime(ov.end_time)}`,
            hasStudent: true,
            studentName: ov.student_id ? studentMap[ov.student_id] : undefined,
            type: 'blocked',
          });
        } else {
          // Overlap with available slot
          if (isAddingLesson) {
            // Lesson over available → REPLACEABLE (auto-replace)
            replaceable.push(ov);
            info.push({
              date: ov.slot_date,
              time: `${normalizeTime(ov.start_time)}–${normalizeTime(ov.end_time)}`,
              hasStudent: false,
              type: 'replaceable',
            });
          } else {
            // Available over available → just skip/replace silently
            replaceable.push(ov);
          }
        }
      }
    }
    return { blocked, replaceable, info };
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      if (slotType === 'available' && availableMode === 'single') {
        const newSlots = [{ slot_date: date, start_time: startTime, end_time: endTime }];
        const { blocked, info } = checkConflicts(newSlots);
        if (blocked) {
          setConflicts(info);
          setConflictBlocked(true);
          setSaving(false);
          return;
        }
        await onCreateSingle({ slot_date: date, start_time: startTime, end_time: endTime, title: title || undefined, notes: notes || undefined });
      } else if (slotType === 'available' && availableMode === 'batch') {
        if (batchSlots.length === 0) { setSaving(false); return; }
        const { blocked, info } = checkConflicts(batchSlots);
        if (blocked) {
          setConflicts(info);
          setConflictBlocked(true);
          setSaving(false);
          return;
        }
        await onCreateBatch(batchSlots);
      } else if (slotType === 'lesson' && lessonMode === 'single') {
        if (studentId === 'none') { setSaving(false); return; }
        const newSlots = [{ slot_date: date, start_time: startTime, end_time: endTime, student_id: studentId }];
        const { blocked, replaceable, info } = checkConflicts(newSlots);
        if (blocked) {
          setConflicts(info);
          setConflictBlocked(true);
          setSaving(false);
          return;
        }
        // Auto-replace available slots
        for (const r of replaceable) await onDeleteSlot(r.id);
        await onCreateSingle({
          slot_date: date, start_time: startTime, end_time: endTime,
          student_id: studentId, title: title || undefined, notes: notes || undefined,
        });
      } else if (slotType === 'lesson' && lessonMode === 'recurring') {
        if (studentId === 'none') { setSaving(false); return; }
        await onCreateRecurring({
          day_of_week: Number(recurDayOfWeek),
          start_time: startTime,
          end_time: endTime,
          auto_generate_weeks_ahead: recurEndMode === 'weeks' ? Number(recurWeeks) : 52,
          effective_until: recurEndMode === 'date' && recurUntilDate ? recurUntilDate : null,
          student_id: studentId,
          title: title || undefined,
        });
      }
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const isValid = (() => {
    if (slotType === 'lesson' && studentId === 'none') return false;
    if (slotType === 'available' && availableMode === 'batch' && batchSlots.length === 0) return false;
    return true;
  })();

  const mode = slotType === 'available' ? availableMode : lessonMode;
  const modalTitle = slotType === 'lesson' ? 'Add Lesson' : (availableMode === 'batch' ? 'Add Slots' : 'Add Slot');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{modalTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Top tabs: Available / Lesson */}
          <Tabs value={slotType} onValueChange={v => { setSlotType(v as SlotType); setConflicts([]); setConflictBlocked(false); }}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="available" className="text-xs">
                <CalendarIcon className="h-3.5 w-3.5 mr-1" /> Available Slot
              </TabsTrigger>
              <TabsTrigger value="lesson" className="text-xs">
                <User className="h-3.5 w-3.5 mr-1" /> Lesson
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Sub-mode toggle */}
          {slotType === 'available' ? (
            <div className="flex gap-1 p-0.5 bg-muted rounded-md">
              <button
                className={`flex-1 text-xs py-1.5 rounded-sm transition-colors ${availableMode === 'single' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setAvailableMode('single')}
              >Single Slot</button>
              <button
                className={`flex-1 text-xs py-1.5 rounded-sm transition-colors ${availableMode === 'batch' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setAvailableMode('batch')}
              >Batch Slots</button>
            </div>
          ) : (
            <div className="flex gap-1 p-0.5 bg-muted rounded-md">
              <button
                className={`flex-1 text-xs py-1.5 rounded-sm transition-colors ${lessonMode === 'single' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setLessonMode('single')}
              >Single Lesson</button>
              <button
                className={`flex-1 text-xs py-1.5 rounded-sm transition-colors ${lessonMode === 'recurring' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setLessonMode('recurring')}
              >Recurring Lesson</button>
            </div>
          )}

          {/* Student selector (lesson only) */}
          {slotType === 'lesson' && (
            <div>
              <Label className="text-xs">Student *</Label>
              <Select value={studentId} onValueChange={setStudentId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" disabled>Select a student</SelectItem>
                  {students.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* ─── SINGLE SLOT / SINGLE LESSON ─── */}
          {(mode === 'single') && (
            <>
              <div>
                <Label className="text-xs">Date</Label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-9" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Start</Label>
                  <Input type="time" value={startTime} onChange={e => handleStartTimeChange(e.target.value)} className="h-9" />
                </div>
                <div>
                  <Label className="text-xs">End</Label>
                  <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="h-9" />
                </div>
                <div>
                  <Label className="text-xs">Duration</Label>
                  <Select value={duration} onValueChange={handleDurationChange}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DURATIONS.map(d => (
                        <SelectItem key={d} value={String(d)}>{d} min</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          {/* ─── BATCH SLOTS ─── */}
          {slotType === 'available' && availableMode === 'batch' && (
            <>
              <div>
                <Label className="text-xs mb-2 block">Days of the week</Label>
                <div className="flex gap-3 flex-wrap">
                  {DAYS_LABELS.map((day, i) => (
                    <label key={i} className="flex items-center gap-1.5 cursor-pointer">
                      <Checkbox
                        checked={selectedDays[i]}
                        onCheckedChange={v => {
                          const next = [...selectedDays];
                          next[i] = !!v;
                          setSelectedDays(next);
                        }}
                      />
                      <span className="text-xs">{day}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">From</Label>
                  <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-9" />
                </div>
                <div>
                  <Label className="text-xs">To</Label>
                  <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-9" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Lesson Duration</Label>
                <Select value={duration} onValueChange={handleDurationChange}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DURATIONS.map(d => (
                      <SelectItem key={d} value={String(d)}>{d} min</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Time slot entries list */}
              <div className="space-y-2">
                <Label className="text-xs">Time slots</Label>
                {timeSlotEntries.map((entry, idx) => (
                  <div key={entry.id} className="flex items-center gap-2">
                    <Input type="time" value={entry.start} onChange={e => updateTimeSlotEntry(entry.id, 'start', e.target.value)} className="h-8 flex-1" />
                    <span className="text-xs text-muted-foreground">–</span>
                    <Input type="time" value={entry.end} onChange={e => updateTimeSlotEntry(entry.id, 'end', e.target.value)} className="h-8 flex-1" />
                    {timeSlotEntries.length > 1 && (
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => removeTimeSlotEntry(entry.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full h-8 text-xs" onClick={addTimeSlotEntry}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Time Slot
                </Button>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-md px-3 py-2 text-sm">
                This will create <span className="font-semibold text-primary">{batchSlots.length}</span> available slots
              </div>
            </>
          )}

          {/* ─── RECURRING LESSON ─── */}
          {slotType === 'lesson' && lessonMode === 'recurring' && (
            <>
              <div>
                <Label className="text-xs">Day of Week</Label>
                <Select value={recurDayOfWeek} onValueChange={setRecurDayOfWeek}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map((day, i) => (
                      <SelectItem key={i} value={String(i)}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Start</Label>
                  <Input type="time" value={startTime} onChange={e => handleStartTimeChange(e.target.value)} className="h-9" />
                </div>
                <div>
                  <Label className="text-xs">End</Label>
                  <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="h-9" />
                </div>
                <div>
                  <Label className="text-xs">Duration</Label>
                  <Select value={duration} onValueChange={handleDurationChange}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DURATIONS.map(d => (
                        <SelectItem key={d} value={String(d)}>{d} min</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Repeat until</Label>
                <RadioGroup value={recurEndMode} onValueChange={v => setRecurEndMode(v as any)} className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="weeks" id="u-weeks" />
                    <Label htmlFor="u-weeks" className="text-xs font-normal">For X weeks</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="date" id="u-date" />
                    <Label htmlFor="u-date" className="text-xs font-normal">Until date</Label>
                  </div>
                </RadioGroup>
                {recurEndMode === 'weeks' ? (
                  <Select value={recurWeeks} onValueChange={setRecurWeeks}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[2, 4, 6, 8, 12, 16].map(w => (
                        <SelectItem key={w} value={String(w)}>{w} weeks</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input type="date" value={recurUntilDate} onChange={e => setRecurUntilDate(e.target.value)} className="h-9" />
                )}
              </div>
            </>
          )}

          {/* Shared: Title + Notes (all modes except batch) */}
          {mode !== 'batch' && (
            <>
              <div>
                <Label className="text-xs">Title (optional)</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Business English" className="h-9" />
              </div>
              <div>
                <Label className="text-xs">Notes (optional)</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Visible to student" rows={2} />
              </div>
            </>
          )}

          {/* Worksheet link info for single lesson */}
          {slotType === 'lesson' && lessonMode === 'single' && studentId !== 'none' && (
            <div className="flex items-start gap-2 bg-muted/50 border border-border rounded-md px-3 py-2 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              <span>You can link a worksheet after creating the lesson, from the slot details view.</span>
            </div>
          )}

          {/* Conflict warning */}
          {conflicts.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2 text-sm space-y-1">
              <div className="flex items-center gap-1 font-medium text-destructive">
                <AlertTriangle className="h-4 w-4" />
                {conflictBlocked ? 'Conflicts detected — cannot proceed' : 'Conflicts detected — overlapping available slots will be replaced'}
              </div>
              {conflicts.slice(0, 5).map((c, i) => (
                <div key={i} className="text-xs text-muted-foreground">
                  {c.date} {c.time} {c.hasStudent ? `— Lesson with ${c.studentName || 'student'}` : '— Available slot'}
                  {c.type === 'replaceable' && ' (will be replaced)'}
                </div>
              ))}
              {conflicts.length > 5 && <div className="text-xs text-muted-foreground">...and {conflicts.length - 5} more</div>}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={handleSubmit} disabled={saving || !isValid || conflictBlocked}>
            {saving ? 'Creating...' : slotType === 'available' && availableMode === 'batch' ? `Create ${batchSlots.length} Slots` : slotType === 'lesson' ? 'Create Lesson' : 'Create Slot'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
