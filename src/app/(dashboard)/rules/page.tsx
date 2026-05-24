import { getUserHousehold } from '@/services/household.service'
import { getRules } from '@/services/rule.service'
import { redirect } from 'next/navigation'
import RulesBoard from '@/components/rules/RulesBoard'

export default async function RulesPage() {
  const household = await getUserHousehold()
  if (!household) redirect('/setup')

  const rules = await getRules(household.id)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">House Rules</h1>
        <p className="text-stone-500 text-sm mt-1">{household.name}</p>
      </div>
      <RulesBoard householdId={household.id} rules={rules} />
    </div>
  )
}
