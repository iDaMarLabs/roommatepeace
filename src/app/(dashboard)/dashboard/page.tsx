import { getUserHousehold, getHouseholdMembers, getPendingDepartureRequest } from '@/services/household.service'
import { getBills } from '@/services/bill.service'
import { getChores } from '@/services/chore.service'
import { getRules, getAcknowledgements } from '@/services/rule.service'
import { getNotificationsForUser } from '@/services/notifications.service'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import InviteSection from '@/components/household/InviteSection'
import PlanSection from '@/components/household/PlanSection'
import HouseholdSummaryCard from '@/components/household/HouseholdSummaryCard'
import DepartureRequestBanner from '@/components/household/DepartureRequestBanner'
import NotificationBanner from '@/components/household/NotificationBanner'

function formatCents(cents: number) {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string }>
}) {
  const household = await getUserHousehold()
  if (!household) redirect('/setup')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [members, pendingDeparture, bills, chores, notifications, rules] = await Promise.all([
    getHouseholdMembers(household.id),
    getPendingDepartureRequest(household.id),
    getBills(household.id),
    getChores(household.id),
    getNotificationsForUser(household.id),
    getRules(household.id),
  ])

  const activeRules = rules.filter((r) => r.active)
  const acknowledgements = await getAcknowledgements(activeRules.map((r) => r.id))
  const { upgraded } = await searchParams

  const today = new Date().toISOString().split('T')[0]

  const unpaidBills = bills.filter((b) => !b.shares?.every((s) => s.paid_status))
  const unpaidCount = unpaidBills.length
  const unpaidTotal = unpaidBills.reduce((sum, b) => {
    const myShare = b.shares?.find((s) => s.user_id === user.id && !s.paid_status)
    return sum + (myShare?.amount_cents ?? 0)
  }, 0)

  const overdueChores = chores.filter(
    (c) => c.current_assignment !== null && c.current_assignment.due_date < today
  ).length

  const unassignedChores = chores.filter((c) => c.current_assignment === null).length

  const isOwner = household.owner_user_id === user.id

  const memberSummaries = members.map((member) => {
    const memberShares = bills.flatMap((b) => b.shares ?? []).filter((s) => s.user_id === member.user_id)
    const unpaidShares = memberShares.filter((s) => !s.paid_status)

    const memberAssignments = chores
      .filter((c) => c.current_assignment !== null && c.current_assignment.assigned_user_id === member.user_id)
      .map((c) => c.current_assignment!)

    const overdueAssignments = memberAssignments.filter((a) => a.status === 'pending' && a.due_date < today)
    const missedAssignments = memberAssignments.filter((a) => a.status === 'missed')
    const pendingAssignments = memberAssignments.filter((a) => a.status === 'pending')

    const memberAckRuleIds = new Set(
      acknowledgements.filter((a) => a.user_id === member.user_id).map((a) => a.rule_id)
    )

    const rawName = member.profile?.name ?? member.profile?.email?.split('@')[0] ?? 'Roommate'
    const parts = rawName.trim().split(/\s+/)
    const displayName =
      parts.length === 1 ? rawName : `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`

    return {
      userId: member.user_id,
      name: displayName,
      role: member.role,
      bills: { unpaidCount: unpaidShares.length, unpaidCents: unpaidShares.reduce((s, x) => s + x.amount_cents, 0) },
      chores: { pending: pendingAssignments.length, overdue: overdueAssignments.length, missed: missedAssignments.length },
      rules: { acknowledged: memberAckRuleIds.size, total: activeRules.length },
    }
  })

  const monthlyPriceId = process.env.STRIPE_PRICE_MONTHLY ?? ''
  const yearlyPriceId = process.env.STRIPE_PRICE_YEARLY ?? ''

  const stats = [
    {
      value: formatCents(unpaidTotal),
      label: 'you owe',
      alert: unpaidTotal > 0,
      href: '/bills',
    },
    {
      value: String(unpaidCount),
      label: unpaidCount === 1 ? 'unpaid bill' : 'unpaid bills',
      alert: unpaidCount > 0,
      href: '/bills',
    },
    {
      value: String(overdueChores),
      label: overdueChores === 1 ? 'overdue chore' : 'overdue chores',
      alert: overdueChores > 0,
      href: '/chores',
    },
    {
      value: String(unassignedChores),
      label: unassignedChores === 1 ? 'chore needs pickup' : 'chores need pickup',
      alert: unassignedChores > 0,
      href: '/chores',
    },
  ]

  return (
    <div>
      {pendingDeparture && pendingDeparture.requesting_user_id !== user.id && (
        <DepartureRequestBanner
          departureRequest={pendingDeparture}
          currentUserId={user.id}
          memberCount={members.length}
          isOwner={isOwner}
        />
      )}

      <NotificationBanner notifications={notifications} />

      {upgraded === 'true' && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
          Welcome to Premium. Your household now has unlimited roommates, chores, and bills.
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-stone-900">{household.name}</h1>
          {household.plan_tier === 'premium' && (
            <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
              Premium
            </span>
          )}
        </div>
        <p className="text-stone-600 text-sm mt-1">Your household dashboard</p>
      </div>

      {isOwner && (
        <HouseholdSummaryCard members={memberSummaries} currentUserId={user.id} />
      )}

      <div className="grid grid-cols-2 gap-3 mb-8">
        {stats.map(({ value, label, alert, href }) => (
          <Link key={label} href={href} className="bg-stone-50 border border-stone-200 rounded-2xl p-4 hover:bg-stone-100 transition-colors">
            <div
              className={`w-2 h-2 rounded-full mb-3 ${
                alert ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
            />
            <p className="text-2xl font-bold text-stone-900 leading-none">{value}</p>
            <p className="text-xs text-stone-500 mt-1.5">{label}</p>
          </Link>
        ))}
      </div>

      <div className="space-y-4">
        <InviteSection
          householdId={household.id}
          inviteCode={household.invite_code}
          memberCount={members.length}
          planTier={household.plan_tier}
        />

        <PlanSection
          planTier={household.plan_tier}
          isOwner={isOwner}
          hasStripeCustomer={!!household.stripe_customer_id}
          monthlyPriceId={monthlyPriceId}
          yearlyPriceId={yearlyPriceId}
          upgradePending={upgraded === 'true' && household.plan_tier !== 'premium'}
        />
      </div>
    </div>
  )
}
