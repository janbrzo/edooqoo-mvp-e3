
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WorksheetHistoryItem {
  id: string;
  title: string;
  created_at: string;
  form_data: any;
  ai_response: string;
  html_content: string;
  student_id?: string;
  generation_time_seconds?: number;
}

export const useWorksheetHistory = (studentId?: string) => {
  const [worksheets, setWorksheets] = useState<WorksheetHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  console.log('🎯 [useWorksheetHistory] Hook initialized with studentId:', studentId);

  useEffect(() => {
    console.log('🔍 [useWorksheetHistory] Effect triggered:', { studentId });
    
    const fetchWorksheets = async () => {
      console.log('🚀 [useWorksheetHistory] Starting fetch...', { studentId });
      try {
        const { data: { user } } = await supabase.auth.getUser();
        console.log('👤 [useWorksheetHistory] User check:', { 
          hasUser: !!user, 
          userId: user?.id 
        });
        
        if (!user) {
          console.warn('⚠️ [useWorksheetHistory] No user found, aborting fetch');
          return;
        }

        let query = supabase
          .from('worksheets')
          .select('id, title, created_at, form_data, ai_response, html_content, student_id, generation_time_seconds, audio_url, audio_transcript, audio_duration, audio_voice, selected_audio, selected_image, media_metadata')
          .eq('teacher_id', user.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (studentId) {
          console.log('🎯 [useWorksheetHistory] Filtering by student:', studentId);
          query = query.eq('student_id', studentId);
        } else {
          console.log('📋 [useWorksheetHistory] Fetching ALL worksheets (no student filter)');
        }

        const { data, error } = await query;

        if (error) {
          console.error('❌ [useWorksheetHistory] Query error:', error);
          throw error;
        }
        
        console.log('📋 [useWorksheetHistory] Worksheets fetched:', {
          count: data?.length || 0,
          studentId: studentId || 'all',
          firstThree: data?.slice(0, 3).map(w => ({ 
            id: w.id, 
            title: w.title, 
            created_at: w.created_at,
            student_id: w.student_id
          }))
        });
        
        setWorksheets(data || []);
        console.log('✅ [useWorksheetHistory] State updated with', data?.length || 0, 'worksheets');
      } catch (error: any) {
        console.error('💥 [useWorksheetHistory] Error fetching worksheets:', error);
      } finally {
        setLoading(false);
        console.log('🏁 [useWorksheetHistory] Fetch completed');
      }
    };

    fetchWorksheets();
  }, [studentId]);

  const refetchWorksheets = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase
      .from('worksheets')
      .select('id, title, created_at, form_data, ai_response, html_content, student_id, generation_time_seconds, audio_url, audio_transcript, audio_duration, audio_voice, selected_audio, selected_image, media_metadata')
      .eq('teacher_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (studentId) {
      query = query.eq('student_id', studentId);
    }

    const { data } = await query;
    setWorksheets(data || []);
    setLoading(false);
  }, [studentId]);

  const deleteWorksheet = async (worksheetId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Use direct RPC call with proper typing
      const { error } = await supabase.rpc('soft_delete_worksheet' as any, {
        p_worksheet_id: worksheetId,
        p_teacher_id: user.id
      });

      if (error) throw error;

      // Refresh the worksheets list
      await refetchWorksheets();
      
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting worksheet:', error);
      return { success: false, error: error.message };
    }
  };

  const getRecentWorksheets = (limit: number = 3) => {
    return worksheets.slice(0, limit);
  };

  const restoreWorksheet = async (worksheetId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Use direct update to restore worksheet (set deleted_at to null)
      const { error } = await supabase
        .from('worksheets')
        .update({ deleted_at: null })
        .eq('id', worksheetId)
        .eq('teacher_id', user.id);

      if (error) throw error;

      // Refresh the worksheets list
      await refetchWorksheets();
      
      return { success: true };
    } catch (error: any) {
      console.error('Error restoring worksheet:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    worksheets,
    loading,
    getRecentWorksheets,
    refetch: refetchWorksheets,
    deleteWorksheet,
    restoreWorksheet
  };
};
