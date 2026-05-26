export type PlanTier = 'free' | 'premium'
export type ChoreStatus = 'pending' | 'complete' | 'missed'
export type AssignedMode = 'fixed' | 'rotate'
export type RecurrenceType = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'none'
export type SplitType = 'equal' | 'custom'
export type BillStatus = 'unpaid' | 'paid'
export type ReminderChannel = 'email' | 'push'
export type MemberRole = 'owner' | 'member'

export interface Profile {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  created_at: string
}

export interface Household {
  id: string
  name: string
  owner_user_id: string
  plan_tier: PlanTier
  invite_code: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  created_at: string
}

export interface HouseholdMember {
  id: string
  household_id: string
  user_id: string
  role: MemberRole
  joined_at: string
  profile?: Profile
}

export interface Chore {
  id: string
  household_id: string
  title: string
  description: string | null
  recurrence_type: RecurrenceType
  recurrence_interval: number
  assigned_mode: AssignedMode
  active: boolean
  created_at: string
}

export interface ChoreAssignment {
  id: string
  chore_id: string
  assigned_user_id: string
  due_date: string
  status: ChoreStatus
  completed_at: string | null
  chore?: Chore
  profile?: Profile
}

export interface Bill {
  id: string
  household_id: string
  title: string
  amount_cents: number
  due_date: string
  split_type: SplitType
  created_by_user_id: string
  status: BillStatus
  created_at: string
}

export interface BillShare {
  id: string
  bill_id: string
  user_id: string
  amount_cents: number
  paid_status: boolean
  paid_at: string | null
  profile?: Profile
}

export interface HouseRule {
  id: string
  household_id: string
  title: string
  description: string | null
  active: boolean
  created_at: string
}

export interface RuleAcknowledgement {
  id: string
  rule_id: string
  user_id: string
  acknowledged_at: string
  profile?: { id: string; name: string | null; email: string } | null
}
