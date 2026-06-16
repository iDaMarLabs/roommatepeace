# CLAUDE.md — Working Context

## Personal Context
- **Age**: 65 years old
- **Primary Job**: Amazon Learning Trainer (40 hrs/wk)
  - Shift: 4am–12:30pm (standard) OR 1:10am–9:40am (when supporting onboarding)
  - Status: Would leave immediately if iDaMar Labs hits $6–8k/mo
- **Home availability**: 12:30pm–end of day for manual work + weekend focus

## Three Businesses

| Business | Revenue | Hours/wk | Status | Role |
|----------|---------|----------|--------|------|
| **Computer MD** | $100–300/mo | 8 hrs | Active but passive | Remote PC repair + onsite visits |
| **iDaMar Internet Services** | $100–300/mo | 6 hrs | Passive (2 active customers) | Website design, hosting, domains |
| **iDaMar Labs** (PRIMARY) | $0 (target: $10k/mo in 12mo) | 10→25+ hrs | Building MVP | React/Next.js apps |

## Primary Focus: Roommate Peace SaaS

**Current State**:
- **Live at www.roommatepeace.com** (deployed on Vercel, main branch)
- ~95% complete — all MVP features shipped and working in production
- All env vars wired: Supabase, Stripe (webhook verified), Resend, Cron
- MVP pricing: $7.99/mo or $59.99/year (test mode; live mode pending)
- Target: 1,400+ active users → $10k/mo
- Tech: Next.js 16.2.4, React 19.2.4, Supabase, Stripe (implemented), Resend, Vercel, Tailwind v4

**Secondary exploration**: askhowmany.com (learning app, not Google Ads compliant—deprioritize)

## Work Style & Preferences
- **Challenge me.** Don't give generic answers. Ask qualifying questions until 95% sure.
- **Ask about constraints** (schedule, budget, time). I'll adjust.
- **Update CLAUDE.md constantly** so future projects know how I work.
- **Be direct.** I'm 65 and don't have time for fluff.
- **Top 0.1% thinking**: Act as a senior React/Next.js full-stack dev + multi-millionaire mentor.

## Automation Target
**Goal**: Reduce Computer MD + iDaMar Internet Services from 14 hrs/wk → 5 hrs/wk by automating:
- Incoming calls/emails/texts → Google Calendar entries
- Calendar notes → PayPal invoices
- Minimal follow-up to past customers for repeat service

**Tools for automation**: Cowork (desktop automation) + Google Workspace APIs + PayPal API

---

@AGENTS.md

# Roommate Peace — Layer 0 Context

## Identity

**Roommate Peace** is a conflict-reduction app for roommates. Not a home organizer, not a task manager. Positioning: "Stop arguing about chores and bills." The wedge is visible accountability and explicit agreements.

## Real Stack (as of 2026-06-07)

| Layer            | Tool / Version                          |
|------------------|-----------------------------------------|
| Framework        | Next.js **16.2.4** (App Router)         |
| Runtime          | React **19.2.4**                        |
| Database + Auth  | Supabase (Postgres + RLS + Auth)        |
| Payments         | Stripe — **implemented** (checkout, portal, webhooks) |
| Email            | Resend **^6.12.3**                      |
| Deploy target    | Vercel                                  |
| Styling          | Tailwind CSS **v4** (postcss plugin)    |
| Icons            | lucide-react **^1.14.0**               |
| QR codes         | react-qr-code **^2.0.21**              |
| Utilities        | clsx, tailwind-merge                    |

> AGENTS.md instructs you to read `node_modules/next/dist/docs/` before writing Next.js code. This is Next.js **16**, not 14. APIs, file conventions, and routing behavior differ from your training data.

## Architecture Rules (Non-Negotiable)

```
/lib      = infrastructure (clients, config, low-level tools)
/services = business logic (what the app actually does)
/app/api  = thin controllers only — receive, validate, delegate to services
```

Server Actions live as `actions.ts` co-located with their route segment. They call services, then `revalidatePath`. They do nothing else.

## Critical File: proxy.ts

Next.js 16 renamed `middleware.ts` to `proxy.ts`. The auth session guard lives at `src/proxy.ts`, not `src/middleware.ts`. Do not create a `middleware.ts`.

## Environment Variables

All keys present in `.env.local`:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL        # browser-safe
NEXT_PUBLIC_SUPABASE_ANON_KEY   # browser-safe
SUPABASE_SERVICE_ROLE_KEY       # server only — never expose to client

# App
NEXT_PUBLIC_APP_URL             # browser-safe base URL

# Stripe
STRIPE_SECRET_KEY                   # server only — never expose
STRIPE_WEBHOOK_SECRET               # set after webhook is registered in Stripe dashboard
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY  # browser-safe
STRIPE_PRICE_MONTHLY                # test: price_1TYZ6YHimit9xPcfPZRRKkAP
STRIPE_PRICE_YEARLY                 # test: price_1TYZ8WHimit9xPcf0IVv1g8z

# Resend
RESEND_API_KEY
RESEND_FROM_EMAIL                # e.g. reminders@roommatepeace.com (verified domain)

# Cron auth
CRON_SECRET                     # bearer token for /api/cron/reminders
```

## Design System

- Primary: `emerald-500` (#10b981)
- Background: `stone-50`
- Text: `stone-900` / muted `stone-500`
- Borders: `stone-200`
- Error: `bg-red-50 border-red-200 text-red-700`
- Cards: `rounded-2xl shadow-sm border border-stone-200`
- Inputs: `rounded-lg border border-stone-200 focus:ring-2 focus:ring-emerald-500`
- Tone: adult, clean — not gamified, not childish

## Hard Rules

1. `/lib` is infrastructure. `/services` is business logic. `/app/api` and `actions.ts` are controllers only.
2. `SUPABASE_SERVICE_ROLE_KEY` is used only in `lib/supabase/admin.ts`. Never import `createAdminClient` from a client component or expose it to the browser.
3. Stripe Checkout is implemented. `lib/stripe/client.ts` uses `STRIPE_SECRET_KEY`. `services/subscription.service.ts` has `createCheckoutSession`, `createPortalSession`, `upgradeToPremium`, `downgradeToFree`. Webhook handler at `/api/webhooks/stripe` handles `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
4. `src/proxy.ts` exports `proxy()` (not `middleware()`). Do not rename it.
5. `user.service.ts` is an empty stub. `subscription.service.ts` is implemented — `upgradeToPremium`, `downgradeToFree`, `createCheckoutSession`, `createPortalSession` are all live.
6. No comments unless the WHY is non-obvious. No emojis. No extra features beyond the task.
7. No Prisma — all DB access is through the Supabase JS client.

## Type Gaps to Know

`src/types/index.ts` `Household` is **missing** `invite_code`, `stripe_customer_id`, and `stripe_subscription_id`. The DB has all three columns. Services and components that need `invite_code` must cast or extend the type.

`DepartureBillPayment` now has `payment_note?: string | null`. The DB column must exist — run: `ALTER TABLE departure_bill_payments ADD COLUMN IF NOT EXISTS payment_note text;`

## Full Context

Read `CLAUDE_CODE_BRIEFING.md` for product decisions, MVP scope, and feature history.
Read `CONTEXT.md` for the routing table.
Read `docs/SPEC.md` for what is and is not built.
