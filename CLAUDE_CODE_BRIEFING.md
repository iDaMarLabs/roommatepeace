# Roommate Peace — Claude Code Briefing Document

> Load this file at the start of every Claude Code session to restore full context.
> Also read: CLAUDE.md (hard rules, env vars, design system) and CONTEXT.md (routing table, source tree).

---

## What This App Is

**Roommate Peace** — a conflict-reduction app for roommates. NOT a general home organizer.

Positioning: "Stop arguing about chores and bills."
The wedge: reduce roommate drama fast through visible accountability, neutral reminders, and explicit agreements.

---

## Architecture Discipline Rules (Non-Negotiable)

```
/lib      = infrastructure (tools, clients, config)
/services = business logic (what the app does)
/app/api  = thin controllers only (receive, validate, delegate)
```

Server Actions live as `actions.ts` co-located with their route segment. They call services, then `revalidatePath`. Nothing else.

**The Stripe upgrade flow mental model:**

```
Stripe webhook → /app/api/webhooks/stripe/route.ts
                        ↓ (verify signature only)
               services/subscription.service.ts
                        ↓ (business logic)
               lib/supabase/server.ts
                        ↓ (DB update)
               UI reads updated state from Supabase
```

---

## Tech Stack

| Layer              | Tool / Version                    |
| ------------------ | --------------------------------- |
| Frontend + Backend | Next.js **16.2.4** App Router     |
| Database + Auth    | Supabase (Postgres + RLS + Auth)  |
| Payments           | Stripe (implemented)              |
| Deploy             | Vercel                            |
| Email              | Resend ^6.12.3                    |
| Styling            | Tailwind CSS v4 (postcss plugin)  |
| Icons              | lucide-react ^1.14.0              |
| QR codes           | react-qr-code ^2.0.21             |
| Utilities          | clsx, tailwind-merge              |

**Critical:** This is Next.js **16**, not 14. Read `node_modules/next/dist/docs/` before writing Next.js-specific code. `middleware.ts` is renamed to `proxy.ts` in this version.

---

## Folder Structure (Current)

```
src/
  app/
    (auth)/
      layout.tsx
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
        actions.ts                  ← addChoreAction, pickUpChoreAction, completeChoreAction
      bills/
        page.tsx
        actions.ts                  ← addBillAction, editBillAction, deleteBillAction, markSharePaidAction
      rules/
        page.tsx
        actions.ts                  ← addRuleAction, toggleRuleAction
      settings/
        page.tsx
        actions.ts                  ← requestLeaveAction, cancelLeaveAction
    api/
      bills/route.ts
      chores/route.ts
      households/route.ts
      checkout/route.ts             ← Stripe Checkout Session, owner-only
      customer-portal/route.ts      ← Stripe Customer Portal, owner-only
      cron/reminders/route.ts       ← daily reminder cron, Bearer auth
      webhooks/stripe/route.ts      ← handles checkout.session.completed, subscription events
    auth/callback/route.ts          ← Supabase email confirm redirect
    invite/[code]/
      page.tsx
      actions.ts                    ← joinHouseholdAction
      JoinButton.tsx
    layout.tsx
    page.tsx                        ← redirects to /dashboard
    globals.css
  components/
    bills/BillBoard.tsx
    chores/ChoreBoard.tsx
    household/
      InviteSection.tsx
      PlanSection.tsx               ← shows plan tier, upgrade buttons (owner only)
      LeaveHouseholdSection.tsx     ← leave/departure request flow
      DepartureRequestBanner.tsx    ← shows pending departure banner
    rules/RulesBoard.tsx
    ui/
      NavBar.tsx
      QRCodeDisplay.tsx
  lib/
    stripe/client.ts                ← Stripe SDK client
    supabase/
      admin.ts                      ← createAdminClient (service role — server only)
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
    subscription.service.ts         ← upgradeToPremium, downgradeToFree, createCheckoutSession, createPortalSession
    user.service.ts                 ← STUB
  types/index.ts
  proxy.ts                          ← Next.js 16 auth session guard (not middleware.ts)
```

---

## MVP Features — Shipped

- [x] Project scaffold (Next.js 16, Tailwind v4, Supabase, TypeScript)
- [x] Database schema + RLS (11 tables, all with RLS enabled)
- [x] Auth pages (signup with name, login, email confirm callback)
- [x] Proxy (auth guard) — `src/proxy.ts`
- [x] Household creation flow (`/setup` → seeds 12 chores, 6 bills, 8 rules)
- [x] Dashboard (household name, nav cards, invite section, plan section)
- [x] Chore board (list, add, pick up, mark done, rotate mode, overdue cron)
- [x] Bills tracker (list, add, edit, delete, mark share paid, equal split)
- [x] House rules (list, add, toggle active/inactive, per-member acknowledgements)
- [x] Invite flow (`/invite/[code]` — QR code, auto-join for authed users, 3-member limit)
- [x] Settings page (leave household / departure request flow)
- [x] Stripe paywall (Checkout, Customer Portal, webhook handler, free-plan limits)
- [x] Email reminders (Resend, cron endpoint, daily chore + bill digest)
- [ ] Weekly snapshot email
- [ ] Custom bill splits
- [ ] Push notifications

---

## Key Product Decisions (Do Not Revisit Without Good Reason)

1. **Fairness Score is CUT from MVP** — too much tension risk, adds complexity
2. **No in-app chat in MVP** — users revert to text anyway; solve conflict structurally
3. **No grocery lists, calendar, or marketplace** — not a home organizer
4. **Freemium model** — free (1 household, 3 members, 10 chores, 3 bills), premium $7/mo or $59/yr per household
5. **Positioning line:** "Stop arguing about chores and bills."

---

## What to Tell Claude Code at Session Start

> "I'm building Roommate Peace — a conflict-reduction app for roommates, not a general home organizer. Stack: Next.js 16.2.4 App Router, Supabase, Stripe, Tailwind v4. Architecture rule: /lib = infrastructure, /services = business logic, /app/api = thin controllers only. Read CLAUDE.md, CLAUDE_CODE_BRIEFING.md, and CONTEXT.md before writing any code."

---

_Last updated: 2026-06-01 — All core MVP features shipped_
