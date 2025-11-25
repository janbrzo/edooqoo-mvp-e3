import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FlashcardSet, CreateFlashcardSet } from '@/types/flashcards';

export const useFlashcardSets = (teacherId?: string, studentId?: string) => {
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchSets = async () => {
    if (!teacherId) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('flashcard_sets')
        .select(`
          *,
          student:students(name, native_language),
          cards:flashcard_cards(id)
        `)
        .eq('teacher_id', teacherId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedSets = data.map((set: any) => ({
        ...set,
        student_name: set.student?.name,
        student_native_language: set.student?.native_language,
        cards_count: set.cards?.length || 0,
      }));

      setSets(formattedSets);
    } catch (error: any) {
      console.error('Error fetching flashcard sets:', error);
      toast({
        title: 'Error',
        description: 'Failed to load flashcard sets',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSets();
  }, [teacherId, studentId]);

  const createSet = async (data: CreateFlashcardSet) => {
    if (!teacherId) return null;

    try {
      const { data: newSet, error } = await supabase
        .from('flashcard_sets')
        .insert({
          teacher_id: teacherId,
          student_id: data.student_id,
          title: data.title,
          description: data.description,
          is_bidirectional: data.is_bidirectional ?? true,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Flashcard set created successfully',
      });

      await fetchSets();
      return newSet;
    } catch (error: any) {
      console.error('Error creating flashcard set:', error);
      toast({
        title: 'Error',
        description: 'Failed to create flashcard set',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateSet = async (setId: string, updates: Partial<FlashcardSet>) => {
    try {
      const { error } = await supabase
        .from('flashcard_sets')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', setId)
        .eq('teacher_id', teacherId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Flashcard set updated',
      });

      await fetchSets();
    } catch (error: any) {
      console.error('Error updating flashcard set:', error);
      toast({
        title: 'Error',
        description: 'Failed to update flashcard set',
        variant: 'destructive',
      });
    }
  };

  const deleteSet = async (setId: string) => {
    if (!teacherId) return;

    try {
      const { error } = await supabase.rpc('soft_delete_flashcard_set', {
        p_set_id: setId,
        p_teacher_id: teacherId,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Flashcard set deleted',
      });

      await fetchSets();
    } catch (error: any) {
      console.error('Error deleting flashcard set:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete flashcard set',
        variant: 'destructive',
      });
    }
  };

  const generateShareToken = async (setId: string) => {
    if (!teacherId) return null;

    try {
      const { data, error } = await supabase.rpc('generate_flashcard_share_token', {
        p_set_id: setId,
        p_teacher_id: teacherId,
        p_expires_hours: 8760, // 1 year
      });

      if (error) throw error;

      await fetchSets();
      return data;
    } catch (error: any) {
      console.error('Error generating share token:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate share link',
        variant: 'destructive',
      });
      return null;
    }
  };

  return {
    sets,
    loading,
    createSet,
    updateSet,
    deleteSet,
    generateShareToken,
    refetch: fetchSets,
  };
};
