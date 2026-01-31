

# Plan naprawy 2 problemów

## 📊 Podsumowanie analizy

### PROBLEM 1: `nano_skill_ratings` jest pustą tablicą `[]` w eventach

**Znaleziona przyczyna główna:**

W pliku `src/utils/masteryCalculator.ts` funkcja `safeGetNanoSkill` (linie 46-57) NIE obsługuje przypadku gdy `nano_skill` jest **tablicą**:

```typescript
// OBECNY KOD (BŁĘDNY):
export const safeGetNanoSkill = (item: any): NanoSkillData | null => {
  if (!item) return null;
  const ns = item?.nano_skill || item?.nanoSkill;
  if (ns && ns.name) {  // ❌ Jeśli ns to tablica, ns.name = undefined!
    return { name: ns.name, reason: ns.reason || '', confidence: ns.confidence };
  }
  return null;  // ❌ Zawsze zwraca null dla tablic
};
```

Natomiast w bazie danych `nano_skill` jest często zapisane jako **tablica** (co widać w zapytaniu SQL):
```json
"nano_skill": [
  {
    "name": "ns.grammar.reported_speech.tense_shift_past_perfect",
    "confidence": 0.92,
    "reason": "Tests correct backshifting..."
  }
]
```

Funkcja `safeGetNanoSkill` w pliku `src/utils/textObjectFixer.ts` (linie 116-138) **prawidłowo** obsługuje tablice:
```typescript
// PRAWIDŁOWA WERSJA w textObjectFixer.ts:
if (Array.isArray(ns)) {
  return ns[0] || null;  // ✅ Pobiera pierwszy element z tablicy
}
```

**Konsekwencja:**
- `buildItemEvaluations()` nie może znaleźć `nano_skill` dla żadnego pytania
- Zwraca pustą tablicę `[]`
- RPC zapisuje `item_evaluations = null` do bazy
- Trigger przepisuje to jako `nano_skill_ratings: []` do event_payload

---

### PROBLEM 2: HoverCard/Tooltip nie pokazuje etykiety

**Analiza kodu `NanoSkillBadge.tsx`:**

Komponent używa `HoverCard` z Radix UI, ale może nie działać poprawnie z powodu:

1. **Brak `HoverCardPrimitive.Portal`** - HoverCardContent jest renderowany w aktualnym kontekście DOM, nie do body. Jeśli parent element ma `overflow: hidden`, content jest obcięty.

2. **Konflikt z `overflow-hidden`** - W `ExerciseMatching.tsx` linia 166:
   ```tsx
   <div className="... overflow-hidden">
   ```
   To blokuje widoczność HoverCardContent.

3. **Dodatkowy problem z pozycjonowaniem** - HoverCard w Radix domyślnie używa `floating-ui` do pozycjonowania, ale może być "wypychany" poza ekran.

**Dowód problemu:**
Wcześniej gdy tooltip był `position: fixed` w lewym górnym rogu - działał (był widoczny). Po zmianie na pozycjonowanie względne - przestał być widoczny, co wskazuje na `overflow` lub `z-index` issues.

---

## 🔧 Plan implementacji

### Zmiana 1: Naprawić `safeGetNanoSkill` w `masteryCalculator.ts`

Dodać obsługę tablic tak jak w `textObjectFixer.ts`:

```typescript
// src/utils/masteryCalculator.ts - linie 46-57
export const safeGetNanoSkill = (item: any): NanoSkillData | null => {
  if (!item) return null;
  
  let ns = item?.nano_skill || item?.nanoSkill;
  
  // NOWA LOGIKA: Obsługa tablic (Gemini czasem zwraca tablicę)
  if (Array.isArray(ns)) {
    ns = ns[0];  // Weź pierwszy element z tablicy
  }
  
  if (ns && ns.name) {
    return {
      name: ns.name,
      reason: ns.reason || '',
      confidence: ns.confidence
    };
  }
  return null;
};
```

---

### Zmiana 2: Naprawić HoverCard w `NanoSkillBadge.tsx`

Użyć `forceMount` + `Portal` aby wymusić renderowanie do body i ominąć problemy z `overflow`:

```tsx
// src/components/worksheet/NanoSkillBadge.tsx
import * as HoverCardPrimitive from "@radix-ui/react-hover-card";

// W komponencie zamiast HoverCardContent:
<HoverCardPrimitive.Portal>
  <HoverCardPrimitive.Content 
    side="top" 
    align="start"
    sideOffset={8}
    className="w-72 p-3 z-[9999] bg-white border rounded-lg shadow-lg"
    style={{ pointerEvents: 'auto' }}
  >
    {/* treść */}
  </HoverCardPrimitive.Content>
</HoverCardPrimitive.Portal>
```

Alternatywnie, jeśli to nie pomoże, użyć prostego `Popover` który jest bardziej niezawodny, lub wrócić do `position: fixed` z prostym state-based tooltip:

```tsx
// Prostsze rozwiązanie - custom tooltip z position: fixed
const [isHovered, setIsHovered] = useState(false);
const [position, setPosition] = useState({ x: 0, y: 0 });

<Badge
  onMouseEnter={(e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({ x: rect.left, y: rect.top - 8 });
    setIsHovered(true);
  }}
  onMouseLeave={() => setIsHovered(false)}
>
  ns ({confidencePercent}%)
</Badge>

{isHovered && ReactDOM.createPortal(
  <div 
    style={{ 
      position: 'fixed', 
      left: position.x, 
      top: position.y,
      transform: 'translateY(-100%)',
      zIndex: 9999 
    }}
    className="w-72 p-3 bg-white border rounded-lg shadow-lg"
  >
    {/* treść */}
  </div>,
  document.body
)}
```

---

## 📋 Lista plików do edycji

| # | Plik | Zmiana | Priorytet |
|---|------|--------|-----------|
| 1 | `src/utils/masteryCalculator.ts` | Naprawić `safeGetNanoSkill` - dodać obsługę tablic | **KRYTYCZNY** |
| 2 | `src/components/worksheet/NanoSkillBadge.tsx` | Naprawić HoverCard - użyć Portal lub custom tooltip | **WYSOKI** |
| 3 | `docs/TECHNICAL_DOCUMENTATION.md` | Zaktualizować dokumentację | NISKI |

---

## ✅ Oczekiwane rezultaty

### Po naprawie PROBLEM 1:

Event `worksheet_answer_saved` będzie zawierał pełną strukturę `nano_skill_ratings`:
```json
{
  "exercise_index": 0,
  "exercise_type": "true-false",
  "mastery": 56,
  "nano_skill_ratings": [
    {
      "name": "ns.grammar.reported_speech.tense_shift_past_perfect",
      "reason": "Tests correct backshifting from 'I spoke' to 'she had spoken'",
      "mastery": 100,
      "hasValue": true
    },
    {
      "name": "ns.grammar.reported_speech.time_expression_change",
      "reason": "Tests recognition of time expression changes",
      "mastery": 0,
      "hasValue": true
    }
    // ... dla każdego pytania osobno
  ]
}
```

### Po naprawie PROBLEM 2:

Tooltip z pełną informacją o nano skill pojawi się:
- Natychmiast po najechaniu kursorem na badge "ns (94%)"
- Bezpośrednio nad/przy badge (nie w rogu ekranu)
- Zniknie natychmiast po odsunięciu kursora
- Będzie zawierać: nazwę skill, reason, full ID, confidence

---

## 🧪 Jak przetestować

1. **Test PROBLEM 1:**
   - Otwórz shared worksheet jako student
   - Odpowiedz na kilka pytań w ćwiczeniu True/False
   - Poczekaj na auto-save (1.5s)
   - Sprawdź tabelę `student_events` - pole `nano_skill_ratings` powinno zawierać tablicę z danymi dla każdego pytania

2. **Test PROBLEM 2:**
   - Otwórz worksheet jako nauczyciel (Live Session)
   - Znajdź badge "ns (%)" przy pytaniu
   - Najedź kursorem na badge
   - Tooltip powinien pojawić się natychmiast bezpośrednio przy badge

