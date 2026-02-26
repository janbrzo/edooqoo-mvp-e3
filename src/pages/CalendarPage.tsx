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
import { AddSlotModal } from '@/components/calendar/AddSlotModal';
import { AddRecurringSlotModal } from '@/components/calendar/AddRecurringSlotModal';
import { SlotDetailModal } from '@/components/calendar/SlotDetailModal';
import { LinkWorksheetModal } from '@/components/calendar/LinkWorksheetModal';
import { BatchAddSlotsModal } from '@/components/calendar/BatchAddSlotsModal';
import { QuickWeekSetupModal } from '@/components/calendar/QuickWeekSetupModal';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const CalendarPage = () => {
  const { user, loading: authLoading, isRegisteredUser } = useAuthFlow();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !isRegisteredUser) navigate('/login');
  }, [authLoading, isRegisteredUser, navigate]);

  const {
    slots, loading, viewMode, setViewMode, currentDate, setCurrentDate,
    weekStart, weekEnd, createSlot, createSlotsBatch, updateSlot, deleteSlot,
    navigate: calNavigate, getSlotsForDay, refetch,
  } = useCalendarSlots(user?.id);
  const { settings } = useCalendarSettings(user?.id);
  const { rules, createRule } = useCalendarRecurrence(user?.id);
  const { students } = useStudents();

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalDate, setAddModalDate] = useState<Date | undefined>();
  const [addModalStartTime, setAddModalStartTime] = useState<string | undefined>();
  const [recurringModalOpen, setRecurringModalOpen] = useState(false);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [quickSetupOpen, setQuickSetupOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<CalendarSlot | null>(null);
  const [linkWorksheetSlot, setLinkWorksheetSlot] = useState<CalendarSlot | null>(null);

  const studentMap = useMemo(() => {
    const map: Record<string, string> = {};
    students.forEach(s => { map[s.id] = s.name; });
    return map;
  }, [students]);

  const studentList = useMemo(() => students.map(s => ({ id: s.id, name: s.name })), [students]);

  const handleAddSlot = (date?: Date, startTime?: string) => {
    setAddModalDate(date);
    setAddModalStartTime(startTime);
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

  const handleLinkWorksheet = (slot: CalendarSlot) => {
    setSelectedSlot(null);
    setLinkWorksheetSlot(slot);
  };

  const handleWorksheetLinked = async (worksheetId: string | null) => {
    if (linkWorksheetSlot) {
      await updateSlot(linkWorksheetSlot.id, { worksheet_id: worksheetId } as any);
    }
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
          currentDate={currentDate}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onNavigate={calNavigate}
          onAddSlot={() => handleAddSlot()}
          onSettings={() => navigate('/calendar/settings')}
          onShare={handleShare}
          onAddRecurring={() => setRecurringModalOpen(true)}
          onBatchAdd={() => setBatchModalOpen(true)}
          onQuickSetup={() => setQuickSetupOpen(true)}
        />

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-200 border border-green-400" /> Available</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-200 border border-blue-400" /> Booked</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-200 border border-amber-400" /> Pending</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-muted border border-border" /> Completed</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 border border-red-300" /> Cancelled/No Show</span>
        </div>

        {/* Views */}
        {loading ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">Loading calendar...</div>
        ) : viewMode === 'day' ? (
          <CalendarDayView
            date={currentDate}
            slots={getSlotsForDay(currentDate)}
            studentMap={studentMap}
            onSlotClick={handleSlotClick}
            onAddSlot={handleAddSlot}
          />
        ) : viewMode === 'month' ? (
          <CalendarMonthView
            currentDate={currentDate}
            slots={slots}
            studentMap={studentMap}
            onDayClick={handleDayClick}
            onAddSlot={(date) => handleAddSlot(date)}
            onSlotClick={handleSlotClick}
          />
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
        defaultStartTime={addModalStartTime}
        students={studentList}
        defaultDuration={settings?.default_lesson_duration_minutes || 60}
      />

      <AddRecurringSlotModal
        open={recurringModalOpen}
        onOpenChange={setRecurringModalOpen}
        onSubmit={handleRecurringCreated}
        defaultDuration={settings?.default_lesson_duration_minutes || 60}
        students={studentList}
      />

      <BatchAddSlotsModal
        open={batchModalOpen}
        onOpenChange={setBatchModalOpen}
        onSubmit={createSlotsBatch}
        students={studentList}
        defaultDuration={settings?.default_lesson_duration_minutes || 60}
        currentDate={currentDate}
      />

      <QuickWeekSetupModal
        open={quickSetupOpen}
        onOpenChange={setQuickSetupOpen}
        onSubmit={createSlotsBatch}
        defaultDuration={settings?.default_lesson_duration_minutes || 60}
      />

      <SlotDetailModal
        open={!!selectedSlot}
        onOpenChange={(open) => { if (!open) setSelectedSlot(null); }}
        slot={selectedSlot}
        studentName={selectedSlot?.student_id ? studentMap[selectedSlot.student_id] : undefined}
        onUpdate={updateSlot}
        onDelete={deleteSlot}
        onLinkWorksheet={handleLinkWorksheet}
      />

      {linkWorksheetSlot && user && (
        <LinkWorksheetModal
          open={!!linkWorksheetSlot}
          onOpenChange={(open) => { if (!open) setLinkWorksheetSlot(null); }}
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
