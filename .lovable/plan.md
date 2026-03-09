
## Two issues to fix

### Issue 1: Tooltip Bug — Root Cause Found

**In `FormView.tsx` line 61:**
```jsx
<div className="relative group">  // ← THIS is the problem
  <div className="absolute ... group-hover:opacity-30 ..."></div>
  <WorksheetForm />  // ← contains ALL exercise tooltips
</div>
```

In Tailwind CSS, `group-hover:` triggers for **any ancestor** with class `group`, not just the nearest parent. The glow wrapper in `FormView.tsx` has `group`, which makes **every single** exercise tooltip inside `ExerciseSelector.tsx` (which uses `group-hover:opacity-100`) fire simultaneously when hovering anywhere in the form.

**Fix:** Tailwind v3.1 named groups. Change `group` → `group/glow` and `group-hover:opacity-30` → `group-hover/glow:opacity-30` in `FormView.tsx`. This scopes the hover effect so it doesn't bleed into child `group` elements.

**File: `FormView.tsx`** — one line change on line 61-62.

---

### Issue 2: Feature Visuals in EcosystemSection

The user wants visuals that look like the real app — not generated images, but actual UI representations. Since the app already exists and uses violet/indigo, white cards, rounded corners and a consistent design language, I'll build **inline HTML/CSS mockups** that faithfully replicate what each feature actually looks like in the app.

**Layout change:** From 6 small icon+text cards → 6 larger cards with text on left + mini app-preview mockup on right.

Each mockup:

| Feature | Mockup shows |
|---|---|
| Live Sessions | Exercise card + running timer badge (e.g. 02:45) + score counter |
| Homework + AI Grading | Assignment card with deadline, AI badge showing "8/10 ✓ AI Graded" |
| Smart Flashcards | Two-sided flashcard flip animation — front: "elaborate", back: "to explain in detail" |
| Lesson Calendar | Mini 7-day calendar grid with colored slots (green=available, blue=booked) |
| Welcome Test | Placement test card with A1–C2 level buttons, progress bar |
| Share & Collaborate | Sharing link input + 3 student rows with green checkmarks |

**File: `EcosystemSection.tsx`** — full redesign of the section. No imports of external packages needed — pure Tailwind + inline JSX.

---

### Files to edit:

| File | Change |
|---|---|
| `src/components/worksheet/FormView.tsx` | `group` → `group/glow` (1 line fix) |
| `src/components/landing/EcosystemSection.tsx` | New layout with 6 UI mockup cards |

**Zero changes to:** WorksheetForm logic, ExerciseSelector, auth, generation.
