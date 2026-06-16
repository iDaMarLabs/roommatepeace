# Roommate Peace — Routing & File Context (Layer 1)

Generated from actual folder structure on 2026-06-14.

## Route Map

| URL                        | File                                                   | Type              | Auth required |
|----------------------------|--------------------------------------------------------|-------------------|---------------|
| `/`                        | `src/app/page.tsx`                                     | Server Component  | No (landing page; redirects to `/dashboard` if authed; forwards `?code=` to `/auth/callback`) |
| `/login`                   | `src/app/(auth)/login/page.tsx`                        | Client Component  | No |
| `/signup`                  | `src/app/(auth)/signup/page.tsx`                       | Client Component  | No |
| `/signup/confirm`          | `src/app/(auth)/signup/confirm/page.tsx`               | Server Component  | No |
| `/forgot-password`         | `src/app/(auth)/forgot-password/page.tsx`              | Client Component  | No |
| `/reset-password`          | `src/app/(auth)/reset-password/page.tsx`               | Client Component  | No |
| `/auth/callback`           | `src/app/auth/callback/route.ts`                       | Route Handler GET | No |
| `/dashboard`               | `src/app/(dashboard)/dashboard/page.tsx`               | Server Component  | Yes |
| `/setup`                   | `src/app/(dashboard)/setup/page.tsx`                   | Client Component  | Yes |
| `/chores`                  | `src/app/(dashboard)/chores/page.tsx`                  | Server Component  | Yes |
| `/bills`                   | `src/app/(dashboard)/bills/page.tsx`                   | Server Component  | Yes |
| `/rules`                   | `src/app/(dashboard)/rules/page.tsx`                   | Server Component  | Yes |
| `/settings`                | `src/app/(dashboard)/settings/page.tsx`                | Server Component  | Yes |
| `/invite/[code]`           | `src/app/invite/[code]/page.tsx`                       | Server Component  | No (shows join UI; authed users see acknowledgement screen) |
| `POST /api/households`     | `src/app/api/households/route.ts`                      | Route Handler     | Yes (via service) |
| `GET  /api/households`     | `src/app/api/households/route.ts`                      | Route Handler     | Yes |
| `POST /api/chores`         | `src/app/api/chores/route.ts`                          | Route Handler     | Yes |
| `GET  /api/chores`         | `src/app/api/chores/route.ts`                          | Route Handler     | Yes |
| `POST /api/bills`          | `src/app/api/bills/route.ts`                           | Route Handler     | Yes |
| `GET  /api/bills`          | `src/app/api/bills/route.ts`                           | Route Handler     | Yes |
| `POST /api/checkout`       | `src/app/api/checkout/route.ts`                        | Route Handler     | Yes (owner only) |
| `POST /api/customer-portal`| `src/app/api/customer-portal/route.ts`                 | Route Handler     | Yes (owner only) |
| `GET  /api/cron/reminders` | `src/app/api/cron/reminders/route.ts`                  | Route Handler     | Bearer `CRON_SECRET` |
| `POST /api/webhooks/stripe`| `src/app/api/webhooks/stripe/route.ts`                 | Route Handler     | Stripe signature |

## Route Groups

| Group         | Layout file                              | Purpose                                      |
|---------------|------------------------------------------|----------------------------------------------|
| `(auth)`      | `src/app/(auth)/layout.tsx`             | Centered card on stone-50, no nav; logo links to `/` |
| `(dashboard)` | `src/app/(dashboard)/layout.tsx`        | Full layout with NavBar, auth guard, max-w-4xl |

## Server Actions

| Action file                                     | Exports                                               |
|-------------------------------------------------|-------------------------------------------------------|
| `src/app/(dashboard)/chores/actions.ts`         | `addChoreAction`, `pickUpChoreAction`, `completeChoreAction` |
| `src/app/(dashboard)/bills/actions.ts`          | `addBillAction`, `editBillAction`, `deleteBillAction`, `markSharePaidAction` |
| `src/app/(dashboard)/rules/actions.ts`          | `addRuleAction`, `toggleRuleAction`, `deleteRuleAction` |
| `src/app/(dashboard)/dashboard/actions.ts`      | `regenerateInviteCodeAction`, `dismissNotificationAction`, `acknowledgeLeaveAction` |
| `src/app/(dashboard)/settings/actions.ts`       | `requestLeaveAction`, `cancelLeaveAction`, `renameHouseholdAction` |
| `src/app/invite/[code]/actions.ts`              | `joinHouseholdAction`                                 |

## Source Tree

```
src/
  app/
    (auth)/
      layout.tsx                    ← centered auth shell; logo links to /
      login/page.tsx
      signup/
        page.tsx
        confirm/page.tsx
      forgot-password/page.tsx      ← sends Supabase password reset email
      reset-password/page.tsx       ← exchanges code + sets new password
    (dashboard)/
      layout.tsx                    ← NavBar + auth guard
      dashboard/
        page.tsx                    ← stat cards (clickable), NotificationBanner, premium badge, invite section
        actions.ts                  ← regenerateInviteCodeAction, dismissNotificationAction, acknowledgeLeaveAction
      setup/page.tsx                ← household creation form
      chores/
        page.tsx
        actions.ts
      bills/
        page.tsx
        actions.ts
      rules/
        page.tsx
        actions.ts
      settings/
        page.tsx
        actions.ts                  ← requestLeaveAction, cancelLeaveAction, renameHouseholdAction
    api/
      bills/route.ts
      chores/route.ts
      households/route.ts
      checkout/route.ts             ← Stripe Checkout Session, owner-only
      customer-portal/route.ts      ← Stripe Customer Portal, owner-only
      cron/reminders/route.ts       ← daily reminder cron, Bearer auth
      webhooks/stripe/route.ts      ← handles checkout.session.completed, subscription.updated/deleted
    auth/callback/route.ts          ← Supabase email confirm + password reset redirect; reads ?next=
    invite/[code]/
      page.tsx                      ← unauthenticated: show join links; authenticated: show acknowledgement screen with bill warning
      actions.ts
      JoinButton.tsx                ← client component
    layout.tsx                      ← root layout, metadata
    page.tsx                        ← landing page; forwards ?code= to /auth/callback for password reset
    globals.css
  components/
    bills/BillBoard.tsx             ← client component
    chores/ChoreBoard.tsx           ← client component
    household/
      InviteSection.tsx             ← client component
      PlanSection.tsx               ← client component; shows plan tier, upgrade buttons (owner only)
      LeaveHouseholdSection.tsx     ← client component; leave/departure request flow + payment notes
      DepartureRequestBanner.tsx    ← client component; shows pending departure banner
      RenameHouseholdSection.tsx    ← client component; rename household inline
      NotificationBanner.tsx        ← client component; renders dismissible amber banners from household_notifications
    rules/RulesBoard.tsx            ← client component
    ui/
      NavBar.tsx                    ← client component; logout → /
      Button.tsx                    ← reusable button with variant + fullWidth props
      Input.tsx                     ← reusable labeled input
      QRCodeDisplay.tsx             ← client component, uses react-qr-code
  lib/
    stripe/client.ts                ← Stripe SDK client (STRIPE_SECRET_KEY)
    supabase/
      admin.ts                      ← createAdminClient (service role, server only)
      client.ts                     ← createBrowserClient singleton
      server.ts                     ← createServerClient (cookies)
    utils.ts                        ← cn() helper
  services/
    bill.service.ts                 ← getBills, createBill, updateBill, deleteBill, markSharePaid, getUnpaidBillCount, recalculateSharesForNewMember, seedDefaultBills
    chore.service.ts
    email.service.ts                ← Resend HTML email builder + sender
    household.service.ts            ← getUserHousehold, getHouseholdMembers, createHousehold, joinHousehold (calls recalculateSharesForNewMember), requestLeave, cancelLeave, acknowledgeLeave, renameHousehold, regenerateInviteCode
    notifications.service.ts        ← createNotification (admin), getNotificationsForUser, dismissNotification
    reminder.service.ts             ← daily reminder aggregator
    rule.service.ts
    subscription.service.ts         ← upgradeToPremium, downgradeToFree, createCheckoutSession, createPortalSession
    user.service.ts                 ← STUB
  types/index.ts                    ← shared TypeScript interfaces (Household now includes invite_code, stripe_customer_id, stripe_subscription_id; BillShare includes payment_note; Bill includes recurring)
  proxy.ts                          ← Next.js 16 auth session guard
```

## Auth Flow

```
/signup → Supabase signUp → email confirm → /auth/callback?code=X
/auth/callback → exchangeCodeForSession → redirect ?next= (default: /dashboard)
/login → signInWithPassword → redirect /dashboard
/forgot-password → resetPasswordForEmail → email link → /?code=X
/ (landing) → detects ?code= → redirect /auth/callback?code=X&next=/reset-password
/reset-password → updateUser({ password }) → redirect /dashboard
logout → signOut → redirect /
proxy.ts → guards /dashboard/* and /setup — redirects to /login if no user
```

## Invite Flow

```
Dashboard → InviteSection shows /invite/{uuid} link + QR code
/invite/[code] → getHouseholdByInviteCode (admin client, no RLS)
  → if not authed: shows household name, QR code, links to /signup?invite={code} or /login?invite={code}
  → if authed: shows acknowledgement screen with unpaid bill count warning + JoinButton
    → JoinButton calls joinHouseholdAction → joinHousehold service
      → inserts member row
      → calls recalculateSharesForNewMember (admin client)
        → splits unpaid bill shares equally across all members including new joiner
        → creates household_notifications for previously-paid members (credit notice) and household owner
      → redirect /dashboard
  note: invite query param on signup/login is NOT currently consumed — manual join after auth
```

## Household Creation Flow

```
/setup → POST /api/households → createHousehold service
  → inserts household + owner member
  → seedDefaultChores (5 chores)
  → seedDefaultBills (3 bills, $0 amount)
  → seedDefaultRules (5 rules)
  → redirect /dashboard
```
