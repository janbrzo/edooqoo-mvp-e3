# Auto-Translation for Flashcards - Detailed Implementation Plan

## Problem 12: Automatic Translation Suggestion

**User Request**: When adding a flashcard manually, after entering the English Term, the Translation field should automatically suggest a translation based on the student's native language.

---

## Technical Architecture

### 1. Edge Function: `translate-flashcard`

**Location**: `supabase/functions/translate-flashcard/index.ts`

**Purpose**: Translate English text to target language using OpenAI API

**Implementation**:
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { english_text, target_language, context } = await req.json()

    // Validate input
    if (!english_text || !target_language) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Call OpenAI API for translation
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Fast and cost-effective
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate English vocabulary terms to ${target_language}. Provide ONLY the translation, nothing else. Keep it concise and natural.`
          },
          {
            role: 'user',
            content: context 
              ? `Translate this English term: "${english_text}"\nContext: ${context}`
              : `Translate this English term: "${english_text}"`
          }
        ],
        temperature: 0.3, // Low temperature for consistent translations
        max_tokens: 100,
      }),
    })

    const openaiData = await openaiResponse.json()

    if (!openaiResponse.ok) {
      throw new Error(openaiData.error?.message || 'OpenAI API error')
    }

    const translation = openaiData.choices[0]?.message?.content?.trim()

    return new Response(
      JSON.stringify({ translation }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Translation error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

---

### 2. Frontend Hook: `useFlashcardTranslation`

**Location**: `src/hooks/useFlashcardTranslation.tsx`

**Purpose**: Handle translation requests with debouncing and caching

**Implementation**:
```typescript
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface UseFlashcardTranslationProps {
  targetLanguage: string;
  enabled?: boolean;
}

export const useFlashcardTranslation = ({
  targetLanguage,
  enabled = true,
}: UseFlashcardTranslationProps) => {
  const [translation, setTranslation] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const translationCacheRef = useRef<Map<string, string>>(new Map());

  const translateText = useCallback(async (
    englishText: string,
    context?: string
  ) => {
    if (!enabled || !englishText.trim()) {
      setTranslation('');
      return;
    }

    // Check cache first
    const cacheKey = `${englishText.toLowerCase()}-${targetLanguage}`;
    if (translationCacheRef.current.has(cacheKey)) {
      setTranslation(translationCacheRef.current.get(cacheKey)!);
      return;
    }

    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce translation request (800ms)
    debounceTimerRef.current = setTimeout(async () => {
      setIsTranslating(true);
      try {
        const { data, error } = await supabase.functions.invoke('translate-flashcard', {
          body: {
            english_text: englishText.trim(),
            target_language: targetLanguage,
            context: context?.trim(),
          },
        });

        if (error) throw error;

        if (data?.translation) {
          setTranslation(data.translation);
          // Cache the translation
          translationCacheRef.current.set(cacheKey, data.translation);
        }
      } catch (error: any) {
        console.error('Translation error:', error);
        toast({
          title: 'Translation failed',
          description: 'Could not auto-translate. Please enter manually.',
          variant: 'destructive',
        });
        setTranslation('');
      } finally {
        setIsTranslating(false);
      }
    }, 800); // 800ms debounce
  }, [targetLanguage, enabled]);

  const clearTranslation = () => {
    setTranslation('');
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  };

  return {
    translation,
    isTranslating,
    translateText,
    clearTranslation,
  };
};
```

---

### 3. Update `AddFlashcardModal` Component

**Location**: `src/components/flashcards/AddFlashcardModal.tsx`

**Changes**:
```typescript
// Add import
import { useFlashcardTranslation } from '@/hooks/useFlashcardTranslation';
import { Loader2 } from 'lucide-react';

// Inside component, add hook
const { translation, isTranslating, translateText, clearTranslation } = useFlashcardTranslation({
  targetLanguage: studentNativeLanguage,
  enabled: !editingCard, // Only for new cards
});

// Update effect to trigger translation
useEffect(() => {
  if (frontText.trim() && !editingCard) {
    translateText(frontText, frontExample);
  } else {
    clearTranslation();
  }
}, [frontText, frontExample, editingCard]);

// Update effect to populate backText with translation
useEffect(() => {
  if (translation && !backText) {
    setBackText(translation);
  }
}, [translation]);

// Update Translation field UI
<div>
  <Label htmlFor="backText">
    Translation *
    {isTranslating && (
      <span className="ml-2 text-xs text-muted-foreground">
        <Loader2 className="inline h-3 w-3 animate-spin mr-1" />
        Translating...
      </span>
    )}
  </Label>
  <Textarea
    id="backText"
    value={backText}
    onChange={(e) => setBackText(e.target.value)}
    placeholder={isTranslating ? 'Auto-translating...' : `${studentNativeLanguage} translation`}
    required
    rows={2}
    className="mt-1.5"
  />
  <p className="text-xs text-muted-foreground mt-1">
    {translation && 'Auto-suggested translation (you can edit)'}
  </p>
</div>
```

---

## Cost & Performance Considerations

### OpenAI API Costs
- **Model**: `gpt-4o-mini` (~$0.00015 per 1K tokens)
- **Average request**: ~50 tokens (prompt + completion)
- **Cost per translation**: ~$0.0000075 (less than 1 cent per 100 translations)
- **Monthly estimate** (100 teachers, 10 cards/day): ~$2.25/month

### Performance Optimization
1. **Debouncing**: 800ms delay prevents excessive API calls while typing
2. **Caching**: In-memory cache for session (prevents duplicate translations)
3. **Optional feature**: Can be disabled if needed (via `enabled` prop)

---

## User Experience Flow

1. **Teacher opens Add Card modal**
2. **Types English Term**: "apple"
3. **After 800ms pause**: Auto-translation appears in Translation field
4. **Translation appears**: "manzana" (if Spanish)
5. **Teacher can**:
   - Accept the suggestion (do nothing)
   - Edit the suggestion
   - Replace it entirely
6. **Adds Example** (optional): Translation updates with context
7. **Submits card**: Normal flow continues

---

## Testing Checklist

- [ ] Edge function deploys successfully
- [ ] Translation works for all supported languages
- [ ] Debouncing prevents excessive API calls
- [ ] Cache prevents duplicate translations in same session
- [ ] Error handling shows user-friendly message
- [ ] Loading state displays correctly
- [ ] Manual editing overrides auto-suggestion
- [ ] Context (example sentence) improves translation quality
- [ ] Edit mode doesn't trigger auto-translation
- [ ] Performance acceptable (< 1s response time)

---

## Rollout Strategy

### Phase 1: Beta Testing (2 weeks)
- Enable for 10 selected teachers
- Monitor API costs and usage patterns
- Collect feedback on translation quality

### Phase 2: Full Rollout
- Enable for all users
- Add toggle in settings to disable if needed
- Monitor costs and adjust debounce timing if necessary

### Phase 3: Enhancements (Future)
- Support for "Definition" mode (English → English definition)
- Bulk translation for imported vocabulary
- Translation history/suggestions panel

---

## Alternative Solutions (If OpenAI costs too high)

1. **Google Translate API**: Cheaper but lower quality for educational context
2. **LibreTranslate** (Self-hosted): Free but requires infrastructure
3. **Dictionary API** (e.g., Linguee): Limited to word-level translations
4. **Hybrid**: Use dictionary API first, fallback to OpenAI for phrases

---

## Implementation Time Estimate

- Edge function: **1 hour**
- Frontend hook: **1 hour**
- Component integration: **1 hour**
- Testing & refinement: **2 hours**
- **Total**: ~5 hours of development

---

## Security Considerations

- ✅ Edge function validates input
- ✅ Rate limiting via Supabase (default: 60 req/min)
- ✅ OpenAI API key stored as secret
- ✅ CORS headers configured
- ✅ No PII sent to OpenAI (only vocabulary terms)

---

## Future Enhancements

1. **Bulk Translation**: Translate all cards in a set at once
2. **Translation Memory**: Database-backed cache for common terms
3. **Multi-language Support**: Suggest translations for multiple languages
4. **Pronunciation Guide**: Add IPA or audio pronunciation
5. **Context-aware**: Use student's previous vocabulary for better translations
