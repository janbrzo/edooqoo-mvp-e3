import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { CreateSlotInput } from '@/hooks/useCalendarSlots';
import { CalendarIcon, User, Clock } from 'lucide-react';

interface Student {
  id: string;
  name: string;
}

interface AddSlotModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateSlotInput) => Promise<any>;
  defaultDate?: Date;
  defaultStartTime?: string;
  students: Student[];
  defaultDuration: number;
}

export function AddSlotModal({ open, onOpenChange, onSubmit, defaultDate, defaultStartTime, students, defaultDuration }: AddSlotModalProps) {
  const [tab, setTab] = useState<'available' | 'lesson'>('available');
  const [date, setDate] = useState(defaultDate ? format(defaultDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState(defaultStartTime || '09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [studentId, setStudentId] = useState<string>('none');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Reset form when modal opens with new defaults
  useEffect(() => {
    if (open) {
      setDate(defaultDate ? format(defaultDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
      const st = defaultStartTime || '09:00';
      setStartTime(st);
      computeEndTime(st);
      setStudentId('none');
      setTitle('');
      setNotes('');
    }
  }, [open, defaultDate, defaultStartTime]);

  const computeEndTime = (st: string) => {
    const [h, m] = st.split(':').map(Number);
    const endMinutes = h * 60 + m + defaultDuration;
    const eh = Math.floor(endMinutes / 60);
    const em = endMinutes % 60;
    if (eh < 24) {
      setEndTime(`${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`);
    }
  };

  const handleStartTimeChange = (val: string) => {
    setStartTime(val);
    computeEndTime(val);
  };

  // Auto-fill title for lesson tab
  useEffect(() => {
    if (tab === 'lesson' && studentId !== 'none') {
      const student = students.find(s => s.id === studentId);
      if (student && !title) {
        setTitle(`${student.name} — English lesson`);
      }
    }
  }, [tab, studentId]);

  const handleSubmit = async () => {
    setSaving(true);
    await onSubmit({
      slot_date: date,
      start_time: startTime,
      end_time: endTime,
      student_id: tab === 'lesson' && studentId !== 'none' ? studentId : null,
      title: title || undefined,
      notes: notes || undefined,
    });
    setSaving(false);
    onOpenChange(false);
  };

  const isValid = date && startTime && endTime && (tab === 'available' || studentId !== 'none');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Slot</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={v => setTab(v as any)}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="available" className="text-xs">
              <CalendarIcon className="h-3.5 w-3.5 mr-1" /> Available Slot
            </TabsTrigger>
            <TabsTrigger value="lesson" className="text-xs">
              <User className="h-3.5 w-3.5 mr-1" /> Lesson
            </TabsTrigger>
          </TabsList>

          <div className="space-y-3 mt-4">
            {/* Shared fields */}
            <div>
              <Label className="text-xs">Date</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-9" />
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

            {/* Lesson-specific: Student selector */}
            <TabsContent value="lesson" className="mt-0 space-y-3">
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
            </TabsContent>

            {/* Available-specific info */}
            <TabsContent value="available" className="mt-0">
              <p className="text-xs text-muted-foreground">
                This slot will be visible for student booking via your public calendar link.
              </p>
            </TabsContent>

            <div>
              <Label className="text-xs">Title (optional)</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Business English" className="h-9" />
            </div>

            <div>
              <Label className="text-xs">Notes (optional)</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Visible to student" rows={2} />
            </div>
          </div>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={handleSubmit} disabled={saving || !isValid}>
            {saving ? 'Creating...' : tab === 'lesson' ? 'Create Lesson' : 'Create Slot'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
