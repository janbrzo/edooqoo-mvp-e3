import { useState, useCallback } from 'react';
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

  // In-memory cache to avoid duplicate API calls
  const cache = new Map<string, string>();

  const translateText = useCallback(
    async (englishText: string) => {
      if (!enabled || !englishText.trim()) {
        setTranslation('');
        return;
      }

      // Check cache first
      const cacheKey = `${englishText}_${targetLanguage}`;
      if (cache.has(cacheKey)) {
        setTranslation(cache.get(cacheKey)!);
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
        cache.set(cacheKey, translatedText);
      } catch (error: any) {
        console.error('Translation error:', error);
        // Don't show error toast for translation failures - just silently fail
        setTranslation('');
      } finally {
        setIsTranslating(false);
      }
    },
    [targetLanguage, enabled, toast]
  );

  const clearTranslation = () => {
    setTranslation('');
  };

  return {
    translation,
    isTranslating,
    translateText,
    clearTranslation,
  };
};
