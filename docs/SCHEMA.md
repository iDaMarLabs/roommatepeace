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

| Column                   | Type        | Notes                                              |
|--------------------------|-------------|----------------------------------------------------|
| `id`                     | uuid PK     |                                                    |
| `name`                   | text        |                                                    |
| `owner_user_id`          | uuid        | FK → `profiles.id`                                 |
| `plan_tier`              | text        | `'free'` \| `'premium'`                            |
| `invite_code`            | uuid/text   | unique; used for invite links                      |
| `stripe_customer_id`     | text        | nullable; set on first successful payment          |
| `stripe_subscription_id` | text        | nullable; set on first successful payment          |
| `created_at`             | timestamptz |                                                    |

Migration if `stripe_*` columns not present:
```sql
ALTER TABLE households
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
```

---

### `household_members`
Junction table linking users to households.

| Column         | Type        | Notes                               |
|----------------|-------------|-------------------------------------|
| `id`           | uuid PK     |                                     |
| `household_id` | uuid        | FK → `households.id`                |
| `user_id`      | uuid        | FK → `profiles.id`                  |
| `role`         | text        | `'owner'` \| `'member'`             |
| `joined_at`    | timestamptz |                                     |

---

### `household_notifications`
In-app notification records. Created by system operations (e.g., bill recalculation on member join). RLS enabled — users can only read their own notifications.

| Column               | Type        | Notes                                              |
|----------------------|-------------|----------------------------------------------------|
| `id`                 | uuid PK     |                                                    |
| `household_id`       | uuid        | FK → `households.id`                               |
| `recipient_user_id`  | uuid        | FK → `profiles.id`                                 |
| `message`            | text        |                                                    |
| `dismissed`          | boolean     | default `false`                                    |
| `created_at`         | timestamptz |                                                    |

Migration to create table:
```sql
CREATE TABLE IF NOT EXISTS household_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  recipient_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  dismissed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE household_notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
CREATE POLICY "Users can read own notifications"
  ON household_notifications FOR SELECT
  USING (auth.uid() = recipient_user_id);

-- Users can update (dismiss) their own notifications
CREATE POLICY "Users can dismiss own notifications"
  ON household_notifications FOR UPDATE
  USING (auth.uid() = recipient_user_id);

-- Only service role can insert (createNotification uses admin client)
```

---

### `chores`

| Column                | Type        | Notes                                                       |
|-----------------------|-------------|-------------------------------------------------------------|
| `id`                  | uuid PK     |                                                             |
| `household_id`        | uuid        | FK → `households.id`                                        |
| `title`               | text        |                                                             |
| `description`         | text        | nullable                                                    |
| `recurrence_type`     | text        | `'daily'` \| `'weekly'` \| `'biweekly'` \| `'monthly'` \| `'none'` |
| `recurrence_interval` | integer     | always `1` in current code                                  |
| `assigned_mode`       | text        | `'fixed'` \| `'rotate'`                                    |
| `active`              | boolean     |                                                             |
| `created_at`          | timestamptz |                                                             |

---

### `chore_assignments`

| Column             | Type        | Notes                                           |
|--------------------|-------------|-------------------------------------------------|
| `id`               | uuid PK     |                                                 |
| `chore_id`         | uuid        | FK → `chores.id`                                |
| `assigned_user_id` | uuid        | FK → `profiles.id`                              |
| `due_date`         | date        | stored as `YYYY-MM-DD` string                   |
| `status`           | text        | `'pending'` \| `'complete'` \| `'missed'`       |
| `completed_at`     | timestamptz | nullable                                        |

---

### `bills`

| Column               | Type        | Notes                                      |
|----------------------|-------------|--------------------------------------------|
| `id`                 | uuid PK     |                                            |
| `household_id`       | uuid        | FK → `households.id`                       |
| `title`              | text        |                                            |
| `amount_cents`       | integer     | total bill in cents                        |
| `due_date`           | date        | stored as `YYYY-MM-DD` string              |
| `split_type`         | text        | `'equal'` \| `'custom'` (custom not used) |
| `created_by_user_id` | uuid        | FK → `profiles.id`                         |
| `status`             | text        | `'unpaid'` \| `'paid'`                     |
| `recurring`          | boolean     | default `false`; if true, next bill auto-created when all shares paid |
| `created_at`         | timestamptz |                                            |

Migration if `recurring` column not present:
```sql
ALTER TABLE bills ADD COLUMN IF NOT EXISTS recurring boolean NOT NULL DEFAULT false;
```

---

### `bill_shares`
Per-user portion of a bill.

| Column         | Type        | Notes                                       |
|----------------|-------------|---------------------------------------------|
| `id`           | uuid PK     |                                             |
| `bill_id`      | uuid        | FK → `bills.id`                             |
| `user_id`      | uuid        | FK → `profiles.id`                          |
| `amount_cents` | integer     | this user's share in cents                  |
| `paid_status`  | boolean     |                                             |
| `paid_at`      | timestamptz | nullable                                    |
| `payment_note` | text        | nullable; how the member paid (free text)   |

Migration if `payment_note` column not present:
```sql
ALTER TABLE bill_shares ADD COLUMN IF NOT EXISTS payment_note text;
```

---

### `house_rules`

| Column         | Type        | Notes                  |
|----------------|-------------|------------------------|
| `id`           | uuid PK     |                        |
| `household_id` | uuid        | FK → `households.id`   |
| `title`        | text        |                        |
| `description`  | text        | nullable               |
| `active`       | boolean     |                        |
| `created_at`   | timestamptz |                        |

---

### `rule_acknowledgements`
Implemented — UI shows per-member acknowledgement status on the rules page; current user sees "Acknowledge" button until confirmed.

| Column            | Type        | Notes                   |
|-------------------|-------------|-------------------------|
| `id`              | uuid PK     |                         |
| `rule_id`         | uuid        | FK → `house_rules.id`   |
| `user_id`         | uuid        | FK → `profiles.id`      |
| `acknowledged_at` | timestamptz |                         |

---

### `departure_requests`

| Column                | Type        | Notes                                         |
|-----------------------|-------------|-----------------------------------------------|
| `id`                  | uuid PK     |                                               |
| `household_id`        | uuid        | FK → `households.id`                          |
| `requesting_user_id`  | uuid        | FK → `profiles.id`                            |
| `status`              | text        | `'pending'` \| `'completed'` \| `'cancelled'` |
| `created_at`          | timestamptz |                                               |

---

### `departure_bill_payments`

| Column                  | Type    | Notes                                   |
|-------------------------|---------|-----------------------------------------|
| `id`                    | uuid PK |                                         |
| `departure_request_id`  | uuid    | FK → `departure_requests.id`            |
| `bill_id`               | uuid    | FK → `bills.id`                         |
| `amount_paid_cents`     | integer |                                         |
| `payment_note`          | text    | nullable; how the departing member paid |

Migration if column not present:
```sql
ALTER TABLE departure_bill_payments ADD COLUMN IF NOT EXISTS payment_note text;
```

---

### `departure_acknowledgements`

| Column                | Type        | Notes                          |
|-----------------------|-------------|--------------------------------|
| `id`                  | uuid PK     |                                |
| `departure_request_id`| uuid        | FK → `departure_requests.id`   |
| `member_user_id`      | uuid        | FK → `profiles.id`             |
| `created_at`          | timestamptz |                                |

---

### `reminder_events`
Cron writes here to track sent reminder events (one row per user per chore/bill reminder sent).
Note: table exists in schema but the cron does not currently write to it.

| Column         | Type        | Notes                         |
|----------------|-------------|-------------------------------|
| `id`           | uuid PK     |                               |
| `user_id`      | uuid        | FK → `profiles.id`            |
| `type`         | text        | `'chore'` \| `'bill'`         |
| `reference_id` | uuid        | FK → chore or bill            |
| `sent_at`      | timestamptz |                               |
| `channel`      | text        | `'email'` \| `'push'`         |

---

## Supabase Client Usage

| Client | File | When to use |
|--------|------|-------------|
| Browser singleton | `lib/supabase/client.ts` → `createBrowserClient` | Client components only |
| Server client | `lib/supabase/server.ts` → `createServerClient` | Server components, route handlers, actions — acting user's RLS applies |
| Admin client | `lib/supabase/admin.ts` → `createAdminClient` | Bypasses RLS — use for: reminder service, invite lookup, notification creation, bill share recalculation on member join, any operation where the acting user does not yet have household membership |

---

## Known Schema / Type Notes

`src/types/index.ts` `Household` interface now includes `invite_code`, `stripe_customer_id`, and `stripe_subscription_id` — type matches DB. No cast needed.

`BillShare` interface includes `payment_note: string | null`.

`Bill` interface includes `recurring: boolean`.
