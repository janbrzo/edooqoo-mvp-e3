# Calendar Readiness Checklist

## Core Features
- [x] Teacher can create available slots (single, batch, recurring)
- [x] Teacher can assign students to slots
- [x] Teacher can link worksheets to lessons (local draft, saved on Save Changes)
- [x] Teacher can confirm/reject bookings
- [x] Teacher can cancel lessons (TC/SC distinction)
- [x] Teacher can mark lessons as Completed/No Show
- [x] Past lessons auto-transition to Needs Review
- [x] Meeting link field (Teams/Zoom/Meet) on slots
- [x] Payment tracking (Mark Paid/Unpaid per lesson)
- [x] Worksheet selection via dropdown (not autosave)

## Public Booking (/book/:token)
- [x] Student can book via public link
- [x] Student can book weekly recurring
- [x] Student can cancel bookings
- [x] Student can request reschedule
- [x] Student sees booking status (Pending/Confirmed)
- [x] Student sees Completed/No Show/Needs Review statuses with tooltips
- [x] Past slots hidden completely after start time passes
- [x] Pending slots same layout as Available (color-only difference)
- [x] Show past lessons toggle
- [x] Show cancelled lessons toggle with SC/TC badges
- [x] Status filters (Completed, No Show, Needs Review, Student/Teacher Cancellation)
- [x] Full history logs with semantic details
- [x] History button on both active and cancelled bookings
- [x] Join Meeting button on bookings
- [x] View modes: Schedule (default), Month, Date Range

## Notifications
- [x] In-app bell notifications for all actions
- [x] Email to student on: booking confirm, reject, cancel, time change, new lesson by teacher
- [x] Email to teacher on: new booking, cancel, reschedule request
- [x] Batch booking creates single notification
- [x] Notification resolved immediately after action (300ms delay)
- [x] Meeting link included in emails

## Settings (/calendar/settings)
- [x] All toggles working (in-app + email)
- [x] Sidebar navigation on desktop
- [x] Timezone support
- [x] Min cancellation hours
- [x] Buffer minutes
- [x] Public calendar token generation
- [x] Google Calendar connection UI (Connect/Disconnect)
- [x] Google Calendar sync settings (color, reminder)
- [x] Payment tracking settings (price, currency)
- [x] Vacation management

## Data Export
- [x] CSV export from calendar toolbar (date range based)

## Integrations
- [x] Google Calendar OAuth flow (gcal-auth-start, gcal-auth-callback)
- [x] Google Calendar sync (gcal-sync: create/update/delete events)
- [x] Meeting link support (manual paste for Teams/Zoom/Meet)

## Data Integrity
- [x] No overbooking (overlapping lessons blocked)
- [x] Cancelled recurring → recurrence_rule_id = null
- [x] Pending request withdrawal → no cancel badge
- [x] Audit logs for all actions with full details
- [x] Payment records with amount, currency, method
- [x] Worksheet linking is draft-only until Save Changes

## E2E Test Scenarios
1. [ ] Available Slot: select student + worksheet → close without Save → no DB change
2. [ ] Available Slot: select student + worksheet → Save Changes → both persisted
3. [ ] Recurring Booked: change time → "Save for Entire Series" visible, no overflow
4. [ ] /book: available slot disappears after start_time passes
5. [ ] /book: pending slot has same layout as available (color only)
6. [ ] /book: Show past OFF → no past lessons; ON → past visible
7. [ ] /book: Schedule/Month/Range views work
8. [ ] /book: History shows full semantic logs for active and cancelled
9. [ ] /book: Filters work (Completed, No Show, Student/Teacher Cancellation)
10. [ ] Booking/confirm/reject/cancel/reschedule → no regression

## Planned (Not Yet Implemented)
- [ ] Full payment reports page (/calendar/payments)
- [ ] Per-student price management UI
- [ ] Automatic Teams meeting creation via Graph API
- [ ] Full data export (all tables as ZIP)
