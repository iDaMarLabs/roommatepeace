# Roommate Peace — Session Notes: New Member Bill Recalculation
*Session date: June 14, 2026*

---

## Project State at Start of Session

**Live at:** roommatepeace.com (Vercel, GitHub)
**Status:** Smoke test complete — looks good

### All core MVP features code-complete:
- Auth, household management, invite flow
- Chore board (delete, rotation)
- Bills tracker (payment note field, equal/custom splits)
- House rules + acknowledgements
- Stripe paywall ($7/mo or $59/yr)
- Email reminder architecture (Resend)
- Dashboard with live 2×2 stat grid
- Departure request flow

### Design system locked:
- Stripe-structure + iOS-soft aesthetic
- Emerald-500 accent
- DM Serif Display for app name
- Mobile-first

---

## Problem Identified

**When a new member joins a household AFTER a bill was created, they are not added to that bill and the cost is not split amongst them.**

### Current workaround (insufficient):
Delete the bill and recreate it — splits recalculate. BUT this destroys payment records for members who already paid their portion.

---

## Decision Log

### Option A considered (rejected for now): Pro-rated amounts
**Why rejected:** Pro-rating requires knowing billing period start/end, bill type (rent vs utilities vs one-time), and a formula roommates agree on. Creates more conflict, not less — contradicts core positioning.

### Option B considered (rejected for now): New member only affects future bills
Show a banner: *"[Name] joined after these bills were created. They are not included."* Clean but doesn't solve the actual problem.

### Option chosen: Recalculate unpaid shares only + credit notification

**Logic:**
1. New member sees acknowledgement screen before joining
2. On join — recalculate only `paid_status = false` shares
3. Paid records left completely untouched
4. Calculate credit owed to any member who overpaid
5. Surface credit as a notification to owner + affected member only

---

## How the Recalculation Works

### Example:
- Bill: $120, 3 members, $40 each
- Member A already paid $40 ✓
- New member joins
- Unpaid pool: $80 remaining (Members B, C + new member)
- New split: $80 ÷ 3 = $26.67 each for B, C, and new member

### Credit calculation:
- What Member A *would have paid* with 4 members = $30
- What Member A *actually paid* = $40
- **Credit owed to Member A = $10**

The app knows both numbers at the moment of recalculation:
- Old share = already in `bill_shares.amount_cents`
- New share = what you're about to calculate
- Capture the difference before updating the record → store as notification

---

## Full Feature Scope (Approved)

1. **Invite acceptance screen** — member sees acknowledgement about existing bills before joining household
2. **On join** — recalculate unpaid shares only, add new member to all existing bills
3. **Credit alert → owner's dashboard** — *"[Name] joined after [Member A] paid $40. They may be owed a $10 credit adjustment."*
4. **Credit alert → overpaid member's dashboard** — *"You may be owed a $10 credit. Your household owner has been notified."*

**No credit tracking table. No automated math. Human-readable flag only.**
Owner handles adjustment manually. Notification can be dismissed.

---

## What's NOT Being Built (Deferred)

- Full debt reconciliation engine
- Credit balance tracking per member
- Automatic credit application to future bills
- Edge case: member leaves before credit is used

**Rationale:** Beta testers have not actually hit this problem yet. Build it when real users complain with real requirements.

---

## Open Questions (Needed Before Building)

Three things needed to write the Claude Code prompt:

1. **Does a notifications table exist in Supabase?** *(David to check and report back)*
2. **Where does invite acceptance live in the codebase?** (`/invite/[code]` or something else?)
3. **Does the invite flow show a preview screen before joining**, or does it join immediately on page load?

---

## Architecture Notes (Standing Rules)

```
/lib      = infrastructure (tools, clients, config)
/services = business logic (what the app does)
/app/api  = thin controllers only (receive, validate, delegate)
```

New recalculation logic belongs in:
- `services/bill.service.ts` — recalculation + credit calculation logic
- `app/api/households/join/route.ts` — thin controller, calls service
- Notification storage — TBD pending notifications table check

---

## Stack Reference

| Layer | Tool |
|---|---|
| Frontend + Backend | Next.js 14 App Router |
| Database + Auth | Supabase (Postgres + RLS) |
| Payments | Stripe |
| Deploy | Vercel |
| Email | Resend |
| Styling | Tailwind CSS |

---

*Next session: Confirm notifications table, confirm invite page location, then build full feature in one Claude Code prompt.*
