# Calendar Readiness Checklist

## Core Features
- [x] Teacher can create available slots (single, batch, recurring)
- [x] Teacher can assign students to slots
- [x] Teacher can link worksheets to lessons
- [x] Teacher can confirm/reject bookings
- [x] Teacher can cancel lessons (TC/SC distinction)
- [x] Teacher can mark lessons as Completed/No Show
- [x] Past lessons auto-transition to Needs Review
- [x] Meeting link field (Teams/Zoom/Meet) on slots
- [x] Payment tracking (Mark Paid/Unpaid per lesson)

## Public Booking (/book/:token)
- [x] Student can book via public link
- [x] Student can book weekly recurring
- [x] Student can cancel bookings
- [x] Student can request reschedule
- [x] Student sees booking status (Pending/Confirmed)
- [x] Student sees Completed/No Show/Needs Review statuses with tooltips
- [x] Past slots auto-hidden after start time
- [x] Show past lessons toggle
- [x] Show cancelled lessons toggle
- [x] Status filters (Completed, No Show, etc.)
- [x] Full history logs with details
- [x] Join Meeting button on bookings

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

## Planned (Not Yet Implemented)
- [ ] Full payment reports page (/calendar/payments)
- [ ] Per-student price management UI
- [ ] Automatic Teams meeting creation via Graph API
- [ ] Full data export (all tables as ZIP)
- [ ] Month/Schedule views on student booking page
