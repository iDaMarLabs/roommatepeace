# Roommate Peace — Database Schema

Supabase project: `ylesefncnuyjggaxluxk` (US East)
No Prisma. All access via `@supabase/supabase-js` and `@supabase/ssr`.
All tables have RLS enabled.

Schema is inferred from `src/types/index.ts` and service code — not from a migration file.

---

## Tables

### `profiles`
Extends `auth.users`. Auto-created on signup via Supabase trigger `on_auth_user_created`.

| Column       | Type      | Notes                        |
|--------------|-----------|------------------------------|
| `id`         | uuid PK   | matches `auth.users.id`      |
| `email`      | text      |                              |
| `name`       | text      | nullable                     |
| `avatar_url` | text      | nullable                     |
| `created_at` | timestamptz |                            |

---

### `households`

| Column          | Type      | Notes                               |
|-----------------|-----------|-------------------------------------|
| `id`            | uuid PK   |                                     |
| `name`          | text      |                                     |
| `owner_user_id` | uuid      | FK → `profiles.id`                  |
| `plan_tier`     | text      | `'free'` \| `'premium'`             |
| `invite_code`            | uuid/text | unique; used for invite links              |
| `stripe_customer_id`     | text      | nullable; set on first successful payment  |
| `stripe_subscription_id` | text      | nullable; set on first successful payment  |
| `created_at`             | timestamptz |                                          |

## Required Migration

If the `households` table was created before Stripe was wired up, run this in **Supabase SQL Editor**:

```sql
ALTER TABLE households
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
```

---

### `household_members`
Junction table linking users to households.

| Column         | Type      | Notes                               |
|----------------|-----------|-------------------------------------|
| `id`           | uuid PK   |                                     |
| `household_id` | uuid      | FK → `households.id`                |
| `user_id`      | uuid      | FK → `profiles.id`                  |
| `role`         | text      | `'owner'` \| `'member'`             |
| `joined_at`    | timestamptz |                                   |

---

### `chores`

| Column               | Type      | Notes                                                 |
|----------------------|-----------|-------------------------------------------------------|
| `id`                 | uuid PK   |                                                       |
| `household_id`       | uuid      | FK → `households.id`                                  |
| `title`              | text      |                                                       |
| `description`        | text      | nullable                                              |
| `recurrence_type`    | text      | `'daily'` \| `'weekly'` \| `'biweekly'` \| `'monthly'` \| `'none'` |
| `recurrence_interval`| integer   | always `1` in current code                            |
| `assigned_mode`      | text      | `'fixed'` \| `'rotate'` (rotate not implemented)     |
| `active`             | boolean   |                                                       |
| `created_at`         | timestamptz |                                                     |

---

### `chore_assignments`

| Column             | Type      | Notes                                           |
|--------------------|-----------|-------------------------------------------------|
| `id`               | uuid PK   |                                                 |
| `chore_id`         | uuid      | FK → `chores.id`                                |
| `assigned_user_id` | uuid      | FK → `profiles.id`                              |
| `due_date`         | date      | stored as `YYYY-MM-DD` string                   |
| `status`           | text      | `'pending'` \| `'complete'` \| `'missed'`       |
| `completed_at`     | timestamptz | nullable                                      |

---

### `bills`

| Column               | Type      | Notes                                      |
|----------------------|-----------|--------------------------------------------|
| `id`                 | uuid PK   |                                            |
| `household_id`       | uuid      | FK → `households.id`                       |
| `title`              | text      |                                            |
| `amount_cents`       | integer   | total bill in cents                        |
| `due_date`           | date      | stored as `YYYY-MM-DD` string              |
| `split_type`         | text      | `'equal'` \| `'custom'` (custom not used) |
| `created_by_user_id` | uuid      | FK → `profiles.id`                         |
| `status`             | text      | `'unpaid'` \| `'paid'`                     |
| `created_at`         | timestamptz |                                          |

---

### `bill_shares`
Per-user portion of a bill.

| Column        | Type      | Notes                          |
|---------------|-----------|--------------------------------|
| `id`          | uuid PK   |                                |
| `bill_id`     | uuid      | FK → `bills.id`                |
| `user_id`     | uuid      | FK → `profiles.id`             |
| `amount_cents`| integer   | this user's share in cents     |
| `paid_status` | boolean   |                                |
| `paid_at`     | timestamptz | nullable                     |

---

### `house_rules`

| Column         | Type      | Notes       |
|----------------|-----------|-------------|
| `id`           | uuid PK   |             |
| `household_id` | uuid      | FK → `households.id` |
| `title`        | text      |             |
| `description`  | text      | nullable    |
| `active`       | boolean   |             |
| `created_at`   | timestamptz |           |

---

### `rule_acknowledgements`
Exists in DB per briefing. No service code or UI reads or writes to it.

| Column       | Type      | Notes                         |
|--------------|-----------|-------------------------------|
| `id`         | uuid PK   |                               |
| `rule_id`    | uuid      | FK → `house_rules.id`         |
| `user_id`    | uuid      | FK → `profiles.id`            |
| `acknowledged_at` | timestamptz |                          |

---

### `reminder_events`
Exists in DB per briefing. The cron job does not write to it.

| Column         | Type      | Notes                         |
|----------------|-----------|-------------------------------|
| `id`           | uuid PK   |                               |
| `user_id`      | uuid      | FK → `profiles.id`            |
| `type`         | text      | `'chore'` \| `'bill'`         |
| `reference_id` | uuid      | FK → chore or bill            |
| `sent_at`      | timestamptz |                             |
| `channel`      | text      | `'email'` \| `'push'`         |

---

## Supabase Client Usage

| Client | File | When to use |
|--------|------|-------------|
| Browser singleton | `lib/supabase/client.ts` → `createBrowserClient` | Client components only |
| Server client | `lib/supabase/server.ts` → `createServerClient` | Server components, route handlers, actions |
| Admin client | `lib/supabase/admin.ts` → `createClient` with service role key | Bypasses RLS — only reminder service and invite lookup |

---

## Known Schema / Type Mismatch

`src/types/index.ts` `Household` interface is missing `invite_code`. Services and components reference it directly. Callers must cast or extend the type when they need `invite_code`.
