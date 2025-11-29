import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseFlashcardDefinitionProps {
  enabled: boolean;
}

export const useFlashcardDefinition = ({ enabled }: UseFlashcardDefinitionProps) => {
  const [definition, setDefinition] = useState('');
  const [isLoadingDefinition, setIsLoadingDefinition] = useState(false);

  // Use useRef for persistent cache across renders
  const cacheRef = useRef<Map<string, string>>(new Map());
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchDefinition = useCallback(
    async (englishTerm: string) => {
      if (!enabled || !englishTerm.trim()) {
        setDefinition('');
        return;
      }

      // Clear any existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Debounce definition fetch by 800ms
      debounceTimerRef.current = setTimeout(async () => {
        const cacheKey = `def_${englishTerm.toLowerCase().trim()}`;
        
        // Check cache first
        if (cacheRef.current.has(cacheKey)) {
          setDefinition(cacheRef.current.get(cacheKey)!);
          return;
        }

        setIsLoadingDefinition(true);
        try {
          const { data, error } = await supabase.functions.invoke('translate-flashcard', {
            body: {
              text: englishTerm,
              target_language: 'English',
              mode: 'definition'
            },
          });

          if (error) throw error;

          const definitionText = data?.translation || '';
          setDefinition(definitionText);
          cacheRef.current.set(cacheKey, definitionText);
        } catch (error: any) {
          console.error('Definition fetch error:', error);
          // Silently fail - just don't show definition
          setDefinition('');
        } finally {
          setIsLoadingDefinition(false);
        }
      }, 800); // 800ms debounce
    },
    [enabled]
  );

  const clearDefinition = useCallback(() => {
    setDefinition('');
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  return {
    definition,
    isLoadingDefinition,
    fetchDefinition,
    clearDefinition,
  };
};
