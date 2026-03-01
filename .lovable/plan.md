

# Plan: Logowanie diagnostyczne + email alertów o nieudanych generowaniach

## Co robimy

### 1. Diagnostyczne logowanie w edge function (`generateWorksheet/index.ts`)

**Linia 136-142** — po `validatePrompt` failure, dodać `console.error`:
```ts
if (!promptValidation.isValid) {
  console.error("❌ Prompt validation FAILED:", {
    error: promptValidation.error,
    promptType: typeof prompt,
    promptLength: prompt?.length || 0,
    promptPreview: typeof prompt === 'string' ? prompt.substring(0, 200) : String(prompt),
    userId: userId || 'anonymous',
    hasFormData: !!formData,
    formDataKeys: formData ? Object.keys(formData) : [],
  });
  // ... existing 400 response
}
```

**Linia 589-591** — streaming error, dodać bogatsze logowanie:
```ts
console.error("❌ Streaming generation FAILED:", {
  errorMessage: error instanceof Error ? error.message : String(error),
  errorStack: error instanceof Error ? error.stack : undefined,
  userId, model: streamUsedModel, exerciseCount: expectedTotal,
});
```

Analogicznie w regular mode (~linia 698) i batch mode (~linia 283).

### 2. Guard przeciw podwójnemu kliknięciu (`useWorksheetGeneration.tsx`)

Na samym początku `generateWorksheetHandler` (linia 34), PRZED jakimkolwiek kodem:
```ts
const generateWorksheetHandler = async (data: FormData) => {
  if (isGenerating) {
    console.warn('⚠️ Generation already in progress, ignoring duplicate click');
    return;
  }
  // ... reszta kodu
```

### 3. NOWA edge function: `notify-generation-failure/index.ts`

Osobna edge function, wywoływana z `generateWorksheet/index.ts` po każdym nieudanym generowaniu. Używa istniejącego `RESEND_API_KEY`.

**Struktura:**
```ts
// supabase/functions/notify-generation-failure/index.ts
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const ALERT_EMAIL = "j4n.brz0@gmail.com";

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  
  const { errorMessage, errorType, userId, teacherEmail, promptPreview, model, timestamp } = await req.json();
  
  const resendKey = Deno.env.get('RESEND_API_KEY');
  if (!resendKey) return new Response(JSON.stringify({ skipped: true }));
  
  // Mapowanie przyczyn i rozwiązań
  const solutions: Record<string, string> = {
    'quota': 'Gemini API quota exceeded. Check Google AI Studio billing or switch primary model to OpenAI.',
    'validation': 'Prompt validation failed — likely empty or malformed prompt. Check frontend for race conditions.',
    'timeout': 'Generation timed out. Consider reducing exercise count or simplifying prompt.',
    'parse': 'AI returned invalid JSON. Model may need temperature adjustment or JSON mode enforcement.',
    'network': 'Network error connecting to AI provider. Check API key validity and provider status.',
    'database': 'Failed to save worksheet to database. Check Supabase connection and table constraints.',
    'default': 'Unknown error. Check edge function logs for full stack trace.',
  };
  
  const solution = solutions[errorType] || solutions['default'];
  
  const html = `
    <div style="font-family: sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #dc2626;">⚠️ Worksheet Generation Failed</h2>
      <table style="width:100%; border-collapse:collapse; margin: 16px 0;">
        <tr><td style="padding:6px; font-weight:bold; color:#666;">Time:</td><td style="padding:6px;">${timestamp}</td></tr>
        <tr><td style="padding:6px; font-weight:bold; color:#666;">Teacher:</td><td style="padding:6px;">${teacherEmail || 'anonymous'}</td></tr>
        <tr><td style="padding:6px; font-weight:bold; color:#666;">User ID:</td><td style="padding:6px;">${userId || 'N/A'}</td></tr>
        <tr><td style="padding:6px; font-weight:bold; color:#666;">Model:</td><td style="padding:6px;">${model || 'unknown'}</td></tr>
        <tr><td style="padding:6px; font-weight:bold; color:#666;">Error Type:</td><td style="padding:6px; color:#dc2626; font-weight:bold;">${errorType}</td></tr>
        <tr><td style="padding:6px; font-weight:bold; color:#666;">Error:</td><td style="padding:6px;">${errorMessage}</td></tr>
      </table>
      <div style="background:#fef3c7; border-left:4px solid #f59e0b; padding:12px; margin:16px 0;">
        <strong>💡 Proposed Solution:</strong><br/>${solution}
      </div>
      ${promptPreview ? `<details><summary style="cursor:pointer; color:#666;">Prompt preview (first 300 chars)</summary><pre style="background:#f5f5f5; padding:10px; font-size:12px; overflow:auto;">${promptPreview}</pre></details>` : ''}
      <div style="margin-top:20px;">
        <a href="https://supabase.com/dashboard/project/bvfrkzdlklyvnhlpleck/functions/generateWorksheet/logs" style="display:inline-block; padding:10px 24px; background:#2563eb; color:white; border-radius:6px; text-decoration:none;">View Edge Function Logs</a>
      </div>
    </div>
  `;
  
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'EDOQOO Alerts <notifications@edooqoo.com>',
      to: [ALERT_EMAIL],
      subject: `⚠️ Worksheet generation failed: ${errorType}`,
      html,
    }),
  });
  
  return new Response(JSON.stringify({ sent: true }));
});
```

### 4. Wywołanie alertu z `generateWorksheet/index.ts`

Dodać helper function na początku pliku:
```ts
async function notifyGenerationFailure(errorType: string, errorMessage: string, context: Record<string, any>) {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    await fetch(`${supabaseUrl}/functions/v1/notify-generation-failure`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ errorType, errorMessage, timestamp: new Date().toISOString(), ...context }),
    });
  } catch (e) {
    console.error("Failed to send failure notification:", e);
  }
}
```

Wywołania w kluczowych miejscach:
- **Prompt validation fail (linia ~137):** `notifyGenerationFailure('validation', promptValidation.error, { userId, promptPreview: prompt?.substring(0, 300) })`
- **Gemini quota fail + OpenAI fail (catch w streaming ~linia 453+):** `notifyGenerationFailure('quota', error.message, { userId, teacherEmail, model: 'gemini-2.5-flash' })`
- **Streaming error (linia ~589):** `notifyGenerationFailure(errorType, error.message, { userId, teacherEmail, model: streamUsedModel, promptPreview: sanitizedPrompt?.substring(0, 300) })`
- **Parse error (linia ~698):** `notifyGenerationFailure('parse', parseError.message, { userId, teacherEmail, model: usedModel })`
- **DB save error (linia ~788):** `notifyGenerationFailure('database', worksheetError.message, { userId, teacherEmail })`
- **Main catch (linia ~900+):** `notifyGenerationFailure('default', error.message, { userId: userId || 'unknown' })`

Klasyfikacja `errorType`:
- `error.message.includes('quota')` → `'quota'`
- `error.message.includes('timeout')` → `'timeout'`
- Inaczej → `'network'`

### 5. config.toml

Dodać:
```toml
[functions.notify-generation-failure]
verify_jwt = false
```

## Pliki

| Plik | Akcja |
|---|---|
| `supabase/functions/notify-generation-failure/index.ts` | NOWY |
| `supabase/functions/generateWorksheet/index.ts` | EDIT — logowanie + wywołania alertów |
| `src/hooks/useWorksheetGeneration.tsx` | EDIT — guard linia 34 |
| `supabase/config.toml` | EDIT — dodać nową function |

## Kolejność
1. Utworzyć `notify-generation-failure` edge function
2. Edytować `generateWorksheet/index.ts` — logowanie + alert calls
3. Edytować `useWorksheetGeneration.tsx` — guard
4. Edytować `config.toml`
5. Deploy obu edge functions

