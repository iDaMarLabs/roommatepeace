import { getHouseholdByInviteCode } from '@/services/household.service'
import { getBills } from '@/services/bill.service'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import QRCodeDisplay from '@/components/ui/QRCodeDisplay'
import JoinButton from './JoinButton'

export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const household = await getHouseholdByInviteCode(code)

  if (!household) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
        <div className="w-full max-w-md bg-white border border-stone-200 rounded-2xl p-8 text-center">
          <h1 className="text-xl font-semibold text-stone-900 mb-2">Invalid invite link</h1>
          <p className="text-stone-500 text-sm">This link may have expired or been regenerated.</p>
        </div>
      </div>
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const bills = await getBills(household.id)
    const unpaidBills = bills.filter((b) => !b.shares?.every((s) => s.paid_status))

    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-stone-900">Roommate Peace</h1>
            <p className="text-stone-500 text-sm mt-1">Shared home accountability</p>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl p-8">
            <h2 className="text-xl font-semibold text-stone-900 mb-1">
              Join {household.name}
            </h2>
            <p className="text-stone-500 text-sm mb-6">
              Review what you are joining before accepting.
            </p>

            {unpaidBills.length > 0 && (
              <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-sm font-medium text-amber-900 mb-1">
                  {unpaidBills.length} unpaid {unpaidBills.length === 1 ? 'bill' : 'bills'} already exist
                </p>
                <p className="text-xs text-amber-700">
                  Your share of these bills will be recalculated to include you. Members who already paid may be owed a credit adjustment.
                </p>
              </div>
            )}

            <JoinButton inviteCode={code} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-stone-900">Roommate Peace</h1>
          <p className="text-stone-500 text-sm mt-1">Shared home accountability</p>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-stone-900 mb-1">You've been invited</h2>
          <p className="text-stone-500 text-sm mb-6">
            Join <span className="font-medium text-stone-700">{household.name}</span> on Roommate Peace.
          </p>

          <div className="flex justify-center mb-6">
            <QRCodeDisplay path={`/invite/${code}`} size={160} />
          </div>

          <div className="space-y-3">
            <Link
              href={`/signup?invite=${code}`}
              className="block w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors text-sm text-center"
            >
              Create account to join
            </Link>
            <Link
              href={`/login?invite=${code}`}
              className="block w-full py-2.5 px-4 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 font-medium rounded-lg transition-colors text-sm text-center"
            >
              Log in to join
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
