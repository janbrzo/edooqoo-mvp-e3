

# Plan: Naprawa oceny audio w Homework — 3 problemy

## Diagnoza główna

**Wszystkie 3 problemy mają JEDNĄ przyczynę źródłową:** transkrypcja audio z frontendu ZAWSZE kończy się błędem 401 dla studentów korzystających z homework via share link.

### Dlaczego transkrypcja nie działa

Student otwiera homework przez link `/homework/<share_token>` — **NIE jest zalogowany** (brak sesji auth). Gdy `transcribeAllAudio()` woła `supabase.functions.invoke('transcribe-audio', ...)`, klient Supabase wysyła w nagłówku `Authorization: Bearer <ANON_KEY>` (bo nie ma sesji użytkownika).

W `transcribe-audio/index.ts`:
1. Token = anon key
2. `token === serviceRoleKey` → **false** (anon key ≠ service role key)
3. Wchodzi w ścieżkę user JWT → `supabase.auth.getUser()` → **error** (anon key to nie jest JWT użytkownika)
4. Zwraca **401 "Invalid authentication token"**

**Skutki kaskadowe:**
- `transcriptionCache` jest **pusty** → `buildAnswersToVerify` nie ma `effectiveAnswer` dla pytań audio-only → pomija je
- Puste cache → nic nie zapisuje się do DB (`_transcription_X` keys nigdy nie powstają)
- AI eval zwraca wyniki TYLKO dla pytań z odpowiedzią tekstową
- `nano_skill_ratings: []` dla audio events
- AI Score badge nie ma danych do wyświetlenia

### Dlaczego "reading" zadziałało

Ćwiczenie "reading" (exercise 5) miało PISEMNE odpowiedzi na question_index 1. Te trafiły do `answersToVerify` bez potrzeby transkrypcji. AI oceniło te odpowiedzi. Ale nawet tam — `nano_skill_ratings` mają TYLKO writing/reading skills, brak speaking (bo transkrypcja audio nie poszła).

---

## Plan naprawy — 3 zmiany

### Zmiana 1: Akceptacja anon key w `transcribe-audio`

**Plik:** `supabase/functions/transcribe-audio/index.ts`
**Linie:** 30-53

Dodać trzecią ścieżkę autoryzacji: jeśli token === SUPABASE_ANON_KEY, traktuj jako authorized anonymous caller.

**Uzasadnienie bezpieczeństwa:** Anon key jest JUŻ publiczny (jest w `src/integrations/supabase/client.ts` w kodzie frontendowym). Funkcja `transcribe-audio` nie mutuje danych — tylko transkrybuje audio URL. Jedyne ryzyko to nadużycie (koszty OpenAI Whisper), ale to samo ryzyko istnieje dla zalogowanych użytkowników.

**Dokładna zmiana:**

```typescript
const token = authHeader.replace('Bearer ', '');
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
let callerInfo = 'unknown';

if (token === serviceRoleKey) {
  callerInfo = 'service-role-internal';
  console.log('[transcribe-audio] Authorized via service role key (internal call)');
} else if (token === anonKey) {
  // Anonymous frontend call (e.g. student on homework via share link, not logged in)
  callerInfo = 'anon-frontend';
  console.log('[transcribe-audio] Authorized via anon key (anonymous frontend call)');
} else {
  // Frontend call with user JWT — validate
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Invalid authentication token' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  callerInfo = `user:${user.id}`;
}
```

Reszta funkcji bez zmian — walidacja `audio_url`, fetch, OpenAI Whisper API, format odpowiedzi.

### Zmiana 2: Filtrowanie `_transcription_X` kluczy w `buildAnswersToVerify`

**Plik:** `src/utils/audioEvalUtils.ts`
**Linia:** 84

Obecna linia:
```typescript
Object.keys(studentAnswersForExercise).forEach(k => allQuestionIndexes.add(parseInt(k)));
```

`parseInt("_transcription_0")` zwraca `NaN`, który trafia do Set. To jest nieszkodliwe (NaN → `questionItems[NaN]` = undefined → skip), ale brudne i może powodować edge case'y.

**Nowa linia:**
```typescript
Object.keys(studentAnswersForExercise)
  .filter(k => !k.startsWith('_'))  // Exclude internal keys like _transcription_X
  .forEach(k => {
    const idx = parseInt(k);
    if (!isNaN(idx)) allQuestionIndexes.add(idx);
  });
```

### Zmiana 3: Dodanie logów diagnostycznych do `transcribeAllAudio`

**Plik:** `src/utils/audioEvalUtils.ts`
**Funkcja:** `transcribeAllAudio`, linia 48

Po `supabase.functions.invoke`:
```typescript
if (transcError) {
  console.error(`${logPrefix} Transcription invoke error for ${cacheKey}:`, transcError);
  continue;  // Skip this audio, don't crash
}
```

Dodać jawne logowanie statusu invoke (sukces/error) żeby w przyszłości natychmiast wiedzieć czy invoke się udaje.

---

## Co się dzieje po tych zmianach

1. Student klika "Send Homework"
2. `transcribeAllAudio` woła `transcribe-audio` z anon key → **authorized** → transkrypcja działa
3. `transcriptionCache` jest pełny → `buildAnswersToVerify` tworzy wpisy dla audio-only pytań
4. `verify-open-answers` dostaje pełny payload z `audio_transcription` → zwraca `speaking_score` + `quality_score`
5. `groupedEvaluations` i `dbUpdates` zawierają wyniki dla wszystkich pytań
6. `AiEvaluationBadge` wyświetla AI Score
7. `_transcription_X` klucze zapisują się do `homework_student_answers.answers`
8. Trigger SQL buduje `nano_skill_ratings` z `item_evaluations` — poprawne wartości zamiast `[]`

## Zmieniane pliki

| Plik | Zmiana |
|------|--------|
| `supabase/functions/transcribe-audio/index.ts` | Dodanie anon key jako trzeciej ścieżki auth |
| `src/utils/audioEvalUtils.ts` | Filtrowanie `_transcription_X` kluczy + lepsze logi |

## Co NIE zmienia się

- `useInteractiveHomework.tsx` — logika `buildAnswersToVerify` z unii jest poprawna (zaimplementowana wcześniej)
- `masteryCalculator.ts` — `buildItemEvaluations` z audio-only jest poprawne (zaimplementowane wcześniej)  
- `HomeworkPage.tsx` — no-op zamiast undefined jest poprawne (zaimplementowane wcześniej)
- `process-pending-ai-evaluations` — async pipeline z service role key jest poprawny
- `verify-open-answers` — prompt i scoring logic są poprawne
- Triggery SQL — bez zmian

## Dokumentacja do aktualizacji

- `docs/TECHNICAL_DOCUMENTATION.md` — opis 3-ścieżkowej autoryzacji transcribe-audio
- `docs/CURRENT_STATE_ANALYSIS.md` — root cause fix

## Test akceptacyjny

Po wdrożeniu: ponownie zresetować homework submission → nagrać audio → Send Homework → sprawdzić:
1. `homework_student_answers.answers` zawiera klucze `_transcription_X`
2. `student_events.event_payload` dla `response_type: "audio"` ma niepuste `nano_skill_ratings`
3. Na stronie homework po submit widać AI Score badge przy pytaniach audio

