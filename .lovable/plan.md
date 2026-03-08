
Cel: naprawić 2 zgłoszone problemy bez ryzyka regresji i bez zmiany logiki działania kalendarza — tylko poprawa umiejscowienia UI + czytelności dropdownu kolorów.

1) Problem: Calendar button jest w złym miejscu (Form + Worksheet)
Diagnoza:
- Obecnie przycisk jest renderowany lokalnie w:
  - `src/components/WorksheetForm/index.tsx` (wewnątrz karty formularza)
  - `src/components/worksheet/WorksheetToolbar.tsx` (w sticky toolbarze)
- To jest inny poziom UI niż pasek globalny z „Tokens Left / Dashboard / Profile”.
- Na stronie worksheet właściwy pasek globalny jest w `src/components/worksheet/WorksheetHeader.tsx`.
- Na stronie formularza właściwy pasek globalny jest w `src/pages/Index.tsx` (`AuthenticatedNav`).

Docelowe rozwiązanie (spójne z /student):
- Przenieść Calendar do globalnych headerów:
  1. `src/pages/Index.tsx`:
     - dodać `<GCalStatusButton />` do `AuthenticatedNav` obok Dashboard/Profile.
     - zachować kolejność: Tokens Left → Notifications → Dashboard → Profile → Calendar (lub Calendar między Dashboard/Profile; finalnie ustalić jedną spójną kolejność i trzymać wszędzie taką samą).
  2. `src/components/worksheet/WorksheetHeader.tsx`:
     - dodać `<GCalStatusButton />` do prawej sekcji z Tokens/Dashboard/Profile.
  3. Usunąć lokalne renderowanie Calendar z:
     - `src/components/WorksheetForm/index.tsx`
     - `src/components/worksheet/WorksheetToolbar.tsx`
- Dodać odporność responsywną (żeby nie psuć desktop/mobile):
  - w globalnych headerach użyć `flex-wrap` + `justify-end` po prawej stronie.

Efekt:
- Ten sam wzorzec nawigacji na formularzu i worksheet:
  - przycisk Calendar zawsze „na samej górze” obok Dashboard/Profile, w tym samym pasku co Tokens Left.

2) Problem: Event colors by status — dropdown nadal za wąski
Diagnoza:
- `src/pages/CalendarSettingsPage.tsx` ma `SelectTrigger` z własnym wrapperem `<span>...<SelectValue/></span>`.
- W komponencie `SelectTrigger` z `ui/select.tsx` jest globalny styl `"[&>span]:line-clamp-1"`, który obcina bezlitośnie pierwszy `span`.
- Samo zwiększenie szerokości do `w-48` nie rozwiązuje problemu w każdym przypadku.

Docelowe rozwiązanie:
- W sekcji „Event colors by status”:
  1. Zmienić strukturę triggera z `<span>` na `<div>` jako pierwszy child (omijamy line-clamp na `>span`).
  2. Renderować nazwę koloru jawnie z mapy `GCAL_COLORS` (zamiast polegać tylko na `SelectValue`), np. `currentColorLabel`.
  3. Zwiększyć szerokość triggera do `w-56` (lub `w-[220px]`).
  4. Dodać `SelectContent className="min-w-[220px]"` dla spójnej szerokości dropdownu.
  5. W triggerze dodać `min-w-0` + `truncate` tylko na labelu (kontrolowane, czytelne skracanie).

Efekt:
- Widać kropkę koloru i pełną nazwę (bez „…”) dla standardowych nazw Google kolorów.

3) Kolejność wdrożenia (minimalizacja ryzyka)
1. Przeniesienie Calendar do `Index.tsx` (AuthenticatedNav).
2. Dodanie Calendar do `WorksheetHeader.tsx`.
3. Usunięcie Calendar z `WorksheetForm/index.tsx`.
4. Usunięcie Calendar z `WorksheetToolbar.tsx`.
5. Poprawa struktury + szerokości Event colors dropdown w `CalendarSettingsPage.tsx`.
6. Szybka weryfikacja UI na desktop + mobile.

4) Testy akceptacyjne (obowiązkowe, end-to-end)
A. Formularz (`/` jako zalogowany teacher):
- W top-right jest: Tokens Left + Dashboard + Profile + Calendar.
- Brak dodatkowego Calendar w treści formularza.
B. Worksheet (po wygenerowaniu):
- W top headerze (tym samym co Tokens/Dashboard/Profile) jest Calendar.
- W sticky toolbarze nie ma już osobnego Calendar.
C. Calendar Settings:
- W „Event colors by status” w triggerze widać kropkę + pełną nazwę koloru.
- Po wyborze innego koloru nazwa i kropka aktualizują się poprawnie.
D. Regresja:
- Klik Calendar nadal prowadzi na `/calendar`.
- Brak zmian w logice sync; tylko UI/pozycjonowanie.

5) Pliki do modyfikacji
- `src/pages/Index.tsx`
- `src/components/worksheet/WorksheetHeader.tsx`
- `src/components/WorksheetForm/index.tsx`
- `src/components/worksheet/WorksheetToolbar.tsx`
- `src/pages/CalendarSettingsPage.tsx`

6) Dokumentacja po wdrożeniu (krótki update)
- `docs/CURRENT_STATE_ANALYSIS.md` — opisać nową docelową lokalizację Calendar button + fix dropdownu kolorów.
- Pozostałe dokumenty wg Twojego standardu aktualizacji po zmianach.
