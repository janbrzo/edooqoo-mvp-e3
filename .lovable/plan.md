

# Plan: Ujednolicony Panel Studenta (Student Hub)

## Kontekst i analiza obecnego stanu

Aktualnie student ma rozsiane po różnych URL-ach dostęp do swoich materiałów:
- **Flashcards**: `/my-flashcards/:studentEmail` — dedykowana strona, ale wymaga znania emaila w URL
- **Bookings**: `/book` → `/book/:token` — model email-first, localStorage 7 dni
- **Homework**: `/homework/:shareToken` — osobne linki per zadanie, brak listy
- **Shared worksheets**: `/shared/:shareToken` — osobne linki per worksheet, brak listy
- **Lessons history**: `/my-lessons/:token` — uproszczony widok po student_id

Brak jednego miejsca, gdzie student widzi wszystko. Brak dashboardu.

## Architektura rozwiązania

### URL: `/my` — Student Hub Dashboard

Prosty adres. Student wchodzi na `edooqoo.com/my`, wpisuje email, i ma dostęp do wszystkiego.

### Weryfikacja tożsamości

Model identyczny jak na `/book` — **email-first**, bez konta:
1. Student wchodzi na `/my`
2. Wpisuje email
3. System szuka wszystkich nauczycieli powiązanych z tym emailem (istniejąca edge function `find-teachers-by-student-email` + rozszerzona o dodatkowe dane)
4. Email zapisywany w `localStorage` na 30 dni (klucz: `student_hub_email`)
5. Przycisk „Log out" czyści localStorage
6. Jeśli student ma jednego nauczyciela — od razu dashboard. Jeśli wielu — wybór nauczyciela (jak na `/book`)

### Struktura stron

```text
/my                     → Landing: email input + teacher select
/my/:teacherToken       → Dashboard studenta u konkretnego nauczyciela
/my/:teacherToken/flashcards   → Lista flashcard sets
/my/:teacherToken/homework     → Lista homework assignments
/my/:teacherToken/worksheets   → Lista shared worksheets
/my/:teacherToken/lessons      → Bookings (jak /book/:token sekcja Your Lessons)
```

`teacherToken` = `public_calendar_token` z tabeli `calendar_settings` (już istnieje, unikalny per nauczyciel).

### Nowa Edge Function: `get-student-hub-data`

Centralna funkcja zwracająca wszystkie dane studenta u danego nauczyciela. Parametry: `{ token, email }`.

Zwraca:
```ts
{
  teacherName: string;
  studentName: string;
  studentId: string;
  flashcardSets: Array<{
    id, title, description, share_token, cards_count, mastered_count, 
    is_bidirectional, back_type, created_at, updated_at
  }>;
  homeworks: Array<{
    id, title, share_token, deadline, created_at, completed_at, 
    reviewed_at, source_worksheet_title, exercises_count, 
    completed_exercises_count
  }>;
  sharedWorksheets: Array<{
    id, title, share_token, created_at, english_level, lesson_topic,
    share_expires_at, exercises_count, completed_exercises_count,
    linked_slot_date  // jeśli worksheet jest przypisany do slotu
  }>;
  upcomingLessons: Array<{
    id, slot_date, start_time, end_time, status, title, notes,
    meeting_link, confirmed_at, worksheet_share_token
  }>;
  stats: {
    totalLessons: number;
    completedLessons: number;
    upcomingLessons: number;
    activeHomeworks: number;
    flashcardSetsCount: number;
    totalFlashcards: number;
    masteredFlashcards: number;
  }
}
```

Logika wewnętrzna:
1. Weryfikacja tokena → `teacher_id`
2. Znalezienie studenta po email + teacher_id w tabeli `students`
3. Flashcards: `flashcard_sets` + `flashcard_cards` count + `flashcard_progress` mastered count
4. Homework: `homework_assignments` z `share_token` + join z `homework_student_answers` dla postępu
5. Shared worksheets: `worksheets` z `share_token IS NOT NULL` + `student_id` + join z `worksheet_student_answers` dla postępu
6. Lessons: `calendar_slots` z `student_id` — upcoming (future + today) + ostatnie 5 past

### Komponenty frontend

#### 1. `src/pages/StudentHubLanding.tsx` — strona `/my`

Identyczna logika jak `BookLandingPage.tsx`:
- Input email → `find-teachers-by-student-email` → lista nauczycieli
- localStorage `student_hub_email` TTL 30 dni
- Klik na nauczyciela → `/my/:teacherToken`
- Jeśli 1 nauczyciel → auto-redirect
- Design: prosty, czysty, ikona + "Welcome! Enter your email to access your learning materials"
- Logout button (jeśli email saved)

#### 2. `src/pages/StudentHubDashboard.tsx` — strona `/my/:teacherToken`

Dashboard z sekcjami:

**Header**: "Welcome, {studentName}! 👋" + nauczyciel badge + logout

**Quick Stats** (karty na górze):
- 📚 X Flashcard sets (Y mastered / Z total cards)
- 📝 X Active homeworks
- 📄 X Shared worksheets
- 📅 Next lesson: {date} at {time}

**Sekcja 1: Next Lesson** (jeśli jest upcoming)
- Kafelek z datą, godziną, statusem, meeting linkiem
- Przycisk "View all lessons" → `/my/:token/lessons`

**Sekcja 2: Flashcards** (ostatnie 3 sety)
- Karty z tytułem, postępem, przyciskami Browse/Study
- "View all flashcards" → `/my/:token/flashcards`

**Sekcja 3: Homework** (ostatnie 3, posortowane: pending first)
- Kafelek: tytuł, deadline, postęp (X/Y exercises), status badge
- "View all homework" → `/my/:token/homework`

**Sekcja 4: Shared Worksheets** (ostatnie 3)
- Kafelek: tytuł, level, topic, postęp study mode
- "View all worksheets" → `/my/:token/worksheets`

#### 3. Podstrony kategorii

- `StudentHubFlashcards.tsx` → pełna lista flashcard sets (reuse logiki z `StudentPortal.tsx`)
- `StudentHubHomework.tsx` → pełna lista homework z filtrami (Pending/Completed/Overdue)
- `StudentHubWorksheets.tsx` → pełna lista shared worksheets
- `StudentHubLessons.tsx` → reuse `StudentBookingsSection` (jak na `/book/:token`)

Każda podstrona ma:
- Nawigację powrotną do dashboardu
- Shared header z imieniem studenta
- Sortowanie i filtry

### Layout i nawigacja

Wspólny layout `StudentHubLayout.tsx`:
- Sticky header: logo + student name + teacher name + logout
- Tab navigation (ikonki + tekst): Dashboard | Flashcards | Homework | Worksheets | Lessons
- Footer: "Powered by edooqoo"

### Co jeszcze powinno być na panelu studenta (punkt E z promptu)

1. **Welcome Test results** — jeśli student ma wykonany welcome test, pokaż wynik i rekomendowany poziom
2. **Teacher info** — imię nauczyciela, email kontaktowy
3. **Student profile** — imię, email, poziom angielskiego (read-only)

## Routing (App.tsx)

```tsx
<Route path="/my" element={<StudentHubLanding />} />
<Route path="/my/:teacherToken" element={<StudentHubDashboard />} />
<Route path="/my/:teacherToken/flashcards" element={<StudentHubFlashcards />} />
<Route path="/my/:teacherToken/homework" element={<StudentHubHomework />} />
<Route path="/my/:teacherToken/worksheets" element={<StudentHubWorksheets />} />
<Route path="/my/:teacherToken/lessons" element={<StudentHubLessons />} />
```

Obecne trasy (`/my-flashcards/:email`, `/my-lessons/:token`) zostawiamy jako redirect lub zachowujemy dla kompatybilności wstecznej.

## Kompatybilność

- **Nie ruszamy** istniejących stron `/book`, `/homework/:token`, `/flashcards/:token`, `/shared/:token` — one dalej działają jako bezpośrednie linki
- Student Hub jest **nakładką nawigacyjną** — klikając "Study" w flashcards na hubie, nawigujemy do istniejącej strony `/flashcards/:shareToken?email=...`
- Klikając homework → `/homework/:shareToken`
- Klikając worksheet → `/shared/:shareToken`
- Klikając lesson → otwiera booking detail (reuse `StudentBookingsSection`)

## Nowe pliki

| Plik | Opis |
|---|---|
| `supabase/functions/get-student-hub-data/index.ts` | Edge function — centralne API |
| `src/pages/StudentHubLanding.tsx` | Landing z email input |
| `src/pages/StudentHubDashboard.tsx` | Dashboard overview |
| `src/pages/StudentHubFlashcards.tsx` | Lista flashcard sets |
| `src/pages/StudentHubHomework.tsx` | Lista homework |
| `src/pages/StudentHubWorksheets.tsx` | Lista shared worksheets |
| `src/pages/StudentHubLessons.tsx` | Bookings/lessons |
| `src/components/student-hub/StudentHubLayout.tsx` | Shared layout z nav |
| `src/components/student-hub/StudentHubStats.tsx` | Quick stats cards |
| `src/hooks/useStudentHubData.tsx` | Hook do fetch danych z edge function |

## Edytowane pliki

| Plik | Zmiana |
|---|---|
| `src/App.tsx` | Dodanie 6 nowych route'ów |
| `supabase/functions/find-teachers-by-student-email/index.ts` | Opcjonalnie: zwracać też `studentName` |

## Kolejność wdrożenia

1. Edge function `get-student-hub-data`
2. Hook `useStudentHubData`
3. Layout `StudentHubLayout`
4. Landing page `/my`
5. Dashboard `/my/:teacherToken`
6. Podstrony: Flashcards, Homework, Worksheets, Lessons
7. Routing w App.tsx
8. Deploy edge function
9. Update docs

## Bezpieczeństwo

- Edge function używa `SUPABASE_SERVICE_ROLE_KEY` (jak `get-student-bookings`)
- Weryfikacja: token musi być valid + student email musi być powiązany z nauczycielem (tabela `students`)
- Brak dostępu do danych innych studentów
- Homework/worksheet dane zwracane tylko jeśli `share_token IS NOT NULL`
- Flashcards zwracane tylko jeśli `share_token IS NOT NULL` i `deleted_at IS NULL`

