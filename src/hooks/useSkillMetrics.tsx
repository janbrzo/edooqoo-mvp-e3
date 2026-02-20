import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SkillMetric {
  id: string;
  student_id: string;
  teacher_id: string;
  skill_name: string;
  skill_category: string;
  current_mastery: number;
  trend: 'improving' | 'declining' | 'stable';
  total_events: number;
  last_event_at: string | null;
  first_event_at: string | null;
  mastery_history: Array<{ mastery: number; date: string }>;
  updated_at: string;
}

export interface CategoryMetric {
  category: string;
  avg_mastery: number;
  skill_count: number;
  total_events: number;
  trend: 'improving' | 'declining' | 'stable';
  last_activity: string | null;
}

export function useSkillMetrics(studentId: string, teacherId: string) {
  const skillsQuery = useQuery({
    queryKey: ['skill-metrics', studentId, teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_skill_metrics')
        .select('*')
        .eq('student_id', studentId)
        .eq('teacher_id', teacherId)
        .order('current_mastery', { ascending: false });

      if (error) throw error;
      return (data || []).map(row => ({
        ...row,
        current_mastery: Number(row.current_mastery) || 0,
        total_events: Number(row.total_events) || 0,
        trend: (row.trend as 'improving' | 'declining' | 'stable') || 'stable',
        mastery_history: (row.mastery_history as any[] || []),
      })) as SkillMetric[];
    },
    enabled: !!studentId && !!teacherId,
  });

  const categoriesQuery = useQuery({
    queryKey: ['category-metrics', studentId, teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_category_metrics')
        .select('*')
        .eq('student_id', studentId)
        .eq('teacher_id', teacherId);

      if (error) throw error;
      return (data || []).map(row => ({
        category: row.category as string,
        avg_mastery: Number(row.avg_mastery) || 0,
        skill_count: Number(row.skill_count) || 0,
        total_events: Number(row.total_events) || 0,
        trend: (row.trend as 'improving' | 'declining' | 'stable') || 'stable',
        last_activity: row.last_activity as string | null,
      })) as CategoryMetric[];
    },
    enabled: !!studentId && !!teacherId,
  });

  return {
    skills: skillsQuery.data || [],
    categories: categoriesQuery.data || [],
    isLoading: skillsQuery.isLoading || categoriesQuery.isLoading,
    error: skillsQuery.error || categoriesQuery.error,
    refetch: () => {
      skillsQuery.refetch();
      categoriesQuery.refetch();
    },
  };
}
