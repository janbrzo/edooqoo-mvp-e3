import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { addDays, format, startOfWeek, addWeeks, getDay } from 'date-fns';

export interface RecurrenceRule {
  id: string;
  teacher_id: string;
  day_of_week: number; // 0=Mon ... 6=Sun
  start_time: string;
  end_time: string;
  effective_from: string;
  effective_until: string | null;
  is_active: boolean;
  auto_generate_weeks_ahead: number;
  created_at: string;
}

export interface CreateRecurrenceInput {
  day_of_week: number;
  start_time: string;
  end_time: string;
  effective_from?: string;
  effective_until?: string | null;
  auto_generate_weeks_ahead?: number;
  student_id?: string | null;
  title?: string;
}

export function useCalendarRecurrence(teacherId?: string) {
  const [rules, setRules] = useState<RecurrenceRule[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRules = useCallback(async () => {
    if (!teacherId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('calendar_recurrence_rules')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('day_of_week')
        .order('start_time');

      if (error) throw error;
      setRules((data || []) as unknown as RecurrenceRule[]);
    } catch (err) {
      console.error('Error fetching recurrence rules:', err);
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  const createRule = useCallback(async (input: CreateRecurrenceInput) => {
    if (!teacherId) return null;
    try {
      const { data, error } = await supabase
        .from('calendar_recurrence_rules')
        .insert({
          teacher_id: teacherId,
          day_of_week: input.day_of_week,
          start_time: input.start_time,
          end_time: input.end_time,
          effective_from: input.effective_from || format(new Date(), 'yyyy-MM-dd'),
          effective_until: input.effective_until || null,
          auto_generate_weeks_ahead: input.auto_generate_weeks_ahead || 4,
        } as any)
        .select()
        .single();

      if (error) throw error;

      // Generate slots immediately
      const rule = data as unknown as RecurrenceRule;
      await generateSlotsForRule(rule);
      await fetchRules();
      toast({ title: 'Recurring slot created' });
      return rule;
    } catch (err: any) {
      toast({ title: 'Error creating recurring slot', description: err.message, variant: 'destructive' });
      return null;
    }
  }, [teacherId, toast, fetchRules]);

  const generateSlotsForRule = useCallback(async (rule: RecurrenceRule) => {
    if (!teacherId) return;
    
    const weeksAhead = rule.auto_generate_weeks_ahead || 4;
    const today = new Date();
    const effectiveFrom = new Date(rule.effective_from);
    const startDate = effectiveFrom > today ? effectiveFrom : today;
    
    // Map our day_of_week (0=Mon) to JS getDay() (0=Sun)
    const jsDayMap = [1, 2, 3, 4, 5, 6, 0]; // Mon=1, Tue=2, ..., Sun=0
    const targetJsDay = jsDayMap[rule.day_of_week];

    const slotsToCreate: any[] = [];

    for (let w = 0; w < weeksAhead; w++) {
      const weekDate = addWeeks(startDate, w);
      // Find the target day in this week
      const currentJsDay = getDay(weekDate);
      let diff = targetJsDay - currentJsDay;
      if (diff < 0) diff += 7;
      const slotDate = addDays(weekDate, diff);
      
      // Skip if before effective_from or after effective_until
      if (slotDate < effectiveFrom) continue;
      if (rule.effective_until && slotDate > new Date(rule.effective_until)) continue;
      // Skip past dates
      if (slotDate < today) continue;

      const slotDateStr = format(slotDate, 'yyyy-MM-dd');

      slotsToCreate.push({
        teacher_id: teacherId,
        slot_date: slotDateStr,
        start_time: rule.start_time,
        end_time: rule.end_time,
        status: (rule as any).student_id ? 'booked' : 'available',
        booking_type: 'recurring_instance',
        recurrence_rule_id: rule.id,
        student_id: (rule as any).student_id || null,
        title: (rule as any).title || null,
        booked_at: (rule as any).student_id ? new Date().toISOString() : null,
        confirmed_at: (rule as any).student_id ? new Date().toISOString() : null,
      });
    }

    if (slotsToCreate.length === 0) return;

    // Check for existing slots to avoid duplicates
    const dates = slotsToCreate.map(s => s.slot_date);
    const { data: existing } = await supabase
      .from('calendar_slots')
      .select('slot_date, start_time')
      .eq('teacher_id', teacherId)
      .eq('recurrence_rule_id', rule.id)
      .in('slot_date', dates);

    const existingSet = new Set(
      (existing || []).map((e: any) => `${e.slot_date}_${e.start_time}`)
    );

    const newSlots = slotsToCreate.filter(
      s => !existingSet.has(`${s.slot_date}_${s.start_time}`)
    );

    if (newSlots.length > 0) {
      const { error } = await supabase
        .from('calendar_slots')
        .insert(newSlots);
      if (error) console.error('Error generating recurring slots:', error);
    }
  }, [teacherId]);

  const deleteRule = useCallback(async (ruleId: string) => {
    try {
      const { error } = await supabase
        .from('calendar_recurrence_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;
      await fetchRules();
      toast({ title: 'Recurring rule deleted' });
    } catch (err: any) {
      toast({ title: 'Error deleting rule', description: err.message, variant: 'destructive' });
    }
  }, [fetchRules, toast]);

  const toggleRule = useCallback(async (ruleId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('calendar_recurrence_rules')
        .update({ is_active: isActive } as any)
        .eq('id', ruleId);

      if (error) throw error;
      await fetchRules();
    } catch (err: any) {
      toast({ title: 'Error updating rule', description: err.message, variant: 'destructive' });
    }
  }, [fetchRules, toast]);

  return { rules, loading, createRule, deleteRule, toggleRule, generateSlotsForRule, refetch: fetchRules };
}
