import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, addDays, getDay } from 'date-fns';
import { Sparkles } from 'lucide-react';
import { CreateSlotInput } from '@/hooks/useCalendarSlots';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface QuickWeekSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (inputs: CreateSlotInput[]) => Promise<any>;
  defaultDuration: number;
}

export function QuickWeekSetupModal({ open, onOpenChange, onSubmit, defaultDuration }: QuickWeekSetupModalProps) {
  const [startHour, setStartHour] = useState('09:00');
  const [endHour, setEndHour] = useState('17:00');
  const [selectedDays, setSelectedDays] = useState([true, true, true, true, true, false, false]);
  const [lessonDuration, setLessonDuration] = useState(String(defaultDuration));
  const [weeksAhead, setWeeksAhead] = useState('4');
  const [saving, setSaving] = useState(false);

  const jsDayToOurDay = (jsDay: number) => jsDay === 0 ? 6 : jsDay - 1;

  const generatedSlots = useMemo(() => {
    const duration = Number(lessonDuration);
    const weeks = Number(weeksAhead);
    const [sh, sm] = startHour.split(':').map(Number);
    const [eh, em] = endHour.split(':').map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    const today = new Date();
    const slots: CreateSlotInput[] = [];

    for (let w = 0; w < weeks; w++) {
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const d = addDays(today, w * 7 + dayOffset);
        const ourDay = jsDayToOurDay(getDay(d));
        if (!selectedDays[ourDay]) continue;
        if (d < today) continue;

        let current = startMin;
        while (current + duration <= endMin) {
          const sH = Math.floor(current / 60);
          const sM = current % 60;
          const eH = Math.floor((current + duration) / 60);
          const eM = (current + duration) % 60;
          slots.push({
            slot_date: format(d, 'yyyy-MM-dd'),
            start_time: `${String(sH).padStart(2, '0')}:${String(sM).padStart(2, '0')}`,
            end_time: `${String(eH).padStart(2, '0')}:${String(eM).padStart(2, '0')}`,
          });
          current += duration;
        }
      }
    }
    return slots;
  }, [startHour, endHour, selectedDays, lessonDuration, weeksAhead]);

  const handleSubmit = async () => {
    if (generatedSlots.length === 0) return;
    setSaving(true);
    await onSubmit(generatedSlots);
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Quick Week Setup
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Working hours */}
          <div>
            <Label className="text-xs mb-2 block">What are your typical working hours?</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] text-muted-foreground">From</Label>
                <Select value={startHour} onValueChange={setStartHour}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 7).map(h => (
                      <SelectItem key={h} value={`${String(h).padStart(2, '0')}:00`}>{String(h).padStart(2, '0')}:00</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">To</Label>
                <Select value={endHour} onValueChange={setEndHour}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => i + 13).map(h => (
                      <SelectItem key={h} value={`${String(h).padStart(2, '0')}:00`}>{String(h).padStart(2, '0')}:00</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Days */}
          <div>
            <Label className="text-xs mb-2 block">Which days do you usually teach?</Label>
            <div className="flex gap-3 flex-wrap">
              {DAYS.map((day, i) => (
                <label key={i} className="flex items-center gap-1.5 cursor-pointer">
                  <Checkbox
                    checked={selectedDays[i]}
                    onCheckedChange={v => {
                      const next = [...selectedDays];
                      next[i] = !!v;
                      setSelectedDays(next);
                    }}
                  />
                  <span className="text-xs">{day.slice(0, 3)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Lesson duration */}
          <div>
            <Label className="text-xs">Lesson duration</Label>
            <Select value={lessonDuration} onValueChange={setLessonDuration}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[30, 45, 60, 90, 120].map(d => (
                  <SelectItem key={d} value={String(d)}>{d} minutes</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Weeks ahead */}
          <div>
            <Label className="text-xs">Generate schedule for</Label>
            <Select value={weeksAhead} onValueChange={setWeeksAhead}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[2, 4, 6, 8].map(w => (
                  <SelectItem key={w} value={String(w)}>{w} weeks</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          <div className="bg-primary/5 border border-primary/20 rounded-md px-3 py-2 text-sm">
            This will create <span className="font-semibold text-primary">{generatedSlots.length}</span> available slots
            <span className="text-muted-foreground block text-xs mt-0.5">
              {selectedDays.filter(Boolean).length} days/week × {Number(lessonDuration)} min lessons × {weeksAhead} weeks
            </span>
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
