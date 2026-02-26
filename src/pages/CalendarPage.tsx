import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthFlow } from '@/hooks/useAuthFlow';
import { useCalendarSlots, CalendarSlot } from '@/hooks/useCalendarSlots';
import { useCalendarSettings } from '@/hooks/useCalendarSettings';
import { useStudents } from '@/hooks/useStudents';
import { CalendarWeekView } from '@/components/calendar/CalendarWeekView';
import { CalendarToolbar } from '@/components/calendar/CalendarToolbar';
import { AddSlotModal } from '@/components/calendar/AddSlotModal';
import { SlotDetailModal } from '@/components/calendar/SlotDetailModal';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const CalendarPage = () => {
  const { user, loading: authLoading, isRegisteredUser } = useAuthFlow();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !isRegisteredUser) navigate('/login');
  }, [authLoading, isRegisteredUser, navigate]);

  const { slots, loading, weekStart, weekEnd, createSlot, updateSlot, deleteSlot, navigateWeek, getSlotsForDay } = useCalendarSlots(user?.id);
  const { settings } = useCalendarSettings(user?.id);
  const { students } = useStudents();

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalDate, setAddModalDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<CalendarSlot | null>(null);

  const studentMap = useMemo(() => {
    const map: Record<string, string> = {};
    students.forEach(s => { map[s.id] = s.name; });
    return map;
  }, [students]);

  const studentList = useMemo(() => students.map(s => ({ id: s.id, name: s.name })), [students]);

  const handleAddSlot = (date?: Date) => {
    setAddModalDate(date);
    setAddModalOpen(true);
  };

  const handleSlotClick = (slot: CalendarSlot) => {
    setSelectedSlot(slot);
  };

  const handleShare = () => {
    if (settings?.public_calendar_token) {
      const url = `${window.location.origin}/book/${settings.public_calendar_token}`;
      navigator.clipboard.writeText(url);
      toast.success('Public calendar link copied to clipboard!');
    } else {
      navigate('/calendar/settings');
      toast.info('Enable public calendar in settings first.');
    }
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Calendar</h1>
        </div>

        {/* Toolbar */}
        <CalendarToolbar
          weekStart={weekStart}
          weekEnd={weekEnd}
          onNavigate={navigateWeek}
          onAddSlot={() => handleAddSlot()}
          onSettings={() => navigate('/calendar/settings')}
          onShare={handleShare}
        />

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-200 border border-green-400" /> Available</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-200 border border-blue-400" /> Booked</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-200 border border-amber-400" /> Pending</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-muted border border-border" /> Completed</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 border border-red-300" /> Cancelled/No Show</span>
        </div>

        {/* Week View */}
        {loading ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">Loading calendar...</div>
        ) : (
          <CalendarWeekView
            weekStart={weekStart}
            getSlotsForDay={getSlotsForDay}
            studentMap={studentMap}
            onSlotClick={handleSlotClick}
            onAddSlot={handleAddSlot}
          />
        )}
      </div>

      {/* Modals */}
      <AddSlotModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onSubmit={createSlot}
        defaultDate={addModalDate}
        students={studentList}
        defaultDuration={settings?.default_lesson_duration_minutes || 60}
      />

      <SlotDetailModal
        open={!!selectedSlot}
        onOpenChange={(open) => { if (!open) setSelectedSlot(null); }}
        slot={selectedSlot}
        studentName={selectedSlot?.student_id ? studentMap[selectedSlot.student_id] : undefined}
        onUpdate={updateSlot}
        onDelete={deleteSlot}
      />
    </div>
  );
};

export default CalendarPage;
