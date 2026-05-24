# Roommate Peace — What Is and Is Not Built

Updated 2026-05-24.

## Built and Working

### Authentication
- Email/password signup with name field
- Supabase email confirmation (`/auth/callback` exchanges code for session)
- Login with email/password; logout via `supabase.auth.signOut()`
- Auth guard in `proxy.ts` covers `/dashboard/*` and `/setup`
- Auto-profile creation via Supabase trigger on `auth.users`

### Invite Flow
- `/invite/[code]` — shows household name, QR code, join button
- Unauthenticated: links to `/signup?invite={code}` / `/login?invite={code}`
- Signup: `emailRedirectTo` passes invite through confirmation email → `/auth/callback?invite=` → `/invite/{code}`
- Login: redirects to `/invite/{code}` after auth
- `joinHousehold` enforces free-plan 3-member limit at join time
- `regenerateInviteCode` invalidates old link by replacing UUID

### Household Creation
- `/setup` → `POST /api/households` → creates household + inserts owner member
- Seeds 12 default chores, 6 default bills ($0 placeholder), 8 default house rules

### Dashboard
- Household name, cards to Chores / Bills / Rules
- `InviteSection` — copyable invite link, QR code, regenerate button
- `PlanSection` — shows current plan (Free/Premium), upgrade buttons (owner only), "Manage billing" link for premium owners

### Stripe Paywall
- `POST /api/checkout` — creates Stripe Checkout Session (hosted page), validates price against allowlist, owner-only
- `POST /api/customer-portal` — creates Stripe Customer Portal session for subscription management
- `POST /api/webhooks/stripe` — handles `checkout.session.completed` (upgrades household), `customer.subscription.updated`, `customer.subscription.deleted` (downgrades)
- `services/subscription.service.ts` — `upgradeToPremium`, `downgradeToFree`, `createCheckoutSession`, `createPortalSession`
- Free plan limits enforced: 3 members (at join), 10 chores (at create), 3 bills (at create)
- Limit error surfaces inline in ChoreBoard / BillBoard forms
- `?upgraded=true` banner on dashboard after successful checkout

### Chores
- List active chores with current assignment status
- Add chore: title, description (optional), recurrence, rotate toggle
- Pick up unassigned chore → assignment due in 7 days
- Mark your chore done
- Round-robin rotation: `assigned_mode: 'rotate'` — on completion, next member (by `joined_at`) gets auto-assignment at correct recurrence interval
- Overdue pending assignments marked `missed` by daily cron
- Free plan: max 10 active chores enforced at create

### Bills
- List all bills by due date with per-person share breakdown
- Add bill: title, amount, due date — equal split across current members
- Mark your share paid
- Bills with `$0` show "Needs amount" indicator
- Free plan: max 3 bills enforced at create

### House Rules
- List active and inactive rules
- Add rule: title + optional description
- Toggle active / deactivate / reactivate

### Email Reminders (Resend)
- `GET /api/cron/reminders` — bearer-token protected via `CRON_SECRET`
- Marks overdue pending chore assignments as `missed` first
- Sends one email per user for chores + bills due today or tomorrow
- Logs each sent item to `reminder_events` (user_id, type, reference_id, channel)

---

## Stubs / Incomplete

| Item | Status |
|------|--------|
| `RESEND_API_KEY` | Not filled in `.env.local` — reminder emails will fail silently |
| `CRON_SECRET` | Not set — cron endpoint returns 401 |
| `STRIPE_WEBHOOK_SECRET` | Not set yet — must register webhook in Stripe dashboard first |
| Stripe Customer Portal | Requires Stripe dashboard config (portal settings must be saved) |

---

## Not Yet Built

| Feature | Notes |
|---------|-------|
| Custom bill splits | `split_type: 'custom'` in schema; only equal implemented |
| Weekly snapshot email | Not started |
| Rule acknowledgements | Table exists; no service or UI |
| Push notifications | Type exists; only email implemented |
| Fairness score | Cut from MVP |
| In-app chat | Cut from MVP |
