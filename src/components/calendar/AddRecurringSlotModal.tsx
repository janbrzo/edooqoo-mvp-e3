import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreateRecurrenceInput } from '@/hooks/useCalendarRecurrence';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface AddRecurringSlotModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateRecurrenceInput) => Promise<any>;
  defaultDuration: number;
}

export function AddRecurringSlotModal({ open, onOpenChange, onSubmit, defaultDuration }: AddRecurringSlotModalProps) {
  const [dayOfWeek, setDayOfWeek] = useState('0');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [weeksAhead, setWeeksAhead] = useState('4');
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
      auto_generate_weeks_ahead: Number(weeksAhead),
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
            <Label>Day of Week</Label>
            <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
              <SelectTrigger>
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
              <Label>Start Time</Label>
              <Input type="time" value={startTime} onChange={e => handleStartTimeChange(e.target.value)} />
            </div>
            <div>
              <Label>End Time</Label>
              <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Generate for next X weeks</Label>
            <Select value={weeksAhead} onValueChange={setWeeksAhead}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2, 4, 6, 8, 12].map(w => (
                  <SelectItem key={w} value={String(w)}>{w} weeks</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Creating...' : 'Create Recurring Slot'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
