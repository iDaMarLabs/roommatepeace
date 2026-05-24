# Roommate Peace — Routing & File Context (Layer 1)

Generated from actual folder structure on 2026-05-18.

## Route Map

| URL                        | File                                                   | Type              | Auth required |
|----------------------------|--------------------------------------------------------|-------------------|---------------|
| `/`                        | `src/app/page.tsx`                                     | Server Component  | No (redirects to `/dashboard`) |
| `/login`                   | `src/app/(auth)/login/page.tsx`                        | Client Component  | No |
| `/signup`                  | `src/app/(auth)/signup/page.tsx`                       | Client Component  | No |
| `/signup/confirm`          | `src/app/(auth)/signup/confirm/page.tsx`               | Server Component  | No |
| `/auth/callback`           | `src/app/auth/callback/route.ts`                       | Route Handler GET | No |
| `/dashboard`               | `src/app/(dashboard)/dashboard/page.tsx`               | Server Component  | Yes |
| `/setup`                   | `src/app/(dashboard)/setup/page.tsx`                   | Client Component  | Yes |
| `/chores`                  | `src/app/(dashboard)/chores/page.tsx`                  | Server Component  | Yes |
| `/bills`                   | `src/app/(dashboard)/bills/page.tsx`                   | Server Component  | Yes |
| `/rules`                   | `src/app/(dashboard)/rules/page.tsx`                   | Server Component  | Yes |
| `/invite/[code]`           | `src/app/invite/[code]/page.tsx`                       | Server Component  | No (shows join UI) |
| `POST /api/households`     | `src/app/api/households/route.ts`                      | Route Handler     | Yes (via service) |
| `GET  /api/households`     | `src/app/api/households/route.ts`                      | Route Handler     | Yes |
| `POST /api/chores`         | `src/app/api/chores/route.ts`                          | Route Handler     | Yes |
| `GET  /api/chores`         | `src/app/api/chores/route.ts`                          | Route Handler     | Yes |
| `POST /api/bills`          | `src/app/api/bills/route.ts`                           | Route Handler     | Yes |
| `GET  /api/bills`          | `src/app/api/bills/route.ts`                           | Route Handler     | Yes |
| `GET  /api/cron/reminders` | `src/app/api/cron/reminders/route.ts`                  | Route Handler     | Bearer `CRON_SECRET` |
| `POST /api/webhooks/stripe`| `src/app/api/webhooks/stripe/route.ts`                 | Route Handler     | Stub only |

## Route Groups

| Group         | Layout file                              | Purpose                                      |
|---------------|------------------------------------------|----------------------------------------------|
| `(auth)`      | `src/app/(auth)/layout.tsx`             | Centered card on stone-50, no nav            |
| `(dashboard)` | `src/app/(dashboard)/layout.tsx`        | Full layout with NavBar, auth guard, max-w-4xl |

## Server Actions

| Action file                                     | Exports                                               |
|-------------------------------------------------|-------------------------------------------------------|
| `src/app/(dashboard)/chores/actions.ts`         | `addChoreAction`, `pickUpChoreAction`, `completeChoreAction` |
| `src/app/(dashboard)/bills/actions.ts`          | `addBillAction`, `markSharePaidAction`                |
| `src/app/(dashboard)/rules/actions.ts`          | `addRuleAction`, `toggleRuleAction`                   |
| `src/app/(dashboard)/dashboard/actions.ts`      | `regenerateInviteCodeAction`                          |
| `src/app/invite/[code]/actions.ts`              | `joinHouseholdAction`                                 |

## Source Tree

```
src/
  app/
    (auth)/
      layout.tsx                    ← centered auth shell
      login/page.tsx
      signup/
        page.tsx
        confirm/page.tsx
    (dashboard)/
      layout.tsx                    ← NavBar + auth guard
      dashboard/
        page.tsx
        actions.ts                  ← regenerateInviteCodeAction
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
    api/
      bills/route.ts
      chores/route.ts
      households/route.ts
      cron/reminders/route.ts       ← daily reminder cron, Bearer auth
      webhooks/stripe/route.ts      ← STUB
    auth/callback/route.ts          ← Supabase email confirm redirect
    invite/[code]/
      page.tsx
      actions.ts
      JoinButton.tsx                ← client component
    layout.tsx                      ← root layout, metadata
    page.tsx                        ← redirects to /dashboard
    globals.css
  components/
    bills/BillBoard.tsx             ← client component
    chores/ChoreBoard.tsx           ← client component
    household/InviteSection.tsx     ← client component
    rules/RulesBoard.tsx            ← client component
    ui/
      NavBar.tsx                    ← client component
      QRCodeDisplay.tsx             ← client component, uses react-qr-code
  lib/
    stripe/client.ts                ← STUB, do not use
    supabase/
      admin.ts                      ← createAdminClient (service role, server only)
      client.ts                     ← createBrowserClient singleton
      server.ts                     ← createServerClient (cookies)
    utils.ts                        ← cn() helper
  services/
    bill.service.ts
    chore.service.ts
    email.service.ts                ← Resend HTML email builder + sender
    household.service.ts
    reminder.service.ts             ← daily reminder aggregator
    rule.service.ts
    subscription.service.ts         ← STUB
    user.service.ts                 ← STUB
  types/index.ts                    ← shared TypeScript interfaces
  proxy.ts                          ← Next.js 16 auth session guard
```

## Auth Flow

```
/signup → Supabase signUp → email confirm → /auth/callback?code=X
/auth/callback → exchangeCodeForSession → redirect /dashboard
/login → signInWithPassword → redirect /dashboard
proxy.ts → guards /dashboard/* and /setup — redirects to /login if no user
```

## Invite Flow

```
Dashboard → InviteSection shows /invite/{uuid} link + QR code
/invite/[code] → getHouseholdByInviteCode (admin client, no RLS)
  → if user authed: JoinButton → joinHouseholdAction → joinHousehold service
  → if not authed: links to /signup?invite={code} or /login?invite={code}
  note: invite query param on signup/login is NOT currently consumed — manual join after auth
```

## Household Creation Flow

```
/setup → POST /api/households → createHousehold service
  → inserts household + owner member
  → seedDefaultChores (12 chores)
  → seedDefaultBills (6 bills, $0 amount)
  → seedDefaultRules (8 rules)
  → redirect /dashboard
```
