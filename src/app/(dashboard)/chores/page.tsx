import { createClient } from '@/lib/supabase/server'
import { getUserHousehold } from '@/services/household.service'
import { getChores } from '@/services/chore.service'
import { redirect } from 'next/navigation'
import ChoreBoard from '@/components/chores/ChoreBoard'

export default async function ChoresPage() {
  const household = await getUserHousehold()
  if (!household) redirect('/setup')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const chores = await getChores(household.id)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Chores</h1>
        <p className="text-stone-500 text-sm mt-1">{household.name}</p>
      </div>
      <ChoreBoard
        householdId={household.id}
        currentUserId={user.id}
        chores={chores}
      />
    </div>
  )
}
