
import { useState, useEffect } from 'react';
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
  share_token?: string | null;
}

export const useWorksheetHistory = (
  studentId?: string, 
  lightweight: boolean = false, 
  listView: boolean = false,
  page: number = 1,
  pageSize: number = 20
) => {
  const [worksheets, setWorksheets] = useState<WorksheetHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const fetchWorksheets = async () => {
    try {
      console.log('[useWorksheetHistory] 🔄 Starting fetch...');
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      console.log('[useWorksheetHistory] 👤 User:', user?.id);
      
      if (!user) {
        console.log('[useWorksheetHistory] ❌ No user found');
        setWorksheets([]);
        setLoading(false);
        return;
      }

      console.log('[useWorksheetHistory] 📝 Building query for teacher_id:', user.id);
      console.log('[useWorksheetHistory] 🎯 Lightweight mode:', lightweight, 'List view:', listView);
      
      // ✅ FIX: For list views, skip heavy columns (ai_response, html_content)
      // These are only needed when opening a specific worksheet
      const selectQuery = listView 
        ? 'id, title, created_at, student_id, generation_time_seconds, form_data, audio_url, audio_duration, audio_voice, selected_audio, selected_image, media_metadata, share_token'
        : '*';
      
      let query = supabase
        .from('worksheets')
        .select(selectQuery, { count: 'exact' })
        .eq('teacher_id', user.id)
        .is('deleted_at', null);

      // Apply student filter BEFORE sorting and pagination (critical for correct filtering)
      if (studentId) {
        console.log('[useWorksheetHistory] 🎓 Filtering by student_id:', studentId);
        if (studentId === 'unassigned') {
          query = query.is('student_id', null);
        } else {
          query = query.eq('student_id', studentId);
        }
      }

      // Apply sorting
      query = query.order('created_at', { ascending: false });

      // Apply pagination for list views BEFORE lightweight limit
      if (listView) {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);
        console.log('[useWorksheetHistory] 📄 Applying pagination:', { page, pageSize, from, to });
      }

      // Apply limit only for Dashboard/Recent views (not for AllWorksheetsPage)
      if (lightweight && !listView) {
        console.log('[useWorksheetHistory] 📊 Applying limit(10) for recent views');
        query = query.limit(10);
      }

      console.log('[useWorksheetHistory] 🚀 Executing query...');
      const { data, error, count } = await query as any; // Type assertion for custom select

      if (error) {
        console.error('[useWorksheetHistory] ❌ Query error:', error);
        throw error;
      }
      
      console.log('[useWorksheetHistory] ✅ Query success! Worksheets found:', data?.length || 0);
      console.log('[useWorksheetHistory] 📊 Total count:', count);
      console.log('[useWorksheetHistory] 📊 First 3 worksheets:', data?.slice(0, 3).map(w => ({
        id: w.id,
        title: w.title,
        created_at: w.created_at
      })));
      
      setWorksheets(data || []);
      setTotalCount(count || 0);
    } catch (error: any) {
      console.error('[useWorksheetHistory] 💥 Fatal error:', error);
      setWorksheets([]);
    } finally {
      console.log('[useWorksheetHistory] ⏹️ Fetch completed');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorksheets();
  }, [studentId, page, pageSize]);

  const refetchWorksheets = async () => {
    setLoading(true);
    await fetchWorksheets();
  };

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
      await fetchWorksheets();
      
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
      await fetchWorksheets();
      
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
    restoreWorksheet,
    totalCount
  };
};
