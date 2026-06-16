# Roommate Peace

A conflict-reduction app for roommates. Stop arguing about chores and bills.

## Stack

- **Framework**: Next.js 16.2.4 (App Router)
- **Database + Auth**: Supabase (Postgres + RLS)
- **Payments**: Stripe (Checkout, Customer Portal, webhooks)
- **Email**: Resend
- **Styling**: Tailwind CSS v4
- **Deploy**: Vercel

## Dev Setup

1. Copy `.env.local` with all keys (Supabase, Stripe, Resend, CRON_SECRET)
2. Run `npm install`
3. Run `npm run dev` → open http://localhost:3000

Required env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY`, `RESEND_API_KEY`, `CRON_SECRET`

## Architecture

```
/lib      = infrastructure (Supabase clients, Stripe client, utils)
/services = business logic (what the app does)
/app/api  = thin controllers only (receive, validate, delegate)
```

Server Actions co-located with route segments (`actions.ts`). They call services, then `revalidatePath`. Nothing else.

Auth guard lives at `src/proxy.ts` (Next.js 16 — not `middleware.ts`).

See `CLAUDE.md` for hard rules, `CONTEXT.md` for the full routing table, and `docs/SPEC.md` for what is and is not built.

---

## Social Media Hashtags

Use these hashtags when sharing the project or announcing updates.

TikTok supports hashtags separated by spaces or newlines, but an inline caption is safest for consistency.

- #RoommatePeace
- #RoommateApp
- #HouseholdHarmony
- #SharedLiving
- #ChoreTracker
- #BillSplitter
- #NextJS
- #React
- #Supabase
- #TailwindCSS
- #Stripe
- #Productivity
- #Roommates
- #HousemateLife
- #WebApp

Inline version:

#RoommatePeace #RoommateApp #HouseholdHarmony #SharedLiving #ChoreTracker #BillSplitter #NextJS #React #Supabase #TailwindCSS #Stripe #Productivity #Roommates #HousemateLife #WebApp
