

# Plan: Auto-generowanie share token + usunięcie wygasania

## Podsumowanie zmian

Trzy rzeczy do zrobienia:
1. **Worksheet share token** — generować automatycznie w momencie zapisu do bazy (w edge function `generateWorksheet`), a nie po kliknięciu "Generate Share Link"
2. **Usunąć wygasanie** — share linki do worksheetów, homework i flashcardów mają być permanentne (bez `share_expires_at`)
3. **Uprościć ShareWorksheetModal** — nie potrzebuje już przycisku "Generate Share Link", od razu pokazuje gotowy link

---

## 1. Auto-generowanie share_token w `generateWorksheet` edge function

**Plik:** `supabase/functions/generateWorksheet/index.ts`

W momencie insertu worksheeta do bazy (linia 810-833) dodać dwa nowe pola:

```ts
const shareToken = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');

const { data: worksheet, error: worksheetError } = await supabase
  .from("worksheets")
  .insert({
    // ... istniejące pola ...
    share_token: shareToken,        // ← NOWE
    share_expires_at: null,         // ← NOWE: null = nigdy nie wygasa
  })
  .select("id, created_at, title, share_token");  // ← dodać share_token do select
```

Po insercie, dodać `share_token` do odpowiedzi:
```ts
worksheetData.share_token = worksheet[0].share_token;
```

To oznacza że frontend po wygenerowaniu worksheeta od razu dostaje `share_token`.

---

## 2. Migracja SQL — usunięcie wygasania

Jedna migracja SQL, która:

### A. Zmienia RPC `get_worksheet_by_share_token` — usunięcie warunku `share_expires_at > NOW()`:
```sql
DROP FUNCTION IF EXISTS public.get_worksheet_by_share_token(text);
CREATE OR REPLACE FUNCTION public.get_worksheet_by_share_token(p_share_token text)
RETURNS TABLE(id uuid, title text, ai_response text, html_content text, created_at timestamptz, teacher_email text, selected_image jsonb, selected_audio jsonb, audio_url text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT w.id, w.title, w.ai_response, w.html_content, w.created_at, w.teacher_email, w.selected_image, w.selected_audio, w.audio_url
  FROM worksheets w
  WHERE w.share_token = p_share_token AND w.deleted_at IS NULL;
END;
$function$;
```

### B. Zmienia RPC `get_homework_by_share_token` — usunięcie warunku `share_expires_at > NOW()`:
```sql
DROP FUNCTION IF EXISTS get_homework_by_share_token(text);
CREATE OR REPLACE FUNCTION get_homework_by_share_token(p_share_token TEXT)
-- ... ta sama sygnatura co teraz ...
AS $$
BEGIN
  RETURN QUERY SELECT ...
  FROM homework_assignments ha ...
  WHERE ha.share_token = p_share_token;  -- bez warunku expires
END;
$$;
```

### C. Zmienia RPC `generate_worksheet_share_token` — usunięcie `share_expires_at`:
```sql
DROP FUNCTION IF EXISTS public.generate_worksheet_share_token(uuid, uuid, integer);
CREATE OR REPLACE FUNCTION public.generate_worksheet_share_token(p_worksheet_id uuid, p_teacher_id uuid, p_expires_hours integer DEFAULT null)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'extensions'
AS $function$
DECLARE new_token TEXT;
BEGIN
  new_token := encode(extensions.gen_random_bytes(32), 'hex');
  UPDATE public.worksheets 
  SET share_token = new_token, share_expires_at = null
  WHERE id = p_worksheet_id AND teacher_id = p_teacher_id AND deleted_at IS NULL;
  IF FOUND THEN RETURN new_token; ELSE RETURN NULL; END IF;
END;
$function$;
```

### D. Zmienia RLS na `flashcard_sets` — usunięcie warunku `share_expires_at`:
```sql
DROP POLICY IF EXISTS "Public can view sets by share_token" ON public.flashcard_sets;
CREATE POLICY "Public can view sets by share_token" ON public.flashcard_sets
  FOR SELECT USING (share_token IS NOT NULL AND deleted_at IS NULL);
```

### E. Zmienia RPC `get_flashcard_set_by_share_token` — usunięcie warunku `share_expires_at > NOW()`.

### F. Ustawia `share_expires_at = NULL` na WSZYSTKICH istniejących worksheetach, homework i flashcardach:
```sql
UPDATE public.worksheets SET share_expires_at = NULL WHERE share_expires_at IS NOT NULL;
UPDATE public.homework_assignments SET share_expires_at = NULL WHERE share_expires_at IS NOT NULL;
UPDATE public.flashcard_sets SET share_expires_at = NULL WHERE share_expires_at IS NOT NULL;
```

---

## 3. Uproszczenie `ShareWorksheetModal.tsx`

Modal otwiera się i **od razu** wyświetla link (bo `share_token` już istnieje w bazie). Zmiana logiki:

- `checkExistingShareToken` — **usunięcie warunku `expiresAt > new Date()`** — wystarczy sprawdzić czy `share_token` istnieje
- Usunięcie przycisku "Generate Share Link" — token już jest
- Fallback: jeśli z jakiegoś powodu `share_token` nie istnieje (stary worksheet sprzed zmiany), wtedy wywołać RPC `generate_worksheet_share_token` automatycznie (bez kliknięcia)
- Usunięcie tekstu "Link expires in 10 days" — zamienić na "Share link is permanent"

```tsx
// Nowa logika w useEffect:
useEffect(() => {
  if (isOpen) loadShareUrl();
}, [isOpen]);

const loadShareUrl = async () => {
  setIsGenerating(true);
  const { data } = await supabase.from('worksheets').select('share_token').eq('id', worksheetId).single();
  if (data?.share_token) {
    setShareUrl(`${window.location.origin}/shared/${data.share_token}`);
  } else {
    // Fallback for old worksheets — auto-generate
    const { data: { user } } = await supabase.auth.getUser();
    const { data: token } = await supabase.rpc('generate_worksheet_share_token', { p_worksheet_id: worksheetId, p_teacher_id: user.id });
    if (token) setShareUrl(`${window.location.origin}/shared/${token}`);
  }
  setIsGenerating(false);
};
```

Modal od razu otwiera się z linkiem (lub z krótkim spinnerem jeśli fallback).

---

## Pliki do zmiany

| Plik | Zmiana |
|---|---|
| Migracja SQL | Usunięcie wygasania ze wszystkich RPC + update istniejących danych |
| `supabase/functions/generateWorksheet/index.ts` | Dodać `share_token` i `share_expires_at: null` do insertu |
| `src/components/ShareWorksheetModal.tsx` | Uprościć: auto-load token, usunąć przycisk Generate, usunąć info o wygasaniu |

## Kolejność

1. Migracja SQL
2. Edge function `generateWorksheet`
3. `ShareWorksheetModal.tsx`

