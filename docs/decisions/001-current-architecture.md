# ADR 001 — Current Architecture Decisions

Captured from actual code on 2026-05-18. These are decisions already made and in force.

---

## 1. Next.js 16 with App Router

**Decision:** Use Next.js 16.2.4 (not 14 as originally planned).

**Consequences:**
- `middleware.ts` is renamed to `proxy.ts` — the exported function is `proxy()` not `middleware()`
- Route groups `(auth)` and `(dashboard)` with co-located layouts and `actions.ts` files
- Server Components fetch data directly; Client Components receive props
- Server Actions (`'use server'`) used for all mutations — no client-to-API-route calls for mutations in the dashboard (except household creation in `/setup`)

---

## 2. Three-Layer Architecture

**Decision:** Strict separation — `/lib` (infrastructure), `/services` (business logic), `/app/api` + `actions.ts` (controllers).

**Consequences:**
- Route handlers and Server Actions do not contain business logic
- All DB queries go through service functions
- Services import from `/lib/supabase/server` or `/lib/supabase/admin`, never directly from `@supabase/ssr`
- This makes service functions testable in isolation (in principle)

---

## 3. Supabase for Database + Auth

**Decision:** Supabase Postgres with RLS. Supabase Auth with email/password. No separate auth provider.

**Consequences:**
- Three client variants exist: browser singleton, server-with-cookies, admin (service role)
- Admin client bypasses RLS — only used in reminder service and invite code lookup
- `profiles` table is a shadow of `auth.users`, populated by a Supabase trigger
- Auth session is managed by `proxy.ts` refreshing the session on every request
- No JWT verification in route handlers — session comes from cookies managed by `@supabase/ssr`

---

## 4. Seeding on Household Creation

**Decision:** When a household is created, seed 5 default chores, 3 default bills, and 5 default house rules automatically.

**Why:** Reduces the blank-slate problem. Seed counts match free-plan limits exactly so new users start at capacity and immediately understand the upgrade value. Default bills have `amount_cents: 0` as placeholders.

**Consequences:**
- Every new household starts at the free-plan limit — no headroom to add without upgrading
- Bills with `$0` show a "Needs amount" indicator in the UI
- Seeding happens synchronously in `createHousehold` before returning — no queue or background job

---

## 5. Equal Split Only for Bills

**Decision:** Bills are always split equally across all current household members at the time of creation.

**Why:** Simplest implementation. `split_type: 'custom'` exists in the data model for future use.

**Consequences:**
- `createBill` calculates `Math.round(amountCents / members.length)` and inserts one `bill_shares` row per member
- Members who join after a bill is created are not added to existing bill shares
- Per-person amount is rounded (not perfectly exact for odd splits)

---

## 6. Chore Assignment via "Pick Up"

**Decision:** Roommates self-assign chores by pressing "Pick Up" rather than having chores assigned to them.

**Why:** Avoids the conflict of imposed assignments. Voluntary accountability.

**Consequences:**
- `chore_assignments` rows are created on demand, not scheduled
- Due date is hardcoded to 7 days from pick-up
- A chore can only have one pending assignment at a time (enforced by the UI, not a DB constraint)
- Rotation mode (`assigned_mode: 'rotate'`) is implemented — on completion, next member by `joined_at` gets auto-assigned

---

## 7. Invite System via UUID Link + QR Code

**Decision:** Households have an `invite_code` (UUID) stored on the `households` row. Sharing `/invite/{code}` is the only way to join a household.

**Why:** Simple, no email-based invite flow needed. Code can be regenerated to revoke access.

**Consequences:**
- `getHouseholdByInviteCode` uses the admin client to bypass RLS (invite lookup must work for unauthenticated users)
- Free plan enforces 3-member maximum at join time (not at creation time)
- `?invite=` query param is passed through signup/login links but is not yet consumed — user must visit the invite URL again after creating an account

---

## 8. Daily Reminder Cron via Resend

**Decision:** A cron endpoint at `/api/cron/reminders` sends daily emails via Resend for chore assignments and bill shares due today or tomorrow.

**Why:** Neutral, automatic accountability without in-app notifications.

**Consequences:**
- Endpoint is bearer-token protected via `CRON_SECRET`
- Uses admin client to read across all households
- One email per user per day if they have any due items
- `reminder_events` table exists in DB but the cron does not log to it
- Email is sent from `reminders@roommatepeace.app` (must be configured in Resend)

---

## 9. Stripe Is Fully Implemented

**Decision:** Stripe Checkout, Customer Portal, and webhook handler are all live and verified in test mode.

**Consequences:**
- Free-plan limits enforced at create: 2 members, 5 chores, 3 bills
- `subscription.service.ts` implements `upgradeToPremium`, `downgradeToFree`, `createCheckoutSession`, `createPortalSession`
- Webhook at `/api/webhooks/stripe` verifies Stripe signature and handles `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- Stripe Customer Portal configured in Stripe Dashboard
- Currently test mode — switching to live mode requires new live keys + new webhook endpoint registration

---

## 11. Freemium Limits Designed to Force Upgrades

**Decision:** Free plan limits are 2 members, 5 chores, 3 bills. Seed defaults match these limits exactly.

**Why:** Original limits (3 members, 10 chores, 3 bills) covered everything most households needed — no upgrade pressure. New limits ensure most real roommate groups (3–4 people) hit the member wall immediately. At $7.99/mo split 3–4 ways, it's under $2/person.

**Consequences:**
- New households are seeded at their limit — any growth requires upgrading
- The member limit is the primary upgrade driver; chore/bill limits are secondary

---

## 12. Password Reset Flow Routes Through Landing Page

**Decision:** Supabase sends password reset codes to the Site URL (`https://www.roommatepeace.com/`). The landing page detects a `?code=` param and forwards to `/auth/callback?code=X&next=/reset-password`.

**Why:** Supabase ignores `redirectTo` query params that don't exactly match the allowlist. Rather than fight the allowlist, the landing page acts as a pass-through for recovery codes.

**Consequences:**
- `/auth/callback` supports a `?next=` param to override the post-exchange redirect (default: `/dashboard`)
- `/reset-password` calls `supabase.auth.updateUser({ password })` — requires an active recovery session from the exchange

---

## 10. Cut Features (Do Not Revisit Without Strong Reason)

| Feature | Decision |
|---------|----------|
| Fairness score | Cut — adds tension, adds complexity |
| In-app chat | Cut — users revert to text anyway |
| Grocery lists | Out of scope — not a home organizer |
| Calendar | Out of scope |
| Marketplace | Out of scope |
