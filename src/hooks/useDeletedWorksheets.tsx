import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DeletedWorksheetItem {
  id: string;
  title: string;
  created_at: string;
  deleted_at: string;
  form_data: any;
  ai_response: string;
  html_content: string;
  student_id?: string;
  generation_time_seconds?: number;
}

export const useDeletedWorksheets = (
  studentId?: string, 
  lightweight: boolean = false, 
  listView: boolean = false,
  page: number = 1,
  pageSize: number = 20
) => {
  const [deletedWorksheets, setDeletedWorksheets] = useState<DeletedWorksheetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchDeletedWorksheets();
  }, [studentId, page, pageSize]);

  const fetchDeletedWorksheets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // ✅ FIX: For list views, skip heavy columns (ai_response, html_content)
      const selectQuery = listView
        ? 'id, title, created_at, deleted_at, student_id, generation_time_seconds, form_data, audio_url, audio_duration, audio_voice, selected_audio, selected_image, media_metadata'
        : '*';

      let query = supabase
        .from('worksheets')
        .select(selectQuery, { count: 'exact' })
        .eq('teacher_id', user.id)
        .not('deleted_at', 'is', null) // Only fetch deleted worksheets
        .order('deleted_at', { ascending: false });

      // Apply pagination for list views BEFORE lightweight limit
      if (listView) {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);
      }

      // Apply limit only for Dashboard/Recent views (not for list views)
      if (lightweight && !listView) {
        query = query.limit(10);
      }

      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      const { data, error, count } = await query as any; // Type assertion for custom select

      if (error) throw error;
      setDeletedWorksheets(data || []);
      setTotalCount(count || 0);
    } catch (error: any) {
      console.error('Error fetching deleted worksheets:', error);
    } finally {
      setLoading(false);
    }
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

      // Refresh the deleted worksheets list
      await fetchDeletedWorksheets();
      
      return { success: true };
    } catch (error: any) {
      console.error('Error restoring worksheet:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    deletedWorksheets,
    loading,
    refetch: fetchDeletedWorksheets,
    restoreWorksheet,
    totalCount
  };
};