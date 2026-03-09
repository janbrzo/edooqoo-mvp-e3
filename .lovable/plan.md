
## Analysis of 4 UI/UX Issues

### Problem 1: Hero Section Trust Badges Still Too Tight
Current `HeroHeadline.tsx` line 66: `gap-4 mb-5` provides 20px space before ticker. User feedback indicates this is still insufficient visual breathing room.

**Fix:** Change `mb-5` → `mb-8` (32px) for better visual separation between trust badges and ticker.

### Problem 2: Headline Line Breaking Issue  
Current structure allows "Stop wasting [day] evenings" to wrap internally when day names are long (e.g., "Wednesday"). User wants this phrase to always stay on one line.

**Fix:** Wrap the first part in `whitespace-nowrap`:
```tsx
<span className="whitespace-nowrap">
  Stop wasting{' '}
  <span className="day-animation">{days[dayIndex]}</span>
  {' '}evenings
</span>
<br />
```

### Problem 3: PricingSection.tsx Has Outdated Features (Real Issue!)
User is viewing homepage `/` which uses `PricingSection.tsx`, NOT `Pricing.tsx`. The PricingSection.tsx was never updated and still shows:
- Line 131: "Try our worksheet generator" (should be "Start teaching smarter today")
- Line 138: "2 free tokens + limited access" (should be "2 free worksheets to start")  
- Line 149: "2 free tokens on signup" (should be "2 free worksheets on signup")
- Missing features: Live Session mode, Homework Assignments, Student Knowledge tracking

This explains why user sees old content despite Pricing.tsx being updated.

### Problem 4: Remove Unused Imports from Pricing.tsx
Based on code analysis, these imports are not used anywhere: `User`, `GraduationCap`, `FileText`, `DollarSign`, `Bell`, `HomeworkNotificationBadge`.

## Implementation Plan

**File 1: `src/components/landing/HeroHeadline.tsx`**
- Line 66: `gap-4 mb-5` → `gap-4 mb-8`
- Lines 41-56: Wrap first line in `whitespace-nowrap` while preserving day animation

**File 2: `src/components/PricingSection.tsx`** 
- Line 131: Update description
- Line 138: Update badge text  
- Line 149: Change "tokens" → "worksheets"
- Lines 170+: Add 3 missing features after "Draw on Worksheet"

**File 3: `src/pages/Pricing.tsx`**
- Line 9: Remove unused imports: `User, GraduationCap, FileText, DollarSign, Bell`
- Line 17: Remove `HomeworkNotificationBadge` import

## Expected Outcome
- Hero section with proper visual hierarchy and breathing room
- Headline that stays consistently formatted across all day names  
- Homepage pricing section with accurate, comprehensive feature list
- Cleaner Pricing.tsx code with no unused imports

Zero impact on: form generation, authentication, dashboard functionality, or responsive behavior on other pages.
