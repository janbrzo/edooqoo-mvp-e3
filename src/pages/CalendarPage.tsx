import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthFlow } from '@/hooks/useAuthFlow';
import { useCalendarSlots, CalendarSlot, ViewMode } from '@/hooks/useCalendarSlots';
import { useCalendarSettings } from '@/hooks/useCalendarSettings';
import { useCalendarRecurrence } from '@/hooks/useCalendarRecurrence';
import { useStudents } from '@/hooks/useStudents';
import { CalendarWeekView } from '@/components/calendar/CalendarWeekView';
import { CalendarDayView } from '@/components/calendar/CalendarDayView';
import { CalendarMonthView } from '@/components/calendar/CalendarMonthView';
import { CalendarToolbar } from '@/components/calendar/CalendarToolbar';
import { UnifiedSlotModal } from '@/components/calendar/UnifiedSlotModal';
import { SlotDetailModal } from '@/components/calendar/SlotDetailModal';
import { LinkWorksheetModal } from '@/components/calendar/LinkWorksheetModal';
import { CalendarNotificationBell } from '@/components/calendar/CalendarNotificationBell';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Filter } from 'lucide-react';
import { toast } from 'sonner';

const CalendarPage = () => {
  const { user, loading: authLoading, isRegisteredUser } = useAuthFlow();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !isRegisteredUser) navigate('/login');
  }, [authLoading, isRegisteredUser, navigate]);

  const {
    slots, loading, viewMode, setViewMode, currentDate, setCurrentDate,
    weekStart, weekEnd, createSlot, createSlotsBatch, updateSlot, deleteSlot, deleteSlotsBatch,
    navigate: calNavigate, getSlotsForDay, refetch,
  } = useCalendarSlots(user?.id);
  const { settings } = useCalendarSettings(user?.id);
  const { createRule } = useCalendarRecurrence(user?.id);
  const { students } = useStudents();

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalDate, setAddModalDate] = useState<Date | undefined>();
  const [addModalStartTime, setAddModalStartTime] = useState<string | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<CalendarSlot | null>(null);
  const [linkWorksheetSlot, setLinkWorksheetSlot] = useState<CalendarSlot | null>(null);
  const [studentFilter, setStudentFilter] = useState<string>('all');

  // Multi-select for batch delete
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedSlotIds, setSelectedSlotIds] = useState<Set<string>>(new Set());

  const studentMap = useMemo(() => {
    const map: Record<string, string> = {};
    students.forEach(s => { map[s.id] = s.name; });
    return map;
  }, [students]);

  const studentList = useMemo(() => students.map(s => ({ id: s.id, name: s.name })), [students]);

  // Filter slots by student
  const filteredSlots = useMemo(() => {
    if (studentFilter === 'all') return slots;
    return slots.filter(s => s.student_id === studentFilter);
  }, [slots, studentFilter]);

  const filteredGetSlotsForDay = useMemo(() => {
    return (date: Date) => {
      const dateStr = date.toISOString().split('T')[0];
      return filteredSlots.filter(s => s.slot_date === dateStr);
    };
  }, [filteredSlots]);

  const handleAddSlot = (date?: Date, startTime?: string) => {
    setAddModalDate(date);
    setAddModalStartTime(startTime);
    setAddModalOpen(true);
  };

  const handleSlotClick = (slot: CalendarSlot) => {
    if (selectionMode) {
      // In selection mode: only toggle available slots
      if (slot.student_id) return; // Can't select lessons
      setSelectedSlotIds(prev => {
        const next = new Set(prev);
        if (next.has(slot.id)) next.delete(slot.id); else next.add(slot.id);
        return next;
      });
      return;
    }
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

  const handleLinkWorksheet = (slot: CalendarSlot, studentId?: string | null) => {
    // Keep selectedSlot open, overlay LinkWorksheet on top
    setLinkWorksheetSlot({ ...slot, student_id: studentId ?? slot.student_id } as CalendarSlot);
  };

  const handleWorksheetLinked = async (worksheetId: string | null) => {
    if (linkWorksheetSlot) {
      await updateSlot(linkWorksheetSlot.id, { worksheet_id: worksheetId } as any);
    }
  };

  const handleLinkWorksheetBack = () => {
    setLinkWorksheetSlot(null);
    // selectedSlot stays open
  };

  const handleRecurringCreated = async (input: any) => {
    const result = await createRule(input);
    if (result) await refetch();
    return result;
  };

  const handleDayClick = (date: Date) => {
    setCurrentDate(date);
    setViewMode('day');
  };

  const handleBatchDelete = async () => {
    if (selectedSlotIds.size === 0) return;
    const confirmed = window.confirm(`Delete ${selectedSlotIds.size} available slots?`);
    if (!confirmed) return;
    await deleteSlotsBatch(Array.from(selectedSlotIds));
    setSelectedSlotIds(new Set());
    setSelectionMode(false);
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedSlotIds(new Set());
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Calendar</h1>
          <div className="ml-auto flex items-center gap-2">
            {/* Student filter */}
            <Select value={studentFilter} onValueChange={setStudentFilter}>
              <SelectTrigger className="h-8 w-40 text-xs">
                <Filter className="h-3 w-3 mr-1" />
                <SelectValue placeholder="All students" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All students</SelectItem>
                {studentList.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!selectionMode ? (
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setSelectionMode(true)}>
                Select
              </Button>
            ) : (
              <div className="flex items-center gap-1">
                <Button variant="destructive" size="sm" className="h-8 text-xs" onClick={handleBatchDelete} disabled={selectedSlotIds.size === 0}>
                  Delete ({selectedSlotIds.size})
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={exitSelectionMode}>
                  Cancel
                </Button>
              </div>
            )}
            <CalendarNotificationBell teacherId={user?.id} />
          </div>
        </div>

        <CalendarToolbar
          currentDate={currentDate}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onNavigate={calNavigate}
          onAddSlot={() => handleAddSlot()}
          onSettings={() => navigate('/calendar/settings')}
          onShare={handleShare}
        />

        <div className="flex flex-wrap gap-3 text-xs">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-200 border border-green-400" /> Available</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-200 border border-blue-400" /> Booked</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-200 border border-amber-400" /> Pending</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-muted border border-border" /> Completed</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 border border-red-300" /> Cancelled/No Show</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">Loading calendar...</div>
        ) : viewMode === 'day' ? (
          <CalendarDayView date={currentDate} slots={filteredGetSlotsForDay(currentDate)} studentMap={studentMap} onSlotClick={handleSlotClick} onAddSlot={handleAddSlot} selectionMode={selectionMode} selectedIds={selectedSlotIds} startHour={settings?.display_start_hour} endHour={settings?.display_end_hour} />
        ) : viewMode === 'month' ? (
          <CalendarMonthView currentDate={currentDate} slots={filteredSlots} studentMap={studentMap} onDayClick={handleDayClick} onAddSlot={(date) => handleAddSlot(date)} onSlotClick={handleSlotClick} />
        ) : (
          <CalendarWeekView weekStart={weekStart} getSlotsForDay={filteredGetSlotsForDay} studentMap={studentMap} onSlotClick={handleSlotClick} onAddSlot={handleAddSlot} selectionMode={selectionMode} selectedIds={selectedSlotIds} startHour={settings?.display_start_hour} endHour={settings?.display_end_hour} />
        )}
      </div>

      <UnifiedSlotModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onCreateSingle={createSlot}
        onCreateBatch={createSlotsBatch}
        onCreateRecurring={handleRecurringCreated}
        onDeleteSlot={deleteSlot}
        students={studentList}
        defaultDuration={settings?.default_lesson_duration_minutes || 60}
        defaultDate={addModalDate}
        defaultStartTime={addModalStartTime}
        currentDate={currentDate}
        existingSlots={slots}
        studentMap={studentMap}
        teacherId={user?.id}
      />

      <SlotDetailModal
        open={!!selectedSlot && !linkWorksheetSlot}
        onOpenChange={(open) => { if (!open) setSelectedSlot(null); }}
        slot={selectedSlot}
        studentName={selectedSlot?.student_id ? studentMap[selectedSlot.student_id] : undefined}
        students={studentList}
        onUpdate={updateSlot}
        onDelete={deleteSlot}
        onLinkWorksheet={handleLinkWorksheet}
      />

      {linkWorksheetSlot && user && (
        <LinkWorksheetModal
          open={!!linkWorksheetSlot}
          onOpenChange={(open) => { if (!open) setLinkWorksheetSlot(null); }}
          onBack={handleLinkWorksheetBack}
          teacherId={user.id}
          studentId={linkWorksheetSlot.student_id}
          currentWorksheetId={linkWorksheetSlot.worksheet_id}
          onLink={handleWorksheetLinked}
        />
      )}
    </div>
  );
};

export default CalendarPage;
