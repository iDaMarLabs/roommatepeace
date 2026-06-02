import { createClient } from '@/lib/supabase/server'
import { getUserHousehold, getHouseholdMembers } from '@/services/household.service'
import { getRules, getAcknowledgements } from '@/services/rule.service'
import { redirect } from 'next/navigation'
import RulesBoard from '@/components/rules/RulesBoard'

export default async function RulesPage() {
  const household = await getUserHousehold()
  if (!household) redirect('/setup')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [rules, members] = await Promise.all([
    getRules(household.id),
    getHouseholdMembers(household.id),
  ])

  const acknowledgements = await getAcknowledgements(rules.map((r) => r.id))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">House Rules</h1>
        <p className="text-stone-500 text-sm mt-1">{household.name}</p>
      </div>
      <RulesBoard
        householdId={household.id}
        currentUserId={user.id}
        rules={rules}
        members={members}
        acknowledgements={acknowledgements}
      />
    </div>
  )
}
