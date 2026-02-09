// ============================================
// FAZA 2: Interactive Shared Worksheets - Teacher Live Session Hook
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ExerciseAnswers } from '@/types/interactiveHomework';
import { LiveSessionAnswer } from '@/types/interactiveSharedWorksheet';

interface UseLiveSessionAnswersProps {
  worksheetId: string;
  enabled: boolean; // Only subscribe when in Live Session mode
}

export const useLiveSessionAnswers = ({
  worksheetId,
  enabled
}: UseLiveSessionAnswersProps) => {
  const [liveAnswers, setLiveAnswers] = useState<Record<number, ExerciseAnswers>>({});
  const [liveItemEvaluations, setLiveItemEvaluations] = useState<Record<number, any[]>>({});
  const [studentEmail, setStudentEmail] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Load initial answers from database
  const loadInitialAnswers = useCallback(async () => {
    if (!worksheetId) return;
    
    try {
      console.log('[useLiveSessionAnswers] Loading initial answers for worksheet:', worksheetId);
      
      const { data, error } = await supabase.rpc('get_worksheet_live_answers', {
        p_worksheet_id: worksheetId
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const loadedAnswers: Record<number, ExerciseAnswers> = {};
        const loadedEvals: Record<number, any[]> = {};
        let latestEmail: string | null = null;

        data.forEach((answer: any) => {
          loadedAnswers[answer.exercise_index] = answer.answers as ExerciseAnswers;
          if (!latestEmail) latestEmail = answer.student_email;
          if (answer.item_evaluations && Array.isArray(answer.item_evaluations)) {
            loadedEvals[answer.exercise_index] = answer.item_evaluations;
          }
        });

        setLiveAnswers(loadedAnswers);
        setLiveItemEvaluations(loadedEvals);
        setStudentEmail(latestEmail);
        setLastUpdatedAt(new Date());
        console.log('[useLiveSessionAnswers] Loaded initial answers:', loadedAnswers, 'evals:', loadedEvals);
      }
    } catch (error) {
      console.error('[useLiveSessionAnswers] Error loading initial answers:', error);
    }
  }, [worksheetId]);

  // PROBLEM 1 FIX: Process any pending AI evaluations when teacher views worksheet
  const processPendingAiEvals = useCallback(async () => {
    if (!worksheetId) return;
    
    try {
      console.log('[useLiveSessionAnswers] Processing pending AI evaluations for worksheet:', worksheetId);
      
      const { data, error } = await supabase.functions.invoke('process-pending-ai-evaluations', {
        body: { worksheet_id: worksheetId }
      });
      
      if (error) {
        console.warn('[useLiveSessionAnswers] Failed to process pending AI evals:', error);
      } else {
        console.log('[useLiveSessionAnswers] Pending AI evals result:', data);
        // Reload answers if any were processed
        if (data?.processed > 0) {
          loadInitialAnswers();
        }
      }
    } catch (error) {
      console.warn('[useLiveSessionAnswers] Error processing pending AI evals:', error);
    }
  }, [worksheetId, loadInitialAnswers]);

  // Subscribe to Realtime changes
  useEffect(() => {
    if (!enabled || !worksheetId) {
      setIsConnected(false);
      return;
    }

    console.log('[useLiveSessionAnswers] Setting up Realtime subscription for worksheet:', worksheetId);
    
    // Load initial data first
    loadInitialAnswers();
    
    // PROBLEM 1 FIX: Process any pending AI evaluations from student tab closes
    processPendingAiEvals();

    // Set up Realtime subscription
    const channel = supabase
      .channel(`worksheet-answers-${worksheetId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'worksheet_student_answers',
          filter: `worksheet_id=eq.${worksheetId}`
        },
        (payload) => {
          console.log('[useLiveSessionAnswers] Realtime update received:', payload);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newData = payload.new as any;
            
            setLiveAnswers(prev => ({
              ...prev,
              [newData.exercise_index]: newData.answers as ExerciseAnswers
            }));
            
            setStudentEmail(newData.student_email);
            setLastUpdatedAt(new Date());
          } else if (payload.eventType === 'DELETE') {
            // @ts-ignore - payload.old may not have type
            const oldData = payload.old as LiveSessionAnswer;
            
            setLiveAnswers(prev => {
              const updated = { ...prev };
              delete updated[oldData.exercise_index];
              return updated;
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('[useLiveSessionAnswers] Subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Cleanup on unmount or when disabled
    return () => {
      console.log('[useLiveSessionAnswers] Removing Realtime subscription');
      supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, [worksheetId, enabled, loadInitialAnswers, processPendingAiEvals]);

  // Clear answers when disabled
  useEffect(() => {
    if (!enabled) {
      setLiveAnswers({});
      setStudentEmail(null);
      setLastUpdatedAt(null);
    }
  }, [enabled]);

  return {
    liveAnswers,
    liveItemEvaluations,
    studentEmail,
    lastUpdatedAt,
    isConnected,
    refetch: loadInitialAnswers
  };
};
