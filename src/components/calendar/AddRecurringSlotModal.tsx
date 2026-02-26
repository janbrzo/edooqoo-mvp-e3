import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CreateRecurrenceInput } from '@/hooks/useCalendarRecurrence';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface Student {
  id: string;
  name: string;
}

interface AddRecurringSlotModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateRecurrenceInput) => Promise<any>;
  defaultDuration: number;
  students?: Student[];
}

export function AddRecurringSlotModal({ open, onOpenChange, onSubmit, defaultDuration, students = [] }: AddRecurringSlotModalProps) {
  const [dayOfWeek, setDayOfWeek] = useState('0');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [endMode, setEndMode] = useState<'weeks' | 'date'>('weeks');
  const [weeksAhead, setWeeksAhead] = useState('4');
  const [effectiveUntil, setEffectiveUntil] = useState('');
  const [studentId, setStudentId] = useState<string>('none');
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const handleStartTimeChange = (val: string) => {
    setStartTime(val);
    const [h, m] = val.split(':').map(Number);
    const endMinutes = h * 60 + m + defaultDuration;
    const eh = Math.floor(endMinutes / 60);
    const em = endMinutes % 60;
    if (eh < 24) {
      setEndTime(`${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    await onSubmit({
      day_of_week: Number(dayOfWeek),
      start_time: startTime,
      end_time: endTime,
      auto_generate_weeks_ahead: endMode === 'weeks' ? Number(weeksAhead) : 52,
      effective_until: endMode === 'date' && effectiveUntil ? effectiveUntil : null,
      student_id: studentId !== 'none' ? studentId : null,
      title: title || undefined,
    });
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Recurring Slot</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs">Day of Week</Label>
            <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAYS.map((day, i) => (
                  <SelectItem key={i} value={String(i)}>{day}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Start Time</Label>
              <Input type="time" value={startTime} onChange={e => handleStartTimeChange(e.target.value)} className="h-9" />
            </div>
            <div>
              <Label className="text-xs">End Time</Label>
              <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="h-9" />
            </div>
          </div>

          {/* Student assignment */}
          {students.length > 0 && (
            <div>
              <Label className="text-xs">Assign to student (optional)</Label>
              <Select value={studentId} onValueChange={setStudentId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Open slot (available for booking)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Open slot (available for booking)</SelectItem>
                  {students.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Title */}
          <div>
            <Label className="text-xs">Title (optional)</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Business English" className="h-9" />
          </div>

          {/* End mode */}
          <div className="space-y-2">
            <Label className="text-xs">Repeat until</Label>
            <RadioGroup value={endMode} onValueChange={v => setEndMode(v as any)} className="flex gap-4">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="weeks" id="r-weeks" />
                <Label htmlFor="r-weeks" className="text-xs font-normal">For X weeks</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="date" id="r-date" />
                <Label htmlFor="r-date" className="text-xs font-normal">Until date</Label>
              </div>
            </RadioGroup>

            {endMode === 'weeks' ? (
              <Select value={weeksAhead} onValueChange={setWeeksAhead}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2, 4, 6, 8, 12, 16].map(w => (
                    <SelectItem key={w} value={String(w)}>{w} weeks</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input type="date" value={effectiveUntil} onChange={e => setEffectiveUntil(e.target.value)} className="h-9" />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Creating...' : 'Create Recurring Slot'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
