
# Plan naprawy 3 problemów

## Szczegółowa analiza przyczyn

### PROBLEM 1: Flashcard `is_correct: false` gdy kliknięto "I Know This"

**Analiza kodu:**

1. **FlashcardDisplay.tsx (linia 68-73):** Przycisk "I Know This" wywołuje `handleReview(2)` - czyli quality = 2
2. **useFlashcardLearning.tsx (linia 179):** Logika w hooku:
   ```tsx
   correct_count: quality >= 2 ? card.correct_count + 1 : card.correct_count,
   ```
   Czyli quality=2 POWINNO zwiększyć `correct_count`

3. **SQL Trigger (linia 180):**
   ```sql
   'is_correct', NEW.correct_count > COALESCE(OLD.correct_count, 0),
   ```
   Logika: `is_correct = true` gdy `NEW.correct_count > OLD.correct_count`

**Znaleziony BUG:**
Problem polega na tym, że trigger sprawdza `NEW.correct_count > COALESCE(OLD.correct_count, 0)`, ale kiedy to jest **pierwszy review** karty (INSERT zamiast UPDATE), `OLD.correct_count` jest NULL, a `COALESCE(NULL, 0) = 0`.

Dla pierwszego review:
- `NEW.correct_count = 1` (bo card.correct_count=0 + 1)
- `OLD.correct_count = NULL` → `COALESCE(NULL, 0) = 0`
- `1 > 0` = TRUE

Ale problem jest inny! Trigger jest na `AFTER UPDATE`, więc dla **pierwszego** review nie odpala się wcale (jest INSERT).

**Prawdziwa przyczyna:**
Sprawdziłem dane użytkownika: `"repetition": 4, "total_reviews": 4` - to znaczy że karta była już 4 razy przeglądana. W tej sytuacji trigger POWINIEN działać poprawnie.

**Hipoteza alternatywna:**
Problem może być w tym, że `card.correct_count` w frontend odczytuje starą wartość z bazy przed upsert. Jeśli student kliknął "Again" wcześniej, `correct_count` nie wzrósł. Ale jeśli teraz kliknął "I Know This", `correct_count` powinien wzrosnąć.

**Sprawdzam dokładniej:**
```tsx
correct_count: quality >= 2 ? card.correct_count + 1 : card.correct_count,
```
Gdzie `card.correct_count` to STARA wartość z bazy przed upsert. Czyli:
- Jeśli poprzednio było `correct_count = 3`
- Student kliknął "I Know This" (quality = 2)
- NEW.correct_count = 3 + 1 = 4
- Trigger widzi: `4 > 3` = TRUE ✅

**Więc skąd `is_correct: false`?**

Jedyna możliwość: student kliknął "Again" (quality = 0), wtedy:
- `correct_count` NIE rośnie: `quality >= 2 ? +1 : 0` → quality=0 < 2, więc `correct_count` się nie zmienia
- Trigger widzi: `3 > 3` = FALSE → `is_correct = false`

**WNIOSEK:** Dane pokazują że student rzeczywiście kliknął "Again" a nie "I Know This", LUB jest race condition w UI.

**ROZWIĄZANIE:**
Dodać dodatkowe pole w payloadzie `quality_rating` które zapisuje dokładnie co student kliknął (0, 2, 3 itd), niezależnie od delty correct_count. To pozwoli na precyzyjną diagnostykę.

---

### PROBLEM 1B: `interval_days: 6` dla karty która nie była robiona 6 dni temu

**Wyjaśnienie algorytmu SM-2:**
`interval_days` to NIE "ile dni temu robiłem tę kartę", ale **ile dni do następnego przeglądu**.

Algorytm SM-2 (linie 7-38 w useFlashcardLearning.tsx):
```tsx
if (repetition === 0) {
  newInterval = 1;
} else if (repetition === 1) {
  newInterval = 6;  // ← Po drugim poprawnym review = 6 dni
} else {
  newInterval = Math.round(intervalDays * easinessFactor);
}
```

Czyli `interval_days: 6` oznacza że karta ma być pokazana ponownie **za 6 dni** (nie że była robiona 6 dni temu).

**TO JEST POPRAWNE ZACHOWANIE** - nie wymaga poprawki!

---

### PROBLEM 2: ExerciseMatching - różne rozmiary boxów

**Analiza porównawcza:**

| Komponent | Lewa kolumna | Prawa kolumna | Select |
|-----------|--------------|---------------|--------|
| ExerciseSynonymsAntonyms | `md:col-span-6`, `min-h-[52px]` | `md:col-span-6`, `min-h-[52px]` | `w-14 h-8` |
| ExerciseMatchingHalves | `md:col-span-6`, `min-h-[52px]` | `md:col-span-6`, `min-h-[52px]` | `w-14 h-8` |
| ExerciseMatching | `md:col-span-5`, `min-h-[44px] max-h-[52px]` | `md:col-span-7`, `min-h-[44px] max-h-[52px]` | `w-[80px] h-[36px]` |

**Znalezione różnice:**
1. **Grid podział:** Matching ma 5:7, inne mają 6:6
2. **min-height:** Matching ma `min-h-[44px]`, inne mają `min-h-[52px]`
3. **Select:** Matching ma `w-[80px] h-[36px]`, inne mają `w-14 h-8` (w-14 = 56px, h-8 = 32px)

**ROZWIĄZANIE:**
Ujednolicić ExerciseMatching do tych samych wartości co działające komponenty:
- Zmienić `md:col-span-5` → `md:col-span-6`
- Zmienić `md:col-span-7` → `md:col-span-6`
- Zmienić `min-h-[44px] max-h-[52px]` → `min-h-[52px]`
- Zmienić `SelectTrigger` z `w-[80px] h-[36px]` → `w-14 h-8`

---

### PROBLEM 3: NanoSkill tooltip nie działa

**Analiza kodu:**

1. **tooltip.tsx (linie 16-26):** Poprawnie używa `TooltipPrimitive.Portal`:
   ```tsx
   <TooltipPrimitive.Portal>
     <TooltipPrimitive.Content ... />
   </TooltipPrimitive.Portal>
   ```

2. **NanoSkillBadge.tsx (linie 78-106):** Używa standardowego `TooltipContent`:
   ```tsx
   <TooltipProvider delayDuration={0}>
     <Tooltip>
       <TooltipTrigger asChild>
         <Badge ... />
       </TooltipTrigger>
       <TooltipContent side="top" align="start" className="w-72 p-3 bg-white border shadow-lg z-[9999]">
         ...
       </TooltipContent>
     </Tooltip>
   </TooltipProvider>
   ```

**Możliwe przyczyny:**
1. **Podwójny TooltipProvider:** Każdy Badge tworzy własny `TooltipProvider` - może powodować konflikty
2. **pointer-events:** Badge ma `pointer-events-auto` ale parent div może mieć `pointer-events-none`
3. **z-index war:** `z-[9999]` może być nadpisane przez inne elementy
4. **asChild + Badge:** Może być problem z propagacją eventów

**ROZWIĄZANIE:**
Przebudować komponent używając bezpośrednio `TooltipPrimitive` z jawnymi stylami i bez nested providera:

```tsx
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

// Wynieść TooltipProvider na poziom App lub użyć globalnego
// W komponencie użyć prostszej struktury:
<TooltipPrimitive.Root delayDuration={0}>
  <TooltipPrimitive.Trigger asChild>
    <Badge ... />
  </TooltipPrimitive.Trigger>
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      side="top"
      align="start"
      sideOffset={8}
      className="z-[9999] w-72 p-3 bg-white border rounded-lg shadow-lg animate-in fade-in-0 zoom-in-95"
    >
      ...
      <TooltipPrimitive.Arrow className="fill-white" />
    </TooltipPrimitive.Content>
  </TooltipPrimitive.Portal>
</TooltipPrimitive.Root>
```

---

## Pliki do edycji

| Problem | Plik | Zmiana |
|---------|------|--------|
| 1 | `useFlashcardLearning.tsx` | Dodać `quality_rating` do upsert |
| 1 | SQL Migration | Dodać `quality_rating` do trigger payload |
| 1B | - | Brak zmiany - to jest poprawne zachowanie |
| 2 | `ExerciseMatching.tsx` | Zmienić grid 5:7→6:6, min-h, SelectTrigger size |
| 3 | `NanoSkillBadge.tsx` | Przebudować na TooltipPrimitive bez nested Provider |

---

## Implementacja

### Problem 1: Dodać quality_rating do flashcard events

**Plik: `src/hooks/useFlashcardLearning.tsx`**

Dodać nowe pole przy upsert:
```tsx
// linia ~181 - dodać nowe pole
quality_rating: quality, // 0=Again, 2=I Know This
```

**Migracja SQL:** Zaktualizować trigger aby dodać quality_rating do payloadu.

---

### Problem 2: Ujednolicić ExerciseMatching

**Plik: `src/components/worksheet/ExerciseMatching.tsx`**

Zmiany:
- Linia 83: `md:col-span-5` → `md:col-span-6`
- Linia 96: `min-h-[44px] max-h-[52px]` → `min-h-[52px]`
- Linia 110: `w-[80px] h-[36px]` → `w-14 h-8`
- Linia 163: `md:col-span-7` → `md:col-span-6`
- Linia 166: `min-h-[44px] max-h-[52px]` → `min-h-[52px]`

---

### Problem 3: Naprawić NanoSkill tooltip

**Plik: `src/components/worksheet/NanoSkillBadge.tsx`**

Przebudować używając bezpośrednio TooltipPrimitive:
```tsx
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

// Zamiast TooltipProvider + Tooltip + TooltipTrigger + TooltipContent
// Użyć:
<TooltipPrimitive.Provider delayDuration={0}>
  <TooltipPrimitive.Root>
    <TooltipPrimitive.Trigger asChild>
      <Badge
        variant="outline"
        className={`text-xs cursor-pointer ${getBadgeColor(nanoSkill.confidence)}`}
        style={{ pointerEvents: 'auto' }}
      >
        ns ({confidencePercent}%)
      </Badge>
    </TooltipPrimitive.Trigger>
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        side="top"
        align="start"
        sideOffset={8}
        className="z-[9999] w-72 p-3 bg-white border rounded-lg shadow-lg animate-in fade-in-0 zoom-in-95 data-[state=delayed-open]:animate-in data-[state=closed]:animate-out"
      >
        <div className="space-y-2">
          <p className="font-semibold text-sm text-gray-900">{displayName}</p>
          <p className="text-xs text-gray-600">{nanoSkill.reason}</p>
          <div className="flex items-center gap-2 pt-1 border-t">
            <span className="text-xs text-muted-foreground">Full ID:</span>
            <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded break-all">{nanoSkill.name}</code>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Confidence:</span>
            <span className="text-xs font-medium">{confidencePercent}%</span>
          </div>
        </div>
        <TooltipPrimitive.Arrow className="fill-white" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  </TooltipPrimitive.Root>
</TooltipPrimitive.Provider>
```

---

## Co zobaczysz po implementacji

1. **Flashcard events:** Będą zawierały nowe pole `quality_rating` (0 lub 2) które jednoznacznie pokazuje co student kliknął, niezależnie od delty `correct_count`

2. **interval_days:** To zachowanie jest **poprawne** - wartość oznacza "za ile dni pokazać ponownie", nie "ile dni temu robione"

3. **ExerciseMatching:** Boxy w obu kolumnach będą identycznych rozmiarów (jak w Synonyms/Antonyms i Matching Halves)

4. **NanoSkill tooltip:** Po najechaniu na badge "ns (94%)" natychmiast pojawi się elegancka karta z pełnymi informacjami o skill'u

---

## Sekcja techniczna

### Migracja SQL dla Problem 1

```sql
-- Dodaj quality_rating do flashcard_progress
ALTER TABLE public.flashcard_progress 
ADD COLUMN IF NOT EXISTS last_quality_rating INTEGER;

-- Zaktualizuj trigger
CREATE OR REPLACE FUNCTION public.log_flashcard_review_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_student_id UUID;
  v_teacher_id UUID;
  v_card_front TEXT;
  v_card_back TEXT;
  v_set_id UUID;
BEGIN
  -- Get set_id and card details
  SELECT fc.set_id, fc.front_text, fc.back_text
  INTO v_set_id, v_card_front, v_card_back
  FROM public.flashcard_cards fc
  WHERE fc.id = NEW.card_id;

  -- Get teacher_id from flashcard_sets
  IF v_set_id IS NOT NULL THEN
    SELECT fs.teacher_id
    INTO v_teacher_id
    FROM public.flashcard_sets fs
    WHERE fs.id = v_set_id;
  END IF;

  -- Get student_id from students table using learner_identifier (email)
  SELECT s.id
  INTO v_student_id
  FROM public.students s
  WHERE s.student_email = NEW.learner_identifier
  LIMIT 1;

  -- Only log if we have valid IDs
  IF v_student_id IS NOT NULL AND v_teacher_id IS NOT NULL THEN
    INSERT INTO public.student_events (
      student_id,
      teacher_id,
      event_type,
      event_source,
      source_id,
      event_payload
    ) VALUES (
      v_student_id,
      v_teacher_id,
      'flashcard_review',
      'flashcards',
      NEW.set_id,
      jsonb_build_object(
        'card_id', NEW.card_id,
        'set_id', NEW.set_id,
        'direction', NEW.direction,
        'card_front', v_card_front,
        'card_back', v_card_back,
        'is_correct', NEW.correct_count > COALESCE(OLD.correct_count, 0),
        'quality_rating', NEW.last_quality_rating, -- NOWE: 0=Again, 2=I Know
        'easiness_factor', NEW.easiness_factor,
        'repetition', NEW.repetition,
        'interval_days', NEW.interval_days,
        'total_reviews', NEW.total_reviews,
        'time_spent_seconds', ROUND(COALESCE(NEW.last_response_time_ms, 0) / 1000.0, 1)
      )
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to log flashcard review event: %', SQLERRM;
    RETURN NEW;
END;
$function$;
```

### Zmiana w useFlashcardLearning.tsx

```tsx
// Linia 167-184: dodać last_quality_rating
const { error } = await supabase
  .from('flashcard_progress')
  .upsert({
    card_id: cardId,
    set_id: setId,
    learner_identifier: learnerEmail,
    direction: card.direction,
    easiness_factor: newEF,
    repetition: newRepetition,
    interval_days: newInterval,
    next_review_date: nextReviewDate.toISOString(),
    last_reviewed_at: new Date().toISOString(),
    total_reviews: card.total_reviews + 1,
    correct_count: quality >= 2 ? card.correct_count + 1 : card.correct_count,
    incorrect_count: quality < 2 ? card.incorrect_count + 1 : card.incorrect_count,
    last_response_time_ms: responseTimeMs,
    last_quality_rating: quality, // NOWE: zapisz dokładnie co kliknął student
  }, {
    onConflict: 'card_id,learner_identifier,direction'
  });
```
