import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  StudentKnowledgeEntry,
  NewKnowledgeEntry,
  UpdateKnowledgeEntry,
  KnowledgeFilters,
  KnowledgeEntriesResponse,
  DEFAULT_FILTERS,
} from '@/types/studentKnowledge';

interface UseStudentKnowledgeProps {
  studentId: string;
  teacherId: string;
}

export const useStudentKnowledge = ({ studentId, teacherId }: UseStudentKnowledgeProps) => {
  const [entries, setEntries] = useState<StudentKnowledgeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<KnowledgeFilters>(DEFAULT_FILTERS);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);

  /**
   * Fetch entries with filters and pagination
   */
  const fetchEntries = useCallback(async (newFilters?: Partial<KnowledgeFilters>) => {
    setIsLoading(true);
    setError(null);

    try {
      const appliedFilters = { ...filters, ...newFilters };
      
      let query = supabase
        .from('student_knowledge_entries')
        .select('*', { count: 'exact' })
        .eq('student_id', studentId)
        .eq('teacher_id', teacherId)
        .is('deleted_at', null);

      // Apply category filter
      if (appliedFilters.category) {
        query = query.eq('category', appliedFilters.category);
      }

      // Apply tags filter (OR logic - entry must have at least one tag)
      if (appliedFilters.tags && appliedFilters.tags.length > 0) {
        query = query.overlaps('tags', appliedFilters.tags);
      }

      // Apply search filter (search in content)
      if (appliedFilters.search) {
        query = query.ilike('content', `%${appliedFilters.search}%`);
      }

      // Apply worksheet filter
      if (appliedFilters.worksheetId) {
        query = query.eq('worksheet_id', appliedFilters.worksheetId);
      }

      // Apply date filters
      if (appliedFilters.dateFrom) {
        query = query.gte('created_at', appliedFilters.dateFrom);
      }
      if (appliedFilters.dateTo) {
        query = query.lte('created_at', appliedFilters.dateTo);
      }

      // Apply sorting
      if (appliedFilters.sortBy === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else if (appliedFilters.sortBy === 'oldest') {
        query = query.order('created_at', { ascending: true });
      } else if (appliedFilters.sortBy === 'category') {
        query = query.order('category', { ascending: true }).order('created_at', { ascending: false });
      }

      // Apply pagination
      const limit = appliedFilters.limit || DEFAULT_FILTERS.limit!;
      const offset = appliedFilters.offset || DEFAULT_FILTERS.offset!;
      query = query.range(offset, offset + limit - 1);

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      setEntries((data || []) as StudentKnowledgeEntry[]);
      setTotalCount(count || 0);
      setHasMore((count || 0) > offset + limit);
      setFilters(appliedFilters);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch knowledge entries';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [studentId, teacherId, filters]);

  /**
   * Fetch suggested tags for autocomplete
   */
  const fetchSuggestedTags = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_student_tags', {
        p_student_id: studentId,
        p_teacher_id: teacherId,
      });

      if (error) throw error;
      setSuggestedTags(data || []);
    } catch (err) {
      console.error('Failed to fetch suggested tags:', err);
    }
  }, [studentId, teacherId]);

  /**
   * Add new entry
   */
  const addEntry = useCallback(async (entry: Omit<NewKnowledgeEntry, 'student_id' | 'teacher_id'>) => {
    setIsLoading(true);
    
    try {
      const newEntry: NewKnowledgeEntry = {
        ...entry,
        student_id: studentId,
        teacher_id: teacherId,
        entry_source: entry.entry_source || 'manual',
      };

      const { data, error: insertError } = await supabase
        .from('student_knowledge_entries')
        .insert(newEntry)
        .select()
        .single();

      if (insertError) throw insertError;

      // Refresh entries after adding
      await fetchEntries();
      
      // Refresh suggested tags
      await fetchSuggestedTags();

      toast({
        title: 'Success',
        description: 'Knowledge entry added successfully',
      });

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add knowledge entry';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [studentId, teacherId, fetchEntries, fetchSuggestedTags]);

  /**
   * Update existing entry
   */
  const updateEntry = useCallback(async (entryId: string, updates: UpdateKnowledgeEntry) => {
    setIsLoading(true);

    try {
      const { data, error: updateError } = await supabase
        .from('student_knowledge_entries')
        .update(updates)
        .eq('id', entryId)
        .eq('teacher_id', teacherId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Refresh entries after updating
      await fetchEntries();
      
      // Refresh suggested tags if tags were updated
      if (updates.tags) {
        await fetchSuggestedTags();
      }

      toast({
        title: 'Success',
        description: 'Knowledge entry updated successfully',
      });

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update knowledge entry';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [teacherId, fetchEntries, fetchSuggestedTags]);

  /**
   * Soft delete entry
   */
  const deleteEntry = useCallback(async (entryId: string) => {
    setIsLoading(true);

    try {
      const { data, error: deleteError } = await supabase.rpc('soft_delete_knowledge_entry', {
        p_entry_id: entryId,
        p_teacher_id: teacherId,
      });

      if (deleteError) throw deleteError;

      if (!data) {
        throw new Error('Entry not found or you do not have permission to delete it');
      }

      // Refresh entries after deleting
      await fetchEntries();

      toast({
        title: 'Success',
        description: 'Knowledge entry deleted successfully',
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete knowledge entry';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [teacherId, fetchEntries]);

  /**
   * Load next page
   */
  const loadMore = useCallback(() => {
    if (!hasMore || isLoading) return;
    
    const newOffset = (filters.offset || 0) + (filters.limit || DEFAULT_FILTERS.limit!);
    fetchEntries({ offset: newOffset });
  }, [hasMore, isLoading, filters, fetchEntries]);

  /**
   * Reset filters
   */
  const resetFilters = useCallback(() => {
    fetchEntries(DEFAULT_FILTERS);
  }, [fetchEntries]);

  // Initial fetch
  useEffect(() => {
    fetchEntries();
    fetchSuggestedTags();
  }, [studentId, teacherId]); // Only run on mount and when IDs change

  return {
    entries,
    isLoading,
    error,
    filters,
    totalCount,
    hasMore,
    suggestedTags,
    fetchEntries,
    fetchSuggestedTags,
    addEntry,
    updateEntry,
    deleteEntry,
    loadMore,
    resetFilters,
    setFilters,
  };
};
