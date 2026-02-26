import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, addDays, startOfWeek, endOfWeek, getDay, isAfter, isBefore, isSameDay } from 'date-fns';
import { Plus, Trash2 } from 'lucide-react';
import { CreateSlotInput } from '@/hooks/useCalendarSlots';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface Student {
  id: string;
  name: string;
}

interface BatchAddSlotsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (inputs: CreateSlotInput[]) => Promise<any>;
  students: Student[];
  defaultDuration: number;
  currentDate: Date;
}

interface TimeSlotEntry {
  id: string;
  start: string;
  end: string;
}

export function BatchAddSlotsModal({ open, onOpenChange, onSubmit, students, defaultDuration, currentDate }: BatchAddSlotsModalProps) {
  const ws = startOfWeek(currentDate, { weekStartsOn: 1 });
  const we = endOfWeek(currentDate, { weekStartsOn: 1 });

  const [selectedDays, setSelectedDays] = useState<boolean[]>([true, true, true, true, true, false, false]);
  const [dateFrom, setDateFrom] = useState(format(ws, 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(addDays(we, 21), 'yyyy-MM-dd'));
  const [timeSlots, setTimeSlots] = useState<TimeSlotEntry[]>([
    { id: '1', start: '09:00', end: '10:00' },
  ]);
  const [studentId, setStudentId] = useState<string>('none');
  const [saving, setSaving] = useState(false);

  const addTimeSlot = () => {
    const lastSlot = timeSlots[timeSlots.length - 1];
    const [h, m] = lastSlot.end.split(':').map(Number);
    const newStart = lastSlot.end;
    const endMin = h * 60 + m + defaultDuration;
    const eh = Math.min(Math.floor(endMin / 60), 23);
    const em = endMin % 60;
    const newEnd = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
    setTimeSlots([...timeSlots, { id: String(Date.now()), start: newStart, end: newEnd }]);
  };

  const removeTimeSlot = (id: string) => {
    if (timeSlots.length <= 1) return;
    setTimeSlots(timeSlots.filter(t => t.id !== id));
  };

  const updateTimeSlot = (id: string, field: 'start' | 'end', value: string) => {
    setTimeSlots(timeSlots.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  // JS getDay: 0=Sun, 1=Mon... Our selectedDays: 0=Mon, 1=Tue...
  const jsDayToOurDay = (jsDay: number) => jsDay === 0 ? 6 : jsDay - 1;

  const generatedSlots = useMemo(() => {
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    const slots: CreateSlotInput[] = [];

    let d = from;
    while (!isAfter(d, to)) {
      const ourDay = jsDayToOurDay(getDay(d));
      if (selectedDays[ourDay]) {
        for (const ts of timeSlots) {
          slots.push({
            slot_date: format(d, 'yyyy-MM-dd'),
            start_time: ts.start,
            end_time: ts.end,
            student_id: studentId !== 'none' ? studentId : null,
          });
        }
      }
      d = addDays(d, 1);
    }
    return slots;
  }, [dateFrom, dateTo, selectedDays, timeSlots, studentId]);

  const handleSubmit = async () => {
    if (generatedSlots.length === 0) return;
    setSaving(true);
    await onSubmit(generatedSlots);
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Batch Add Slots</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Days selection */}
          <div>
            <Label className="text-xs mb-2 block">Days of the week</Label>
            <div className="flex gap-2">
              {DAYS.map((day, i) => (
                <label key={i} className="flex flex-col items-center gap-1 cursor-pointer">
                  <Checkbox
                    checked={selectedDays[i]}
                    onCheckedChange={v => {
                      const next = [...selectedDays];
                      next[i] = !!v;
                      setSelectedDays(next);
                    }}
                  />
                  <span className="text-[10px] text-muted-foreground">{day}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Date range */}
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

          {/* Time slots */}
          <div>
            <Label className="text-xs mb-2 block">Time slots</Label>
            <div className="space-y-2">
              {timeSlots.map(ts => (
                <div key={ts.id} className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={ts.start}
                    onChange={e => updateTimeSlot(ts.id, 'start', e.target.value)}
                    className="h-8 w-28"
                  />
                  <span className="text-xs text-muted-foreground">–</span>
                  <Input
                    type="time"
                    value={ts.end}
                    onChange={e => updateTimeSlot(ts.id, 'end', e.target.value)}
                    className="h-8 w-28"
                  />
                  {timeSlots.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeTimeSlot(ts.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={addTimeSlot}>
                <Plus className="h-3 w-3 mr-1" /> Add time slot
              </Button>
            </div>
          </div>

          {/* Student */}
          <div>
            <Label className="text-xs">Assign to student (optional)</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Available slots" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Available slots (open for booking)</SelectItem>
                {students.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          <div className="bg-muted/50 rounded-md px-3 py-2 text-sm">
            This will create <span className="font-semibold text-primary">{generatedSlots.length}</span> slots
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={handleSubmit} disabled={saving || generatedSlots.length === 0}>
            {saving ? 'Creating...' : `Create ${generatedSlots.length} Slots`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
