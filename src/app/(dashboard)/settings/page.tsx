import { getUserHousehold, getHouseholdMembers, getPendingDepartureRequest } from '@/services/household.service'
import { getUnpaidBillsForMember } from '@/services/bill.service'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LeaveHouseholdSection from '@/components/household/LeaveHouseholdSection'
import RenameHouseholdSection from '@/components/household/RenameHouseholdSection'

export default async function SettingsPage() {
  const household = await getUserHousehold()
  if (!household) redirect('/setup')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [members, unpaidBills, existingRequest] = await Promise.all([
    getHouseholdMembers(household.id),
    getUnpaidBillsForMember(household.id, user.id),
    getPendingDepartureRequest(household.id),
  ])

  const isOwner = household.owner_user_id === user.id
  const myExistingRequest =
    existingRequest?.requesting_user_id === user.id ? existingRequest : null

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900">Settings</h1>
        <p className="text-stone-500 text-sm mt-1">{household.name}</p>
      </div>

      <div className="space-y-6">
        {isOwner && (
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-stone-900 mb-1">Household Name</h2>
            <p className="text-sm text-stone-600 mb-4">
              Change the name shown across your household.
            </p>
            <RenameHouseholdSection
              householdId={household.id}
              currentName={household.name}
            />
          </div>
        )}

        <div className="bg-white border border-stone-200 rounded-2xl p-6">
          <h2 className="text-base font-semibold text-stone-900 mb-1">Leave Household</h2>
          <p className="text-sm text-stone-500 mb-4">
            Removing yourself is permanent. Unpaid bills will be discussed with remaining members before your departure is finalized.
          </p>
          <LeaveHouseholdSection
            householdId={household.id}
            isOwner={isOwner}
            memberCount={members.length}
            unpaidBills={unpaidBills}
            existingRequest={myExistingRequest}
            currentUserId={user.id}
          />
        </div>
      </div>
    </div>
  )
}
