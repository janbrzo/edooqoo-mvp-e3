
# Pre-Launch Checklist

## 🛡️ Security & Privacy
- [x] **Console Logs**: Production logs silenced via `devLog()` utility — only `console.error` and `console.warn` active in prod
- [ ] **RLS (Row Level Security)**: All tables have proper access control
- [ ] **Anonymous Users**: Cannot access other users' data
- [ ] **Environment Variables**: All production secrets are configured in Supabase
- [x] **Duplicate DOM IDs**: Fixed `id="worksheet-form"` duplication in FormView

## 💰 Payment System
- [ ] **Stripe Keys**: Production Stripe keys are configured in Supabase secrets
- [ ] **$1 Payment Flow**: Anonymous users can pay $1 for worksheet download
- [ ] **Payment Success**: After payment, download is automatically unlocked
- [ ] **Payment Failure**: User receives clear error message
- [ ] **Download Sessions**: Payment creates valid download session

## 👤 Anonymous Users
- [ ] **Worksheet Generation**: Can generate worksheets without account
- [ ] **Local Editing**: Can edit worksheets and save changes locally
- [ ] **Download Paywall**: $1 payment required for download
- [ ] **No Database Access**: Cannot save to database or access history

## 🔐 Logged-in Users
- [ ] **Account Creation**: New users can register successfully
- [ ] **Profile Creation**: Profile is auto-created with 2 demo tokens
- [ ] **Worksheet Generation**: Can generate using demo tokens
- [ ] **Database Saving**: Worksheets are saved to their account
- [ ] **Download Access**: Can download their own worksheets for free
- [ ] **Edit & Save**: Can edit and save changes to database

## 🎯 Token & Subscription System
- [ ] **Demo Tokens**: New users start with 2 demo tokens
- [ ] **Token Consumption**: Tokens are properly consumed during generation
- [ ] **Monthly Limits**: Subscription limits are enforced
- [ ] **Token Balance**: Displayed correctly in UI
- [ ] **Subscription Status**: Shows correct plan and status
- [ ] **Subscription Sync**: Auto-syncs on visibility/focus change

## 📊 Worksheet Functionality
- [ ] **Generation Quality**: AI generates proper educational content
- [ ] **Form Validation**: All required fields are validated
- [ ] **Responsive Design**: Works on mobile and desktop
- [ ] **Print Friendly**: Worksheets print correctly
- [ ] **PDF Export**: PDF generation works properly
- [ ] **Streaming Progress**: Real-time progress bar during generation

## 🎨 User Experience
- [ ] **Loading States**: Clear feedback during generation
- [ ] **Error Messages**: Helpful error messages for users
- [ ] **Success Messages**: Confirmation toasts for actions
- [ ] **Navigation**: All links and buttons work correctly
- [ ] **Mobile Responsive**: App works well on phones/tablets
- [ ] **Double-click Guard**: Duplicate generation requests blocked

## 📈 Analytics & Tracking
- [ ] **User Events**: Key actions are tracked properly
- [ ] **Generation Tracking**: Worksheet creation is logged
- [ ] **Payment Tracking**: Payment events are recorded
- [ ] **Error Tracking**: Failed operations are logged

## 🔍 SEO & Content (Phase 5)
- [ ] **Resources Page**: `/resources` loads with 7 sections, JSON-LD present
- [ ] **Blog Page**: `/blog` loads with 15 articles, JSON-LD present
- [ ] **Blog Articles**: All 15 `public/blog/*.html` files load correctly
- [ ] **Expanded Pages**: 8 pages with 1500+ words load correctly
- [ ] **Sitemap**: 70 entries with `lastmod` on all
- [ ] **Footer**: 4 columns, 30+ links, visible everywhere except `/`
- [ ] **Static Backups**: `resources.html` and `blog.html` load correctly
- [ ] **Meta Tags**: Title <60 chars, meta desc <160 chars on all pages
- [ ] **Canonical Tags**: Present on all pages

## 🔧 Technical Requirements
- [ ] **Build Process**: Application builds without errors
- [ ] **Performance**: Fast loading times
- [ ] **Database Connections**: All Supabase connections work
- [ ] **Edge Functions**: All Supabase functions deploy correctly

## 🚀 Final Steps
- [ ] **Domain Setup**: Custom domain configured (if applicable)
- [ ] **SSL Certificate**: HTTPS is working
- [ ] **Backup Strategy**: Database backup plan in place
- [ ] **Monitoring**: Error monitoring is set up

## ⚠️ Critical Tests Before Launch

### Test 1: Anonymous User Flow
1. Open app in incognito window
2. Generate a worksheet without logging in
3. Try to download → should see $1 payment popup
4. Complete payment → should unlock download
5. Edit worksheet → should save locally with success message

### Test 2: New User Registration
1. Register new account
2. Should receive 2 demo tokens
3. Generate worksheet → should consume 1 token
4. Should be able to download for free
5. Edit and save → should save to database

### Test 3: Payment Edge Cases
1. Test payment cancellation
2. Test payment failure
3. Test multiple payment attempts
4. Verify download session expiration

### Test 4: Data Isolation
1. Create worksheets with User A
2. Login as User B
3. Verify User B cannot see User A's worksheets
4. Test anonymous user cannot see any user data

### Test 5: SEO Verification
1. `/resources` → 7 sections with cards
2. `/blog` → 15 articles with links
3. Blog article HTML files load correctly
4. Footer visible on `/resources`, `/blog`, `/pricing` but NOT on `/`
5. Static landing pages (e.g., `/ai-worksheet-generator-for-english-teachers.html`) load

## 📞 Support Readiness
- [ ] **FAQ**: Common questions are documented
- [ ] **Error Handling**: Clear error messages guide users
- [ ] **Contact Information**: Support contact is available
- [ ] **Documentation**: User guides are up to date

---

**Status**: Ready for testing ✅
**Last Updated**: 2026-03-13
**Next**: Complete all checklist items before public launch
