

# Plan naprawy 2 problemów

## PODSUMOWANIE ZNALEZIONYCH PRZYCZYN

### PROBLEM 1 (brak nano_skill_ratings per-item w worksheet/homework eventach)

**Analiza porównawcza:**

| Event Type | Struktura payload | Problem |
|------------|------------------|---------|
| `exercise_mastery_evaluation` (wzorcowy) | `nano_skill_ratings: [{ name, reason, mastery }]` | ✅ Prawidłowa |
| `worksheet_answer_saved` | `mastery: 10` (jedno pole) | ❌ Brak per-item |
| `homework_answer_submitted` | `mastery: null` (jedno pole) | ❌ Brak per-item |

**Przyczyna główna:**
System obecnie zapisuje tylko **ogólne mastery** dla całego ćwiczenia w kolumnie `mastery` tabeli `worksheet_student_answers`. Brakuje:
1. Kolumny do przechowywania `nano_skill_ratings` per-item
2. Logiki frontendowej do budowania tej struktury
3. Triggera SQL do przepisywania tej struktury do event_payload

**Wymagane zmiany (architektura):**
1. Dodać kolumnę `item_evaluations JSONB` do tabel `worksheet_student_answers` i `homework_student_answers`
2. Frontend musi budować tablicę `item_evaluations` z:
   - `name` - pobrane z `nano_skill.name` każdego pytania
   - `reason` - pobrane z `nano_skill.reason` każdego pytania
   - `mastery` - obliczone (closed: automatycznie, open: po AI verification)
3. Zaktualizować RPC `save_worksheet_answer` i `save_homework_answer` o parametr `p_item_evaluations`
4. Zaktualizować triggery SQL aby przepisywać `item_evaluations` do `nano_skill_ratings` w event_payload

---

### PROBLEM 2 (Tooltip NanoSkillBadge nie pokazuje się)

**Analiza kodu:**
```tsx
<TooltipProvider delayDuration={0}>
  <Tooltip open={isTooltipOpen} onOpenChange={setIsTooltipOpen}>
    <TooltipTrigger asChild>
      <Badge
        onMouseEnter={() => setIsTooltipOpen(true)}
        onMouseLeave={() => setIsTooltipOpen(false)}
      >
```

**Potencjalne przyczyny:**
1. **Radix Portal problem** - TooltipContent jest renderowany przez Portal, ale może być poza widocznym obszarem lub ma `opacity: 0`
2. **CSS visibility/overflow** - parent elementy mogą mieć `overflow: hidden` które blokuje Portal
3. **Conflict z kontrolowanym stanem** - używanie `open` + `onOpenChange` + `onMouseEnter/Leave` może powodować konflikt stanów

**Rozwiązanie:**
Sprawdziłem że komponent używa poprawnie kontrolowanego stanu. Problem prawdopodobnie jest w tym, że:
- `TooltipTrigger asChild` używa Badge który może nie przekazywać poprawnie ref do Radix
- Portal może nie mieć poprawnego `z-index` w kontekście renderowania

**Proponowane podejście - użyć HoverCard zamiast Tooltip:**
HoverCard z Radix jest bardziej niezawodny dla interaktywnych tooltipów z treścią:
```tsx
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

<HoverCard openDelay={0} closeDelay={0}>
  <HoverCardTrigger asChild>
    <Badge ...>ns (94%)</Badge>
  </HoverCardTrigger>
  <HoverCardContent side="top" align="start" className="w-72 p-3">
    {/* treść tooltipa */}
  </HoverCardContent>
</HoverCard>
```

---

## PLAN IMPLEMENTACJI

### Faza 1: Naprawa Tooltipa (PROBLEM 2) - Szybka naprawa

| # | Plik | Zmiana |
|---|------|--------|
| 1 | `src/components/worksheet/NanoSkillBadge.tsx` | Zamienić `Tooltip` na `HoverCard` który jest bardziej niezawodny dla bogatej treści |

**Kod po zmianie:**
```tsx
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

// W komponencie:
<HoverCard openDelay={0} closeDelay={0}>
  <HoverCardTrigger asChild>
    <Badge
      variant="outline"
      className={`text-xs cursor-help ${getBadgeColor(nanoSkill.confidence)}`}
    >
      ns ({confidencePercent}%)
    </Badge>
  </HoverCardTrigger>
  <HoverCardContent 
    side="top" 
    align="start" 
    className="w-72 p-3 z-[9999]"
  >
    <div className="space-y-2">
      <p className="font-semibold text-sm text-gray-900">{displayName}</p>
      <p className="text-xs text-gray-600">{nanoSkill.reason}</p>
      ...
    </div>
  </HoverCardContent>
</HoverCard>
```

---

### Faza 2: Dodanie nano_skill_ratings per-item (PROBLEM 1)

#### Krok 1: Migracja SQL - dodanie kolumny item_evaluations

```sql
-- Dodaj kolumnę item_evaluations do worksheet_student_answers
ALTER TABLE public.worksheet_student_answers 
ADD COLUMN IF NOT EXISTS item_evaluations JSONB;

-- Dodaj kolumnę item_evaluations do homework_student_answers
ALTER TABLE public.homework_student_answers 
ADD COLUMN IF NOT EXISTS item_evaluations JSONB;

-- Zaktualizuj save_worksheet_answer o p_item_evaluations
CREATE OR REPLACE FUNCTION public.save_worksheet_answer(
    p_worksheet_id UUID,
    p_student_email TEXT,
    p_exercise_index INTEGER,
    p_exercise_type TEXT,
    p_answers JSONB,
    p_time_spent_ms INTEGER DEFAULT 0,
    p_mastery INTEGER DEFAULT NULL,
    p_item_evaluations JSONB DEFAULT NULL
)
...
```

#### Krok 2: Zaktualizować trigger SQL

```sql
-- Trigger przepisuje item_evaluations jako nano_skill_ratings
INSERT INTO public.student_events (..., event_payload)
VALUES (...,
  jsonb_build_object(
    'answer_id', NEW.id,
    'exercise_index', NEW.exercise_index,
    'exercise_type', NEW.exercise_type,
    'answers', NEW.answers,
    'mastery', NEW.mastery,
    'nano_skill_ratings', COALESCE(NEW.item_evaluations, '[]'::jsonb),
    'time_spent_seconds', ROUND(COALESCE(NEW.time_spent_ms, 0) / 1000.0, 1)
  )
);
```

#### Krok 3: Frontend - budowanie item_evaluations

W `useInteractiveSharedWorksheet.tsx`:

```tsx
// Nowa funkcja do budowania item_evaluations
const buildItemEvaluations = (
  exerciseData: any,
  answers: Record<string | number, any>,
  exerciseType: string
): { name: string; reason: string; mastery: number }[] | null => {
  if (!exerciseData) return null;
  
  const itemEvaluations: { name: string; reason: string; mastery: number }[] = [];
  
  // Pobierz pytania/itemy z exercise data
  const items = exerciseData.questions || exerciseData.items || 
                exerciseData.sentences || exerciseData.statements || [];
  
  items.forEach((item: any, idx: number) => {
    const nanoSkill = safeGetNanoSkill(item);
    if (!nanoSkill) return;
    
    // Oblicz mastery dla tego itemu
    const itemMastery = calculateItemMastery(exerciseType, exerciseData, idx, answers[idx]);
    
    itemEvaluations.push({
      name: nanoSkill.name,
      reason: nanoSkill.reason,
      mastery: itemMastery ?? 0
    });
  });
  
  return itemEvaluations.length > 0 ? itemEvaluations : null;
};

// W scheduleAutoSave:
const itemEvaluations = buildItemEvaluations(exerciseData, exerciseAnswers, exerciseType);

saveAnswer(exerciseIndex, exerciseType, exerciseAnswers, mastery, itemEvaluations);
```

#### Krok 4: Analogiczne zmiany w useInteractiveHomework.tsx

Identyczna logika - budowanie `item_evaluations` dla każdego ćwiczenia.

---

## OCZEKIWANE REZULTATY

### Po implementacji PROBLEM 1:

Event `worksheet_answer_saved` będzie miał strukturę:
```json
{
  "exercise_index": 0,
  "exercise_type": "multiple-choice-picture",
  "answers": { "0": "A", "1": "B", ... },
  "mastery": 60,
  "nano_skill_ratings": [
    {
      "name": "ns.reading.main_activity_identification",
      "reason": "Tests ability to identify the central action in a visual scene.",
      "mastery": 100
    },
    {
      "name": "ns.reading.detail_inference",
      "reason": "Tests inference of specific action from visual context.",
      "mastery": 0
    },
    ...
  ],
  "time_spent_seconds": 7.4
}
```

### Po implementacji PROBLEM 2:

Tooltip (HoverCard) pojawi się natychmiast po najechaniu na badge "ns (94%)" pokazując:
- Nazwę skill (np. "main activity identification")
- Reason (opis)
- Full ID (ns.reading.main_activity_identification)
- Confidence (94%)

I zniknie natychmiast po odsunięciu kursora.

---

## LISTA PLIKÓW DO EDYCJI

| # | Plik | Zmiana | Priorytet |
|---|------|--------|-----------|
| 1 | `src/components/worksheet/NanoSkillBadge.tsx` | Zamienić Tooltip na HoverCard | WYSOKI |
| 2 | SQL Migration | Dodać kolumnę `item_evaluations` do tabel | ŚREDNI |
| 3 | SQL Migration | Zaktualizować `save_worksheet_answer` i `save_homework_answer` | ŚREDNI |
| 4 | SQL Migration | Zaktualizować triggery do przepisywania `nano_skill_ratings` | ŚREDNI |
| 5 | `src/hooks/useInteractiveSharedWorksheet.tsx` | Dodać `buildItemEvaluations` i przekazywać do RPC | ŚREDNI |
| 6 | `src/hooks/useInteractiveHomework.tsx` | Dodać `buildItemEvaluations` i przekazywać do RPC | ŚREDNI |

---

## SEKCJA TECHNICZNA

### Obliczanie mastery per-item dla zamkniętych ćwiczeń

Logika jest już zaimplementowana w `NanoSkillMasteryModal.tsx` funkcja `calculateInitialMasteryForItem`. Musimy ją wyeksportować do nowego utility file i używać w hookach:

```tsx
// src/utils/masteryCalculator.ts
export const calculateItemMastery = (
  exerciseType: string,
  exerciseData: any,
  itemIndex: number,
  studentAnswer: any
): number | null => {
  // Logika z calculateInitialMasteryForItem
  // Zwraca 0-100 lub null dla open-ended
};
```

### Weryfikacja AI dla otwartych ćwiczeń

Dla zadań otwartych (listening-comprehension, describe, etc.) mastery per-item musi być pobierane z `verify-open-answers` edge function. To już działa - trzeba tylko zmapować wyniki do struktury `item_evaluations`.

