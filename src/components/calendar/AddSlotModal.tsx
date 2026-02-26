import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { CreateSlotInput } from '@/hooks/useCalendarSlots';

interface Student {
  id: string;
  name: string;
}

interface AddSlotModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateSlotInput) => Promise<any>;
  defaultDate?: Date;
  students: Student[];
  defaultDuration: number;
}

export function AddSlotModal({ open, onOpenChange, onSubmit, defaultDate, students, defaultDuration }: AddSlotModalProps) {
  const [date, setDate] = useState(defaultDate ? format(defaultDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [studentId, setStudentId] = useState<string>('none');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Update end time when start time changes
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
      slot_date: date,
      start_time: startTime,
      end_time: endTime,
      student_id: studentId === 'none' ? null : studentId,
      title: title || undefined,
      notes: notes || undefined,
    });
    setSaving(false);
    onOpenChange(false);
    // Reset
    setTitle('');
    setNotes('');
    setStudentId('none');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Lesson Slot</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Date</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
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
            <Label>Student (optional)</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger>
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

          <div>
            <Label>Title (optional)</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Business English" />
          </div>

          <div>
            <Label>Notes (optional)</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Visible to student" rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving || !date || !startTime || !endTime}>
            {saving ? 'Creating...' : 'Create Slot'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
