import { getUserHousehold, getHouseholdMembers, getPendingDepartureRequest } from '@/services/household.service'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckSquare, Receipt, BookOpen } from 'lucide-react'
import InviteSection from '@/components/household/InviteSection'
import PlanSection from '@/components/household/PlanSection'
import DepartureRequestBanner from '@/components/household/DepartureRequestBanner'

const cards = [
  {
    href: '/chores',
    label: 'Chores',
    icon: CheckSquare,
    description: 'Track who does what and when',
  },
  {
    href: '/bills',
    label: 'Bills',
    icon: Receipt,
    description: 'Split costs and track payments',
  },
  {
    href: '/rules',
    label: 'House Rules',
    icon: BookOpen,
    description: 'Set clear shared expectations',
  },
]

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

  const [members, pendingDeparture] = await Promise.all([
    getHouseholdMembers(household.id),
    getPendingDepartureRequest(household.id),
  ])
  const { upgraded } = await searchParams

  const monthlyPriceId = process.env.STRIPE_PRICE_MONTHLY ?? ''
  const yearlyPriceId = process.env.STRIPE_PRICE_YEARLY ?? ''

  return (
    <div>
      {pendingDeparture && pendingDeparture.requesting_user_id !== user.id && (
        <DepartureRequestBanner
          departureRequest={pendingDeparture}
          currentUserId={user.id}
          memberCount={members.length}
        />
      )}

      {upgraded === 'true' && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
          Welcome to Premium. Your household now has unlimited roommates, chores, and bills.
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900">{household.name}</h1>
        <p className="text-stone-500 text-sm mt-1">Your household dashboard</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {cards.map(({ href, label, icon: Icon, description }) => (
          <Link
            key={href}
            href={href}
            className="bg-white border border-stone-200 rounded-2xl p-6 hover:border-emerald-300 hover:shadow-sm transition-all group"
          >
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-emerald-100 transition-colors">
              <Icon size={20} className="text-emerald-600" />
            </div>
            <h2 className="font-semibold text-stone-900 mb-1">{label}</h2>
            <p className="text-stone-500 text-sm">{description}</p>
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
          isOwner={household.owner_user_id === user.id}
          hasStripeCustomer={!!household.stripe_customer_id}
          monthlyPriceId={monthlyPriceId}
          yearlyPriceId={yearlyPriceId}
          upgradePending={upgraded === 'true' && household.plan_tier !== 'premium'}
        />
      </div>
    </div>
  )
}
