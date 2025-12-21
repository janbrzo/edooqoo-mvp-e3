import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook for managing anonymous authentication
 * IMPORTANT: This hook NO LONGER automatically creates anonymous accounts.
 * It only checks for existing sessions and provides a manual signInAnonymously function.
 * This prevents unwanted account creation when visiting /profile or /dashboard while not logged in.
 */
export function useAnonymousAuth() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Manual function to sign in anonymously - only called when explicitly needed
  const signInAnonymously = useCallback(async () => {
    try {
      const { data, error: signInError } = await supabase.auth.signInAnonymously();
      
      if (signInError) throw signInError;
      
      if (data?.user) {
        setUserId(data.user.id);
        return { user: data.user, error: null };
      }
      return { user: null, error: null };
    } catch (err) {
      console.error('Error during anonymous authentication:', err);
      const authError = err instanceof Error ? err : new Error('Unknown authentication error');
      setError(authError);
      return { user: null, error: authError };
    }
  }, []);

  useEffect(() => {
    async function checkExistingSession() {
      try {
        setLoading(true);
        
        // Only check if we already have a session - DO NOT create anonymous account
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setUserId(session.user.id);
        }
        // If no session exists, we simply leave userId as null
        // NO automatic anonymous sign-in!
      } catch (err) {
        console.error('Error checking session:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    }

    checkExistingSession();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUserId(session.user.id);
      } else {
        setUserId(null);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { userId, loading, error, signInAnonymously };
}
