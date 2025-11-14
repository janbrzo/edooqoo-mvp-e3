import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface HomeworkAssignment {
  id: string;
  title: string;
  student_id: string | null;
  student_name: string | null;
  selected_exercises: any;
  deadline: string | null;
  share_token: string | null;
  view_count: number;
  viewed_at: string | null;
  created_at: string;
}

interface GroupedHomework {
  [worksheetId: string]: HomeworkAssignment[];
}

export const useAllWorksheetHomework = (worksheetIds: string[]) => {
  const [homeworkByWorksheet, setHomeworkByWorksheet] = useState<GroupedHomework>({});
  const [loading, setLoading] = useState(false);

  const fetchAllHomework = async () => {
    if (worksheetIds.length === 0) {
      setHomeworkByWorksheet({});
      return;
    }

    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from('homework_assignments')
        .select(`
          id,
          title,
          student_id,
          selected_exercises,
          deadline,
          share_token,
          view_count,
          viewed_at,
          created_at,
          source_worksheet_id,
          students (
            name
          )
        `)
        .eq('teacher_id', user.user.id)
        .in('source_worksheet_id', worksheetIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group homework by worksheet ID
      const grouped: GroupedHomework = {};
      data?.forEach((hw: any) => {
        const worksheetId = hw.source_worksheet_id;
        if (!grouped[worksheetId]) {
          grouped[worksheetId] = [];
        }
        grouped[worksheetId].push({
          id: hw.id,
          title: hw.title,
          student_id: hw.student_id,
          student_name: hw.students?.name || 'Unknown Student',
          selected_exercises: hw.selected_exercises,
          deadline: hw.deadline,
          share_token: hw.share_token,
          view_count: hw.view_count,
          viewed_at: hw.viewed_at,
          created_at: hw.created_at,
        });
      });

      setHomeworkByWorksheet(grouped);
    } catch (error) {
      console.error('Error fetching homework assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllHomework();
  }, [worksheetIds.join(',')]);

  // Listen for homework creation events
  useEffect(() => {
    const handleHomeworkCreated = (event: CustomEvent) => {
      const { worksheetId } = event.detail;
      if (worksheetIds.includes(worksheetId)) {
        fetchAllHomework();
      }
    };

    window.addEventListener('homeworkCreated' as any, handleHomeworkCreated);
    return () => {
      window.removeEventListener('homeworkCreated' as any, handleHomeworkCreated);
    };
  }, [worksheetIds]);

  return {
    homeworkByWorksheet,
    loading,
    refetch: fetchAllHomework,
  };
};
