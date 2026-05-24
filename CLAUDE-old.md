@AGENTS.md

# Roommate Peace — Layer 0 Context

## Identity

**Roommate Peace** is a conflict-reduction app for roommates. Not a home organizer, not a task manager. Positioning: "Stop arguing about chores and bills." The wedge is visible accountability and explicit agreements.

## Real Stack (as of 2026-05-18)

| Layer            | Tool / Version                          |
|------------------|-----------------------------------------|
| Framework        | Next.js **16.2.4** (App Router)         |
| Runtime          | React **19.2.4**                        |
| Database + Auth  | Supabase (Postgres + RLS + Auth)        |
| Payments         | Stripe — **stub only, not implemented** |
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

# Stripe (keys exist but Stripe is not wired up yet)
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

# Resend
RESEND_API_KEY

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
3. Stripe is not implemented. `lib/stripe/client.ts` and `services/subscription.service.ts` are stubs. Do not wire up Stripe until explicitly asked.
4. `src/proxy.ts` exports `proxy()` (not `middleware()`). Do not rename it.
5. `user.service.ts` and `subscription.service.ts` are empty stubs. Do not treat them as implemented.
6. No comments unless the WHY is non-obvious. No emojis. No extra features beyond the task.
7. No Prisma — all DB access is through the Supabase JS client.

## Type Gap to Know

`src/types/index.ts` defines `Household` without an `invite_code` field, but the actual Supabase `households` table has one and the service code uses it. When reading or updating a household, `invite_code: string` is a real column.

## Full Context

Read `CLAUDE_CODE_BRIEFING.md` for product decisions, MVP scope, and feature history.
Read `CONTEXT.md` for the routing table.
Read `docs/SPEC.md` for what is and is not built.
