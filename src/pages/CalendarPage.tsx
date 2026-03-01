import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthFlow } from '@/hooks/useAuthFlow';
import { useCalendarSlots, CalendarSlot, ViewMode } from '@/hooks/useCalendarSlots';
import { useCalendarSettings } from '@/hooks/useCalendarSettings';
import { useCalendarRecurrence } from '@/hooks/useCalendarRecurrence';
import { useStudents } from '@/hooks/useStudents';
import { useCalendarVacations } from '@/hooks/useCalendarVacations';
import { CalendarWeekView } from '@/components/calendar/CalendarWeekView';
import { CalendarDayView } from '@/components/calendar/CalendarDayView';
import { CalendarMonthView } from '@/components/calendar/CalendarMonthView';
import { CalendarScheduleView } from '@/components/calendar/CalendarScheduleView';
import { CalendarToolbar } from '@/components/calendar/CalendarToolbar';
import { UnifiedSlotModal } from '@/components/calendar/UnifiedSlotModal';
import { SlotDetailModal } from '@/components/calendar/SlotDetailModal';
import { LinkWorksheetModal } from '@/components/calendar/LinkWorksheetModal';
import { CalendarNotificationBell } from '@/components/calendar/CalendarNotificationBell';
import { CalendarNotification } from '@/hooks/useCalendarNotifications';
import { AddStudentDialog } from '@/components/dashboard/AddStudentDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Filter, Search, Eye, EyeOff, Lock, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const LEGEND_ITEMS = [
  { key: 'available', label: 'Available', badge: 'A', color: 'bg-green-200 border-green-400' },
  { key: 'booked', label: 'Booked', badge: 'B', color: 'bg-blue-200 border-blue-400' },
  { key: 'pending', label: 'Pending', badge: 'P', color: 'bg-amber-200 border-amber-400' },
  { key: 'completed', label: 'Completed', badge: '✓', color: 'bg-emerald-200 border-emerald-400' },
  { key: 'no_show', label: 'No Show', badge: 'NS', color: 'bg-red-200 border-red-400' },
  { key: 'block', label: 'Block', badge: 'B', color: 'bg-gray-200 border-gray-400', icon: Lock },
  { key: 'deleted', label: 'Deleted', badge: 'D', color: 'bg-muted/50 border-border/50' },
];

const CalendarPage = () => {
  const { user, loading: authLoading, isRegisteredUser } = useAuthFlow();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !isRegisteredUser) navigate('/login');
  }, [authLoading, isRegisteredUser, navigate]);

  const {
    slots, loading, viewMode, setViewMode, currentDate, setCurrentDate,
    weekStart, weekEnd, showDeleted, setShowDeleted,
    createSlot, createSlotsBatch, updateSlot, deleteSlot, hardDeleteSlot, deleteSlotsBatch,
    navigate: calNavigate, getSlotsForDay, refetch,
  } = useCalendarSlots(user?.id);
  const { settings } = useCalendarSettings(user?.id);
  const { createRule } = useCalendarRecurrence(user?.id);
  const { students } = useStudents();
  const { vacations } = useCalendarVacations(user?.id);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalDate, setAddModalDate] = useState<Date | undefined>();
  const [addModalStartTime, setAddModalStartTime] = useState<string | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<CalendarSlot | null>(null);
  const [linkWorksheetSlot, setLinkWorksheetSlot] = useState<CalendarSlot | null>(null);
  const [studentFilter, setStudentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [legendFilter, setLegendFilter] = useState<string | null>(null);

  // Multi-select for batch delete
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedSlotIds, setSelectedSlotIds] = useState<Set<string>>(new Set());

  // Add student dialog (from notification)
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [addStudentPrefill, setAddStudentPrefill] = useState<{ name: string; email: string } | null>(null);

  // Sync selectedSlot with fresh slots data
  useEffect(() => {
    if (selectedSlot) {
      const fresh = slots.find(s => s.id === selectedSlot.id);
      if (fresh && JSON.stringify(fresh) !== JSON.stringify(selectedSlot)) {
        setSelectedSlot(fresh);
      }
    }
  }, [slots]);

  const studentMap = useMemo(() => {
    const map: Record<string, string> = {};
    students.forEach(s => { map[s.id] = s.name; });
    return map;
  }, [students]);

  const studentList = useMemo(() => students.map(s => ({ id: s.id, name: s.name })), [students]);

  // Students with email for notification bell
  const studentsWithEmail = useMemo(() => students.map(s => ({ id: s.id, name: s.name, student_email: (s as any).student_email })), [students]);

  const filteredSlots = useMemo(() => {
    let result = slots;
    if (studentFilter !== 'all') {
      result = result.filter(s => s.student_id === studentFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        (s.student_id && studentMap[s.student_id]?.toLowerCase().includes(q)) ||
        s.notes?.toLowerCase().includes(q) ||
        s.title?.toLowerCase().includes(q)
      );
    }
    // Legend filter
    if (legendFilter) {
      result = result.filter(s => {
        if (legendFilter === 'block') return (s as any).slot_type === 'block';
        if (legendFilter === 'pending') return s.status === 'booked' && !s.confirmed_at;
        if (legendFilter === 'booked') return s.status === 'booked' && !!s.confirmed_at;
        if (legendFilter === 'deleted') return (s.status as any) === 'deleted';
        return s.status === legendFilter;
      });
    }
    return result;
  }, [slots, studentFilter, searchQuery, studentMap, legendFilter]);

  const filteredGetSlotsForDay = useMemo(() => {
    return (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
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
      if (slot.student_id) return;
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
    setLinkWorksheetSlot({ ...slot, student_id: studentId ?? slot.student_id } as CalendarSlot);
  };

  const handleWorksheetLinked = async (worksheetId: string | null) => {
    if (linkWorksheetSlot) {
      const updates: any = { worksheet_id: worksheetId };
      const originalSlot = slots.find(s => s.id === linkWorksheetSlot.id);
      if (originalSlot && linkWorksheetSlot.student_id !== originalSlot.student_id) {
        updates.student_id = linkWorksheetSlot.student_id;
        updates.status = linkWorksheetSlot.student_id ? 'booked' : 'available';
        if (linkWorksheetSlot.student_id) {
          updates.booked_at = new Date().toISOString();
          updates.booked_by = 'teacher';
          updates.confirmed_at = new Date().toISOString();
        }
      }
      await updateSlot(linkWorksheetSlot.id, updates);
    }
  };

  const handleLinkWorksheetBack = () => {
    setLinkWorksheetSlot(null);
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

  const handleUnifiedModalLinkWorksheet = (studentId: string | null) => {
    if (user) {
      setLinkWorksheetSlot({ student_id: studentId, worksheet_id: null, id: '__new__' } as any);
    }
  };

  const handleNotificationClick = (n: CalendarNotification) => {
    if (n.slot_id) {
      const slot = slots.find(s => s.id === n.slot_id);
      if (slot) {
        setSelectedSlot(slot);
      }
    }
  };

  const handleAddStudentFromNotification = (name: string, email: string) => {
    setAddStudentPrefill({ name, email });
    setAddStudentOpen(true);
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
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-8 w-40 pl-7 text-xs"
              />
            </div>
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
            <Button
              variant={showDeleted ? 'default' : 'outline'}
              size="sm"
              className="h-8 text-xs"
              onClick={() => setShowDeleted(!showDeleted)}
            >
              {showDeleted ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
              {showDeleted ? 'Hide Deleted' : 'Show Deleted'}
            </Button>
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
            <CalendarNotificationBell
              teacherId={user?.id}
              students={studentsWithEmail}
              onNotificationClick={handleNotificationClick}
              onAddStudentClick={handleAddStudentFromNotification}
            />
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
          onLogs={() => navigate('/calendar/logs')}
        />

        {/* Legend with clickable filters */}
        <div className="flex flex-wrap gap-3 text-xs items-center">
          {LEGEND_ITEMS.map(item => (
            <button
              key={item.key}
              className={cn(
                'flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors',
                legendFilter === item.key ? 'ring-2 ring-primary bg-primary/10' : 'hover:bg-muted/50'
              )}
              onClick={() => setLegendFilter(legendFilter === item.key ? null : item.key)}
            >
              <span className={cn('w-3 h-3 rounded border text-[8px] font-bold flex items-center justify-center', item.color)}>
                {item.badge}
              </span>
              {item.label}
            </button>
          ))}
          {legendFilter && (
            <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => setLegendFilter(null)}>
              <X className="h-3 w-3 mr-1" /> Clear filter
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">Loading calendar...</div>
        ) : viewMode === 'day' ? (
          <CalendarDayView date={currentDate} slots={filteredGetSlotsForDay(currentDate)} studentMap={studentMap} onSlotClick={handleSlotClick} onAddSlot={handleAddSlot} selectionMode={selectionMode} selectedIds={selectedSlotIds} startHour={settings?.display_start_hour} endHour={settings?.display_end_hour} />
        ) : viewMode === 'month' ? (
          <CalendarMonthView currentDate={currentDate} slots={filteredSlots} studentMap={studentMap} onDayClick={handleDayClick} onAddSlot={(date) => handleAddSlot(date)} onSlotClick={handleSlotClick} />
        ) : viewMode === 'schedule' ? (
          <CalendarScheduleView slots={filteredSlots} studentMap={studentMap} onSlotClick={handleSlotClick} />
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
        onLinkWorksheet={handleUnifiedModalLinkWorksheet}
      />

      <SlotDetailModal
        open={!!selectedSlot && !linkWorksheetSlot}
        onOpenChange={(open) => { if (!open) setSelectedSlot(null); }}
        slot={selectedSlot}
        studentName={selectedSlot?.student_id ? studentMap[selectedSlot.student_id] : undefined}
        students={studentList}
        onUpdate={updateSlot}
        onDelete={hardDeleteSlot}
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

      {/* Add Student Dialog (from notification) — no trigger button */}
      <AddStudentDialog
        open={addStudentOpen}
        onOpenChange={setAddStudentOpen}
        triggerButton={false}
        prefillName={addStudentPrefill?.name}
        prefillEmail={addStudentPrefill?.email}
      />
    </div>
  );
};

export default CalendarPage;
