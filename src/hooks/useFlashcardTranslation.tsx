import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseFlashcardTranslationProps {
  targetLanguage: string;
  enabled: boolean;
}

export const useFlashcardTranslation = ({ targetLanguage, enabled }: UseFlashcardTranslationProps) => {
  const [translation, setTranslation] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const { toast } = useToast();

  // Use useRef for persistent cache across renders
  const cacheRef = useRef<Map<string, string>>(new Map());
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const translateText = useCallback(
    async (englishText: string) => {
      if (!enabled || !englishText.trim()) {
        setTranslation('');
        return;
      }

      // Clear any existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Debounce translation by 800ms
      debounceTimerRef.current = setTimeout(async () => {
        const cacheKey = `${englishText}_${targetLanguage}`;
        
        // Check cache first
        if (cacheRef.current.has(cacheKey)) {
          setTranslation(cacheRef.current.get(cacheKey)!);
          return;
        }

        setIsTranslating(true);
        try {
          const { data, error } = await supabase.functions.invoke('translate-flashcard', {
            body: {
              text: englishText,
              target_language: targetLanguage,
            },
          });

          if (error) throw error;

          const translatedText = data?.translation || '';
          setTranslation(translatedText);
          cacheRef.current.set(cacheKey, translatedText);
        } catch (error: any) {
          console.error('Translation error:', error);
          // Don't show error toast for translation failures - just silently fail
          setTranslation('');
        } finally {
          setIsTranslating(false);
        }
      }, 800); // 800ms debounce
    },
    [targetLanguage, enabled, toast]
  );

  const clearTranslation = useCallback(() => {
    setTranslation('');
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  return {
    translation,
    isTranslating,
    translateText,
    clearTranslation,
  };
};
