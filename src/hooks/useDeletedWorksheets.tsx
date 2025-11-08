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

export const useDeletedWorksheets = (studentId?: string, lightweight: boolean = false) => {
  const [deletedWorksheets, setDeletedWorksheets] = useState<DeletedWorksheetItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeletedWorksheets();
  }, [studentId]);

  const fetchDeletedWorksheets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('worksheets')
        .select('*')
        .eq('teacher_id', user.id)
        .not('deleted_at', 'is', null) // Only fetch deleted worksheets
        .order('deleted_at', { ascending: false });

      // ✅ FIX: Limit results in lightweight mode to avoid timeout
      if (lightweight) {
        query = query.limit(10);
      }

      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setDeletedWorksheets(data || []);
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
    restoreWorksheet
  };
};