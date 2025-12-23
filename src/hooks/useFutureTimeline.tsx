/**
 * Hook for managing future worksheet suggestions timeline
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { WorksheetSuggestion } from '@/types/studentProgress';

interface UseFutureTimelineProps {
  studentId: string;
  teacherId: string;
}

export const useFutureTimeline = ({ studentId, teacherId }: UseFutureTimelineProps) => {
  const [suggestions, setSuggestions] = useState<WorksheetSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchSuggestions = useCallback(async () => {
    if (!studentId || !teacherId) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('future_worksheet_suggestions')
        .select('*')
        .eq('student_id', studentId)
        .eq('teacher_id', teacherId)
        .is('deleted_at', null)
        .eq('is_used', false)
        .order('sequence_number', { ascending: true })
        .limit(4);

      if (error) throw error;

      setSuggestions(data || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  }, [studentId, teacherId]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  // Generate suggestions using AI
  const generateTimeline = async (
    studentName: string,
    englishLevel: string,
    mainGoal: string,
    goals: Array<{ title: string; elements: Array<{ title: string; current_rating: number | null }> }>
  ): Promise<boolean> => {
    try {
      setGenerating(true);

      const response = await supabase.functions.invoke('generate-timeline', {
        body: {
          studentId,
          studentName,
          englishLevel,
          mainGoal,
          goals
        }
      });

      if (response.error) throw response.error;

      const newSuggestions = response.data?.suggestions || [];
      
      if (newSuggestions.length === 0) {
        toast.info('No suggestions generated. Add more goals and elements first.');
        return false;
      }

      // Clear existing unused suggestions
      await supabase
        .from('future_worksheet_suggestions')
        .update({ deleted_at: new Date().toISOString() })
        .eq('student_id', studentId)
        .eq('teacher_id', teacherId)
        .eq('is_used', false);

      // Insert new suggestions
      const insertData = newSuggestions.map((s: any, idx: number) => ({
        student_id: studentId,
        teacher_id: teacherId,
        sequence_number: idx + 1,
        suggested_topic: s.topic,
        suggested_goal: s.goal,
        suggested_exercises: s.exercises,
        rationale: s.rationale,
        source: 'ai_generated'
      }));

      const { data, error } = await supabase
        .from('future_worksheet_suggestions')
        .insert(insertData)
        .select();

      if (error) throw error;

      setSuggestions(data || []);
      toast.success(`Generated ${newSuggestions.length} worksheet suggestions`);
      return true;
    } catch (error) {
      console.error('Error generating timeline:', error);
      toast.error('Failed to generate timeline');
      return false;
    } finally {
      setGenerating(false);
    }
  };

  // Mark suggestion as used
  const useSuggestion = async (suggestionId: string, worksheetId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('future_worksheet_suggestions')
        .update({ 
          is_used: true,
          used_worksheet_id: worksheetId,
          used_at: new Date().toISOString()
        })
        .eq('id', suggestionId)
        .eq('teacher_id', teacherId);

      if (error) throw error;

      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
      return true;
    } catch (error) {
      console.error('Error marking suggestion as used:', error);
      return false;
    }
  };

  // Add manual suggestion
  const addSuggestion = async (
    topic: string,
    goal?: string,
    exercises?: string[],
    rationale?: string
  ): Promise<WorksheetSuggestion | null> => {
    try {
      const maxSeq = suggestions.length > 0 ? Math.max(...suggestions.map(s => s.sequence_number)) : 0;

      const { data, error } = await supabase
        .from('future_worksheet_suggestions')
        .insert({
          student_id: studentId,
          teacher_id: teacherId,
          sequence_number: maxSeq + 1,
          suggested_topic: topic,
          suggested_goal: goal || null,
          suggested_exercises: exercises || null,
          rationale: rationale || null,
          source: 'manual'
        })
        .select()
        .single();

      if (error) throw error;

      setSuggestions(prev => [...prev, data]);
      toast.success('Suggestion added');
      return data;
    } catch (error) {
      console.error('Error adding suggestion:', error);
      toast.error('Failed to add suggestion');
      return null;
    }
  };

  // Delete suggestion
  const deleteSuggestion = async (suggestionId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('future_worksheet_suggestions')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', suggestionId)
        .eq('teacher_id', teacherId);

      if (error) throw error;

      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
      toast.success('Suggestion removed');
      return true;
    } catch (error) {
      console.error('Error deleting suggestion:', error);
      toast.error('Failed to remove suggestion');
      return false;
    }
  };

  return {
    suggestions,
    loading,
    generating,
    refetch: fetchSuggestions,
    generateTimeline,
    useSuggestion,
    addSuggestion,
    deleteSuggestion
  };
};
