

# Plan wdrozenia - 5 niezaimplementowanych problemow

## Podsumowanie analizy stanu

Przeanalizowalem caly kod. Oto co zostalo zrobione, a co NIE:

| Problem | Status | Co brakuje |
|---|---|---|
| 1. Discussion speaking w SharedWorksheet | NIE ZROBIONE | `SharedWorksheetContent.tsx` linia 459 nadal uzywa `<input type="text">`, brak importu `HomeworkSpeakingRecorder` |
| 2.1 Recorder inline (po lewej) | NIE ZROBIONE | Recorder nadal jest POD textarea we wszystkich komponentach (np. `ExerciseAnswerQuestions.tsx` linia 194, `ExerciseDescribe.tsx` linia 119) |
| 2.2 Auto-save nagran | NIE ZROBIONE | Brak globalnego rejestru pending, brak flush w `submitHomework`, brak 30s timer |
| 3. Admin - cleanup kont + filtr | CZESCIOWO | Edge functions SA deployed (admin-impersonate zwraca 401 nie 404 - dziala!). ALE: 1469 kont bez maila nadal w bazie, `config.toml` linia 16 nadal `enable_anonymous_sign_ups = true`, AdminDashboardPage NIE filtruje kont bez emaila, brak przycisku cleanup |
| 4. DSLM fix buildItemEvaluations | NIE ZROBIONE | `useInteractiveHomework.tsx` linia 446 nadal uzywa `safeGetNanoSkill()` (1 skill) zamiast `buildItemEvaluations()` (wszystkie skille) |

---

## Problem 1: Discussion w SharedWorksheet - brak recordera

**Plik:** `src/components/shared/SharedWorksheetContent.tsx`

**Zmiana 1:** Dodac import na gorze (po linii 28):
```
import { HomeworkSpeakingRecorder } from '@/components/homework/HomeworkSpeakingRecorder';
import { AutoResizeTextarea } from '@/components/ui/AutoResizeTextarea';
```

**Zmiana 2:** Zamienic linie 458-466 (blok discussion interactive):
```
Z:
  <input type="text" value={studentAnswer}
    onChange={(e) => onAnswerChange?.(index, exercise.type, qIndex, e.target.value)}
    placeholder="Share your thoughts..." className="w-full h-10 border rounded px-3" />

Na:
  <div className="flex items-start gap-2">
    {onAudioAnswerChange && (
      <HomeworkSpeakingRecorder
        existingAudioUrl={audioAnswers?.[index]?.[qIndex]}
        onAudioSaved={(url) => onAudioAnswerChange(index, qIndex, url)}
      />
    )}
    <div className="flex-1">
      <AutoResizeTextarea
        value={studentAnswer}
        onChange={(e) => onAnswerChange?.(index, exercise.type, qIndex, e.target.value)}
        placeholder="Share your thoughts..."
        className="w-full min-h-[40px]" rows={1}
      />
    </div>
  </div>
```

---

## Problem 2.1: Recorder po lewej stronie textarea (zamiast pod)

Dotyczy 5 komponentow jednokolumnowych. W kazdym zamieniamy uklad z "recorder pod textarea" na "recorder po lewej w flex row":

**A. `ExerciseAnswerQuestions.tsx` linie 193-223:**
Zamienic `<div className="ml-4 mt-1">` na `<div className="ml-4 mt-1 flex items-start gap-2">`, przeniesc `HomeworkSpeakingRecorder` PRZED `<div className="flex-1">` z textarea i badges.

**B. `ExerciseDescribe.tsx` linie 118-143:**
Identyczna zmiana.

**C. `HomeworkExerciseRenderer.tsx` linie 228-253 (discussion):**
Owinac `AutoResizeTextarea` + `AiEvaluationBadge` + `HomeworkSpeakingRecorder` we `flex items-start gap-2`, recorder po lewej.

**D. `ExerciseListeningComprehension.tsx`** - analogicznie tam gdzie jest recorder.

**E. `ExerciseParaphrasing.tsx`** - analogicznie.

**F. `ExerciseAnswerQuestionsAudio.tsx`** - analogicznie.

**WYJATKI BEZ ZMIAN:** `ExerciseReading.tsx`, `ExerciseDialogue.tsx` (2 kolumny).

Wzorzec zmiany (identyczny we wszystkich):
```
Z:
<div className="ml-4 mt-1">
  <AutoResizeTextarea ... />
  {aiEval badge}
  {onAudioAnswerChange && (<HomeworkSpeakingRecorder ... />)}
</div>

Na:
<div className="ml-4 mt-1 flex items-start gap-2">
  {onAudioAnswerChange && (<HomeworkSpeakingRecorder ... />)}
  <div className="flex-1">
    <AutoResizeTextarea ... />
    {aiEval badge}
  </div>
</div>
```

---

## Problem 2.2: Auto-save nagran

**A. `HomeworkSpeakingRecorder.tsx` - dodac `registryKey` prop + globalny rejestr + 30s auto-save:**

Dodac prop `registryKey?: string` do interfejsu.

Na poczatku pliku (poza komponentem):
```typescript
if (typeof window !== 'undefined' && !(window as any).__pendingSpeakingRecordings) {
  (window as any).__pendingSpeakingRecordings = new Map();
}
```

Dodac state:
```typescript
const [autoSaveCountdown, setAutoSaveCountdown] = useState<number | null>(null);
```

Dodac useEffect po zmianie statusu na 'recorded':
```typescript
useEffect(() => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  if (status === 'recorded' && blobRef.current) {
    if (registryKey) {
      (window as any).__pendingSpeakingRecordings?.set(registryKey, { blob: blobRef.current, save: uploadAndSave });
    }
    setAutoSaveCountdown(30);
    timer = setTimeout(() => { if (status === 'recorded') uploadAndSave(); }, 30000);
  }
  if (status === 'done' || status === 'idle') {
    if (registryKey) (window as any).__pendingSpeakingRecordings?.delete(registryKey);
    setAutoSaveCountdown(null);
  }
  return () => { if (timer) clearTimeout(timer); };
}, [status, registryKey, uploadAndSave]);
```

Countdown ticker:
```typescript
useEffect(() => {
  if (autoSaveCountdown === null || autoSaveCountdown <= 0) return;
  const t = setInterval(() => setAutoSaveCountdown(p => p !== null ? p - 1 : null), 1000);
  return () => clearInterval(t);
}, [autoSaveCountdown]);
```

W renderze (obok przyciskow 'recorded'):
```
{autoSaveCountdown !== null && autoSaveCountdown > 0 && (
  <span className="text-xs text-muted-foreground">Auto-save {autoSaveCountdown}s</span>
)}
```

**B. `useInteractiveHomework.tsx` - flush w submitHomework (linia 269, na poczatku):**
```typescript
// Flush pending recordings before submit
const pendingMap = (window as any).__pendingSpeakingRecordings as Map<string, { save: () => Promise<void> }> | undefined;
if (pendingMap && pendingMap.size > 0) {
  console.log(`[submitHomework] Flushing ${pendingMap.size} pending recordings...`);
  await Promise.all(Array.from(pendingMap.values()).map(e => e.save().catch(console.error)));
  await new Promise(r => setTimeout(r, 500));
}
```

**C. Przekazywanie registryKey z rendererow:**
We wszystkich komponentach ktore uzywaja `HomeworkSpeakingRecorder`, dodac prop `registryKey={`${exerciseIndex}_${qIndex}`}`. Wymaga dodania `exerciseIndex` jako prop tam gdzie go jeszcze nie ma - w HomeworkExerciseRenderer juz jest dostepny jako zmienna `index`.

---

## Problem 3: Admin cleanup + filtrowanie + config

**A. `supabase/config.toml` linia 16:**
```
Z: enable_anonymous_sign_ups = true
Na: enable_anonymous_sign_ups = false
```

**B. `AdminDashboardPage.tsx`:**

1. Dodac filtr kont bez emaila (linia 108):
```typescript
const filteredTeachers = teachers.filter(t => {
  if (!t.email) return false; // Hide anonymous accounts
  if (!searchQuery) return true;
  const q = searchQuery.toLowerCase();
  return t.email?.toLowerCase().includes(q) || t.first_name?.toLowerCase().includes(q) || t.last_name?.toLowerCase().includes(q);
});
```

2. Dodac state `isCleaningUp` i handler `handleCleanup`:
```typescript
const [isCleaningUp, setIsCleaningUp] = useState(false);
const handleCleanup = async () => {
  setIsCleaningUp(true);
  try {
    const { data, error } = await supabase.functions.invoke('cleanup-anonymous-users');
    if (error) throw error;
    toast({ title: `Cleaned up ${data?.deleted_count || 0} anonymous accounts` });
    // Refresh list
    const { data: profiles } = await supabase.from('profiles')
      .select('id, email, first_name, last_name, subscription_type, subscription_status, available_tokens, total_worksheets_created, created_at')
      .is('deleted_at', null).order('created_at', { ascending: false });
    setTeachers((profiles as TeacherProfile[]) || []);
  } catch (err: any) {
    toast({ title: 'Cleanup failed', description: err.message, variant: 'destructive' });
  } finally { setIsCleaningUp(false); }
};
```

3. Dodac sekcje cleanup (po Stats cards, przed Search):
```
{teachers.filter(t => !t.email).length > 0 && (
  <Card className="border-amber-200 bg-amber-50">
    <CardContent className="p-4 flex items-center justify-between">
      <div>
        <div className="font-medium text-amber-800">{teachers.filter(t => !t.email).length} anonymous accounts (no email)</div>
        <div className="text-xs text-amber-600">Legacy ghost accounts. Safe to remove.</div>
      </div>
      <Button variant="outline" size="sm" onClick={handleCleanup} disabled={isCleaningUp}
        className="border-amber-400 text-amber-700 hover:bg-amber-100">
        {isCleaningUp ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
        Clean up
      </Button>
    </CardContent>
  </Card>
)}
```

**UWAGA:** Edge functions `admin-impersonate` i `cleanup-anonymous-users` SA juz deployed i dzialaja (zwracaja 401 bez auth). Blad 404 ktory widziales byl prawdopodobnie chwilowy problem z deploymentem - teraz dziala.

---

## Problem 4: DSLM fix - uzyc buildItemEvaluations

**Plik:** `src/hooks/useInteractiveHomework.tsx` linie 442-467

Zamienic recznie budowane mapowanie:
```typescript
// STARY KOD (linie 445-467):
const itemsWithNanoSkill = questionItems
  .map((item: any, idx: number) => ({ item, idx, nanoSkill: safeGetNanoSkill(item) }))
  .filter((x: any) => x.nanoSkill !== null);
const itemEvals: ItemEvaluation[] = evalData.question_evaluations.map(...)
```

Na:
```typescript
import { buildItemEvaluations } from '@/utils/masteryCalculator';

// NOWY KOD:
const aiEvalLookup: Record<number, { quality_score?: number; writing_score?: number; speaking_score?: number }> = {};
if (evalData.question_evaluations) {
  evalData.question_evaluations.forEach((qEval: any, aiIdx: number) => {
    const qIdx = qEval.question_index ?? aiIdx;
    aiEvalLookup[qIdx] = {
      quality_score: qEval.quality_score,
      writing_score: qEval.writing_score,
      speaking_score: qEval.speaking_score,
    };
  });
}
const itemEvals = buildItemEvaluations(
  exerciseData, studentAnswersForExercise, ans.exercise_type, aiEvalLookup, audioAnswers[exIdx] || null
) || [];
```

Reszta kodu (overallMastery, update do bazy) bez zmian.

## DSLM Layer A/B Readiness Checklist

```text
#  | Element                                    | Status
1  | student_events INSERT na kazda odpowiedz   | OK - triggery SQL dzialaja
2  | event_type kanoniczny                      | OK
3  | mastery kolumna wypelniana                  | OK - trigger ustawia z payload
4  | element_type wypelniany                     | OK - extract_skill_category()
5  | skill_ids wypelniany                        | OK - extract_skill_name()
6  | Brak duplikatow                             | OK - DELETE+INSERT
7  | buildItemEvaluations - ALL nano_skills      | DO NAPRAWY - homework gubi secondary skills
8  | adjustConfidenceByAnswerType                | OK - zaimplementowane
9  | student_skill_metrics auto-refresh          | OK - trigger trg_refresh_skill_metrics
10 | student_category_metrics widok              | OK - VIEW z agregacja
11 | Frontend Skills tab                         | OK - SkillsOverviewPanel
12 | Dual nano_skill (writing+speaking)          | CZESCIOWY - fix w pkt 4 naprawi
```

---

## Kolejnosc implementacji

1. Config.toml - 1 linia
2. SharedWorksheetContent - discussion recorder
3. Recorder inline layout - 6 plikow
4. Auto-save recorder - HomeworkSpeakingRecorder + useInteractiveHomework
5. AdminDashboardPage - filtr + cleanup
6. DSLM fix buildItemEvaluations
7. Deploy edge functions (re-deploy dla pewnosci)
8. Dokumentacja

## Lista plikow do zmiany

| Plik | Problem |
|---|---|
| `supabase/config.toml` | 3 - anonymous sign-ups false |
| `src/components/shared/SharedWorksheetContent.tsx` | 1, 2.1 - import recorder, discussion, flex layout |
| `src/components/worksheet/ExerciseAnswerQuestions.tsx` | 2.1 - flex layout |
| `src/components/worksheet/ExerciseDescribe.tsx` | 2.1 - flex layout |
| `src/components/worksheet/ExerciseListeningComprehension.tsx` | 2.1 - flex layout |
| `src/components/worksheet/ExerciseAnswerQuestionsAudio.tsx` | 2.1 - flex layout |
| `src/components/worksheet/ExerciseParaphrasing.tsx` | 2.1 - flex layout |
| `src/components/homework/HomeworkExerciseRenderer.tsx` | 2.1 - discussion flex layout |
| `src/components/homework/HomeworkSpeakingRecorder.tsx` | 2.2 - registryKey, globalny rejestr, 30s auto-save |
| `src/hooks/useInteractiveHomework.tsx` | 2.2, 4 - flush pending + buildItemEvaluations |
| `src/pages/AdminDashboardPage.tsx` | 3 - filtr + cleanup button |
| Dokumentacja (6 plikow) | Aktualizacja |

