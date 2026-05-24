import { createClient } from '@/lib/supabase/server'
import { getUserHousehold } from '@/services/household.service'
import { getBills } from '@/services/bill.service'
import { redirect } from 'next/navigation'
import BillBoard from '@/components/bills/BillBoard'

export default async function BillsPage() {
  const household = await getUserHousehold()
  if (!household) redirect('/setup')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const bills = await getBills(household.id)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Bills</h1>
        <p className="text-stone-500 text-sm mt-1">{household.name}</p>
      </div>
      <BillBoard
        householdId={household.id}
        currentUserId={user.id}
        bills={bills}
      />
    </div>
  )
}
