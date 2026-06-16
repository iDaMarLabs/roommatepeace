# Roommate Peace — What Is and Is Not Built

Updated 2026-06-14.

## Built and Working

### Authentication
- Email/password signup with name field
- Supabase email confirmation (`/auth/callback` exchanges code for session)
- Login with email/password; logout via `supabase.auth.signOut()` → redirects to `/`
- Auth guard in `proxy.ts` covers `/dashboard/*` and `/setup`
- Auto-profile creation via Supabase trigger on `auth.users`
- Forgot password (`/forgot-password`) — sends Supabase reset email via Resend
- Reset password (`/reset-password`) — exchanges code, sets new password
- Landing page (`/`) detects `?code=` param from password reset email and forwards to `/auth/callback`

### Landing Page
- Public marketing page at `/` with hero, 3 feature cards, and CTAs
- Authenticated users redirected to `/dashboard`
- Logo on auth pages (login, signup, forgot/reset password) links to `/`

### Invite Flow
- `/invite/[code]` — two distinct screens based on auth state
  - Unauthenticated: shows household name, QR code, links to `/signup?invite={code}` / `/login?invite={code}`
  - Authenticated: shows acknowledgement screen with unpaid bill count warning before join
- `joinHousehold` enforces free-plan 2-member limit at join time
- After joining, `recalculateSharesForNewMember` splits all unpaid bills to include the new member
- If any member already paid before the new member joined, in-app notifications are created for them and the owner
- `regenerateInviteCode` invalidates old link by replacing UUID

### Household Creation
- `/setup` → `POST /api/households` → creates household + inserts owner member
- Seeds 5 default chores, 3 default bills ($0 placeholder), 5 default house rules
- Household name is editable from Settings via `RenameHouseholdSection`

### Navigation
- NavBar shows all household members with initials; current user highlighted in emerald
- Logo in NavBar links to `/`; logout redirects to `/`
- NavBar links: Dashboard, Chores, Bills, Rules, Settings

### Dashboard
- Household name with inline Premium badge (if applicable)
- 4 stat cards (you owe, unpaid bills, overdue chores, chores need pickup) — each clickable to the relevant section
- `NotificationBanner` — renders dismissible amber banners from `household_notifications`; dismiss is optimistic (client state) + persisted via `dismissNotificationAction`
- `InviteSection` — copyable invite link, QR code, regenerate button
- `PlanSection` — shows current plan (Free/Premium), upgrade buttons (owner only), "Manage billing" link for premium owners
- `?upgraded=true` banner after successful checkout

### In-App Notifications
- `household_notifications` table with RLS
- `notifications.service.ts` — `createNotification` (admin), `getNotificationsForUser`, `dismissNotification`
- `NotificationBanner` component — amber dismissible banners, client-optimistic dismiss
- Currently triggered by `recalculateSharesForNewMember` when a paid member is retroactively credited

### Stripe Paywall
- `POST /api/checkout` — creates Stripe Checkout Session (hosted page), validates price against allowlist, owner-only
- `POST /api/customer-portal` — creates Stripe Customer Portal session for subscription management
- `POST /api/webhooks/stripe` — handles `checkout.session.completed` (upgrades household), `customer.subscription.updated`, `customer.subscription.deleted` (downgrades)
- `services/subscription.service.ts` — `upgradeToPremium`, `downgradeToFree`, `createCheckoutSession`, `createPortalSession`
- Free plan limits enforced: 2 members (at join), 5 chores (at create), 3 bills (at create)
- Limit error surfaces inline in ChoreBoard / BillBoard forms
- All env vars wired in production (Vercel): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY`
- Currently in Stripe test mode; live mode pending

### Chores
- List active chores with current assignment status
- Add chore: title, description (optional), recurrence, rotate toggle
- Delete chore
- Pick up unassigned chore → assignment due in 7 days
- Mark your chore done
- Round-robin rotation: `assigned_mode: 'rotate'` — on completion, next member (by `joined_at`) gets auto-assignment
- Overdue pending assignments marked `missed` by daily cron
- Free plan: max 5 active chores enforced at create

### Bills
- List all bills by due date with per-person share breakdown
- Add bill: title, amount, due date — equal split across current members
- Edit existing bill: title, amount, due date — recalculates equal shares for all members
- Delete bill
- Mark your share paid (with optional payment note stored in `bill_shares.payment_note`)
- Bills with `$0` show "Needs amount" indicator
- Recurring bills: when all shares are paid on a recurring bill, a new bill is auto-created for the next month
- New member joining recalculates unpaid bill shares to include them
- Free plan: max 3 bills enforced at create

### House Rules
- List active and inactive rules
- Add rule: title + optional description
- Toggle active / deactivate / reactivate
- Delete rule
- Rule acknowledgements: each active rule shows per-member status; current user sees "Acknowledge" button until confirmed

### Settings
- Leave household / departure request flow
- Departure request: enter amounts paid toward each unpaid bill + how you paid (free-text note per bill)
- Cancel leave request
- Rename household
- Owner with sole membership deletes household instead of leaving

### Email Reminders (Resend)
- `GET /api/cron/reminders` — bearer-token protected via `CRON_SECRET`
- Marks overdue pending chore assignments as `missed` first
- Sends one email per user for chores + bills due today or tomorrow
- All env vars wired in production: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `CRON_SECRET`

---

## Stubs / Incomplete

| Item | Status |
|------|--------|
| `user.service.ts` | Empty stub — no user-level operations implemented |
| Stripe live mode | Currently test mode; switch requires new live-mode keys + webhook |
| `reminder_events` logging | Cron runs but does not log to `reminder_events` table |

---

## Not Yet Built

| Feature | Notes |
|---------|-------|
| Custom bill splits | `split_type: 'custom'` in schema; only equal implemented |
| Weekly snapshot email | Not started |
| Push notifications | Type exists in schema; only email implemented |
| Fairness score | Cut from MVP |
| In-app chat | Cut from MVP |
