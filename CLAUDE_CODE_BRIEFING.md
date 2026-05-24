# Roommate Peace — Claude Code Briefing Document

> Load this file at the start of every Claude Code session to restore full context.

---

## Roommate Pease App

I'm building Roommate Peace — a conflict-reduction app for roommates, not a general home organizer. The stack is Next.js 14 App Router, Supabase, Stripe, Tailwind. Architecture rule: /lib = infrastructure, /services = business logic, /app/api = thin controllers only. Read CLAUDE_CODE_BRIEFING.md for full context before writing any code.

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

API routes coordinate. Services decide. Lib connects.

---

## Tech Stack

| Layer              | Tool                      |
| ------------------ | ------------------------- |
| Frontend + Backend | Next.js 14 App Router     |
| Database + Auth    | Supabase (Postgres + RLS) |
| Payments           | Stripe                    |
| Deploy             | Vercel                    |
| Email              | Resend                    |
| Styling            | Tailwind CSS              |
| Icons              | lucide-react              |
| Utilities          | clsx, tailwind-merge      |

---

## Folder Structure (Canonical)

```
src/
  app/
    (auth)/
      layout.tsx
      login/
        page.tsx
      signup/
        page.tsx
        confirm/
          page.tsx
    (dashboard)/
      layout.tsx
      dashboard/
        page.tsx
      chores/
        page.tsx
      bills/
        page.tsx
      rules/
        page.tsx
    api/
      webhooks/
        stripe/
          route.ts
      households/
        route.ts
      chores/
        route.ts
      bills/
        route.ts
    auth/
      callback/
        route.ts
    layout.tsx
    globals.css
  lib/
    supabase/
      client.ts        ← browser singleton
      server.ts        ← server client with cookies
    stripe/
      client.ts
    utils.ts
  services/
    user.service.ts
    household.service.ts
    chore.service.ts
    bill.service.ts
    subscription.service.ts
  types/
    index.ts
  components/
    ui/
    household/
    chores/
    bills/
  middleware.ts
```

---

## Environment Variables (.env.local)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ylesefncnuyjggaxluxk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Resend
RESEND_API_KEY=
```

**Key rules:**

- `NEXT_PUBLIC_` prefix = safe for browser
- `SUPABASE_SERVICE_ROLE_KEY` = server only, never expose
- Never put secrets in Google Docs or version control

---

## Installed Packages

```bash
@supabase/supabase-js
@supabase/ssr
lucide-react
clsx
tailwind-merge
```

---

## Files Already Created

### `src/lib/supabase/client.ts`

```typescript
import { createBrowserClient } from "@supabase/ssr";

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
```

### `src/lib/supabase/server.ts`

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server component — middleware handles session
          }
        },
      },
    },
  );
}
```

### `src/middleware.ts`

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

### `src/lib/utils.ts`

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### `src/types/index.ts`

```typescript
export type PlanTier = "free" | "premium";
export type ChoreStatus = "pending" | "complete" | "missed";
export type AssignedMode = "fixed" | "rotate";
export type RecurrenceType =
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "none";
export type SplitType = "equal" | "custom";
export type BillStatus = "unpaid" | "paid";
export type ReminderChannel = "email" | "push";
export type MemberRole = "owner" | "member";

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Household {
  id: string;
  name: string;
  owner_user_id: string;
  plan_tier: PlanTier;
  created_at: string;
}

export interface HouseholdMember {
  id: string;
  household_id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
  profile?: Profile;
}

export interface Chore {
  id: string;
  household_id: string;
  title: string;
  description: string | null;
  recurrence_type: RecurrenceType;
  recurrence_interval: number;
  assigned_mode: AssignedMode;
  active: boolean;
  created_at: string;
}

export interface ChoreAssignment {
  id: string;
  chore_id: string;
  assigned_user_id: string;
  due_date: string;
  status: ChoreStatus;
  completed_at: string | null;
  chore?: Chore;
  profile?: Profile;
}

export interface Bill {
  id: string;
  household_id: string;
  title: string;
  amount_cents: number;
  due_date: string;
  split_type: SplitType;
  created_by_user_id: string;
  status: BillStatus;
  created_at: string;
}

export interface BillShare {
  id: string;
  bill_id: string;
  user_id: string;
  amount_cents: number;
  paid_status: boolean;
  paid_at: string | null;
  profile?: Profile;
}

export interface HouseRule {
  id: string;
  household_id: string;
  title: string;
  description: string | null;
  active: boolean;
  created_at: string;
}
```

### `src/services/household.service.ts`

```typescript
import { createClient } from "@/lib/supabase/server";
import type { Household, HouseholdMember } from "@/types";

export async function getUserHousehold(): Promise<Household | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("household_members")
    .select("household_id, households(*)")
    .eq("user_id", user.id)
    .single();

  return (data?.households as Household) ?? null;
}

export async function getHouseholdMembers(
  householdId: string,
): Promise<HouseholdMember[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("household_members")
    .select("*, profile:profiles(*)")
    .eq("household_id", householdId);

  return (data as HouseholdMember[]) ?? [];
}

export async function createHousehold(name: string): Promise<Household | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: household, error } = await supabase
    .from("households")
    .insert({ name, owner_user_id: user.id })
    .select()
    .single();

  if (error || !household) return null;

  await supabase.from("household_members").insert({
    household_id: household.id,
    user_id: user.id,
    role: "owner",
  });

  return household as Household;
}
```

### `src/app/(auth)/layout.tsx`

```typescript
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-stone-900">Roommate Peace</h1>
          <p className="text-stone-500 text-sm mt-1">Shared home accountability</p>
        </div>
        {children}
      </div>
    </div>
  )
}
```

### `src/app/(auth)/signup/page.tsx`

```typescript
'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignup() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/signup/confirm')
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8">
      <h2 className="text-xl font-semibold text-stone-900 mb-1">Create your account</h2>
      <p className="text-stone-500 text-sm mb-6">Set up your household in under 3 minutes</p>
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Your name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex"
            className="w-full px-3 py-2 rounded-lg border border-stone-200 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="alex@email.com"
            className="w-full px-3 py-2 rounded-lg border border-stone-200 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8+ characters"
            className="w-full px-3 py-2 rounded-lg border border-stone-200 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm" />
        </div>
        <button onClick={handleSignup} disabled={loading || !email || !password || !name}
          className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-stone-200 disabled:text-stone-400 text-white font-medium rounded-lg transition-colors text-sm">
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </div>
      <p className="text-center text-stone-500 text-sm mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-emerald-600 hover:underline font-medium">Log in</Link>
      </p>
    </div>
  )
}
```

### `src/app/(auth)/login/page.tsx`

```typescript
'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('Invalid email or password'); setLoading(false); return }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8">
      <h2 className="text-xl font-semibold text-stone-900 mb-1">Welcome back</h2>
      <p className="text-stone-500 text-sm mb-6">Log in to your household</p>
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="alex@email.com"
            className="w-full px-3 py-2 rounded-lg border border-stone-200 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password"
            className="w-full px-3 py-2 rounded-lg border border-stone-200 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm" />
        </div>
        <button onClick={handleLogin} disabled={loading || !email || !password}
          className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-stone-200 disabled:text-stone-400 text-white font-medium rounded-lg transition-colors text-sm">
          {loading ? 'Logging in...' : 'Log in'}
        </button>
      </div>
      <p className="text-center text-stone-500 text-sm mt-6">
        No account yet?{' '}
        <Link href="/signup" className="text-emerald-600 hover:underline font-medium">Sign up free</Link>
      </p>
    </div>
  )
}
```

### `src/app/auth/callback/route.ts`

```typescript
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(`${origin}/dashboard`);
}
```

---

## Database — Supabase Project

- **Project name:** Roommate Peace
- **URL:** `https://ylesefncnuyjggaxluxk.supabase.co`
- **Region:** US East
- **Status:** Healthy

### Tables Created (all with RLS enabled)

1. `profiles` — extends auth.users, auto-created on signup via trigger
2. `households` — name, owner, plan_tier (free/premium)
3. `household_members` — junction table, role (owner/member)
4. `chores` — recurrence, assigned_mode (fixed/rotate)
5. `chore_assignments` — due_date, status (pending/complete/missed)
6. `bills` — amount_cents, split_type (equal/custom)
7. `bill_shares` — per-user bill splits
8. `house_rules` — shared agreements
9. `rule_acknowledgements` — who agreed to what
10. `reminder_events` — log of sent reminders
11. Auto-trigger: `on_auth_user_created` → inserts into `profiles`

---

## Design System

- **Primary color:** Emerald (`emerald-500` = `#10b981`)
- **Background:** Stone-50
- **Text:** Stone-900
- **Border:** Stone-200
- **Muted text:** Stone-500
- **Error:** Red-50 background, red-700 text
- **Border radius:** `rounded-lg` (inputs), `rounded-2xl` (cards)
- **Font:** System sans-serif stack
- **Tone:** Adult, clean — NOT gamified, NOT childish

---

## MVP Features to Build (in order)

- [x] Project scaffold
- [x] Supabase schema + RLS (fixed infinite recursion in household_members policies)
- [x] Supabase client files
- [x] Proxy (auth protection) — renamed from middleware to proxy per Next.js 16
- [x] Types
- [x] Auth pages (signup, login, callback)
- [x] Household service
- [x] Root page (landing/redirect)
- [x] Household creation flow (/setup page)
- [x] Dashboard layout + shell (NavBar with nav links + logout)
- [x] Chore board (list, add, pick up, mark done — shows assignee name)
- [x] Bills tracker (list, add, mark share paid — equal split, shows per-person status)
- [x] House rules page (list, add, activate/deactivate)
- [ ] Weekly snapshot
- [ ] Stripe paywall
- [ ] Invite roommates flow
- [ ] Neutral reminder engine (Resend)

---

## Key Product Decisions (Do Not Revisit Without Good Reason)

1. **Fairness Score is CUT from MVP** — too much tension risk, adds complexity
2. **No in-app chat in MVP** — users revert to text anyway; solve conflict structurally
3. **No grocery lists, calendar, or marketplace** — not a home organizer
4. **Freemium model** — free (1 household, 3 roommates, 10 chores, 3 bills), premium $7.99/mo or $59/yr per household
5. **Positioning line:** "Stop arguing about chores and bills."

---

## What to Tell Claude Code at Session Start

Paste this exactly:

> "I'm building Roommate Peace — a conflict-reduction app for roommates, not a general home organizer. The stack is Next.js 14 App Router, Supabase, Stripe, Tailwind. Architecture rule: /lib = infrastructure, /services = business logic, /app/api = thin controllers only. Read CLAUDE_CODE_BRIEFING.md for full context before writing any code."

Then attach this file.

---

_Last updated: Session 3 — Chores, Bills, Rules all functional with defaults_
