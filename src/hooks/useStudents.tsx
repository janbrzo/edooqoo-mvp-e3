
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { toast } from '@/hooks/use-toast';
import { devLog } from '@/utils/logger';

type Student = Tables<'students'>;

export const useStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStudents = useCallback(async () => {
    try {
      devLog('📚 Fetching students...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setStudents([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('teacher_id', user.id)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      devLog('📚 Students fetched:', data?.length, 'students');
      devLog('📚 Students order:', data?.map(s => ({ name: s.name, updated_at: s.updated_at })));
      setStudents(data || []);
    } catch (error: any) {
      console.error('Error fetching students:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const addStudent = async (name: string, englishLevel: string, mainGoal: string, studentEmail?: string, sendOverdueEmails: boolean = true, nativeLanguage: string = 'Spanish') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      if (studentEmail) {
        const normalizedEmail = studentEmail.toLowerCase().trim();
        const { data: existing } = await supabase
          .from('students')
          .select('id')
          .eq('teacher_id', user.id)
          .ilike('student_email', normalizedEmail)
          .is('deleted_at', null)
          .maybeSingle();
        if (existing) {
          toast({ title: 'Error', description: 'A student with this email already exists.', variant: 'destructive' });
          throw new Error('Student with this email already exists');
        }
      }

      const userEmail = user.email;

      const { data, error } = await supabase
        .from('students')
        .insert([{
          name,
          english_level: englishLevel,
          main_goal: mainGoal,
          teacher_id: user.id,
          teacher_email: userEmail,
          student_email: studentEmail?.toLowerCase().trim() || null,
          send_overdue_emails: sendOverdueEmails,
          native_language: nativeLanguage
        }])
        .select()
        .single();

      if (error) throw error;

      setStudents(prevStudents => [data, ...prevStudents]);

      // Auto-generate permanent meeting link if setting is enabled
      try {
        const { data: calSettings } = await supabase.from('calendar_settings')
          .select('auto_create_student_meeting_link').eq('teacher_id', user.id).maybeSingle();
        if ((calSettings as any)?.auto_create_student_meeting_link) {
          const link = `https://meet.google.com/lookup/${btoa(`${user.id}-${data.id}`).replace(/[^a-zA-Z0-9]/g, '').slice(0, 12).toLowerCase()}`;
          await supabase.from('calendar_student_settings').insert({
            student_id: data.id, teacher_id: user.id, default_meeting_link: link,
          } as any);
        }
      } catch (_) {}
      
      toast({
        title: "Success",
        description: "Student added successfully",
      });

      return data;
    } catch (error: any) {
      console.error('Error adding student:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateStudent = async (id: string, updates: Partial<Pick<Student, 'name' | 'english_level' | 'main_goal' | 'student_email' | 'send_overdue_emails' | 'native_language'>>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const userEmail = user.email;
      const updatesWithEmail = {
        ...updates,
        teacher_email: userEmail
      };

      const { data, error } = await supabase
        .from('students')
        .update(updatesWithEmail)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setStudents(prevStudents => 
        prevStudents.map(student => 
          student.id === id ? { ...student, ...data } : student
        )
      );

      toast({
        title: "Success",
        description: "Student updated successfully",
      });

      return data;
    } catch (error: any) {
      console.error('Error updating student:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateStudentActivity = useCallback(async (studentId: string) => {
    try {
      devLog('🔄 UPDATING STUDENT ACTIVITY for:', studentId);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const userEmail = user.email;
      
      const { data, error } = await supabase
        .from('students')
        .update({ 
          updated_at: new Date().toISOString(),
          teacher_email: userEmail
        })
        .eq('id', studentId)
        .is('deleted_at', null)
        .select()
        .single();

      if (error) throw error;
      
      devLog('✅ Student activity updated successfully:', data);
      
      setTimeout(async () => {
        devLog('🔄 Refetching students to update order...');
        await fetchStudents();
        devLog('✅ Students refetched after activity update');
      }, 1000);
      
      return data;
    } catch (error: any) {
      console.error('❌ Error updating student activity:', error);
      throw error;
    }
  }, [fetchStudents]);

  const deleteStudent = async (studentId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.rpc('soft_delete_student', {
        p_student_id: studentId,
        p_teacher_id: user.id
      });

      if (error) throw error;

      setStudents(prevStudents => 
        prevStudents.filter(student => student.id !== studentId)
      );

      toast({
        title: "Success",
        description: "Student deleted successfully",
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting student:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      return { success: false, error: error.message };
    }
  };

  useEffect(() => {
    fetchStudents();
    
    const handleStudentUpdate = async (event: CustomEvent) => {
      devLog('🎯 RECEIVED studentUpdated event:', event.detail);
      const { studentId } = event.detail;
      
      if (studentId) {
        devLog('🎯 Processing student update for:', studentId);
        await updateStudentActivity(studentId);
      }
    };
    
    window.addEventListener('studentUpdated', handleStudentUpdate as EventListener);
    
    return () => {
      window.removeEventListener('studentUpdated', handleStudentUpdate as EventListener);
    };
  }, [fetchStudents, updateStudentActivity]);

  return {
    students,
    loading,
    addStudent,
    updateStudent,
    updateStudentActivity,
    deleteStudent,
    refetch: fetchStudents
  };
};
