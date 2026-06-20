interface MemberSummary {
  userId: string
  name: string
  role: 'owner' | 'member'
  bills: { unpaidCount: number; unpaidCents: number }
  chores: { pending: number; overdue: number; missed: number }
  rules: { acknowledged: number; total: number }
}

interface Props {
  members: MemberSummary[]
  currentUserId: string
}

function formatCents(cents: number) {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function BillsBadge({ bills }: { bills: MemberSummary['bills'] }) {
  if (bills.unpaidCount === 0) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
        Paid up
      </span>
    )
  }
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">
      {bills.unpaidCount} unpaid · {formatCents(bills.unpaidCents)}
    </span>
  )
}

function ChoresBadge({ chores }: { chores: MemberSummary['chores'] }) {
  if (chores.overdue > 0 || chores.missed > 0) {
    const label = chores.overdue > 0 ? `${chores.overdue} overdue` : `${chores.missed} missed`
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700 font-medium">
        {label}
      </span>
    )
  }
  if (chores.pending > 0) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">
        {chores.pending} pending
      </span>
    )
  }
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
      All clear
    </span>
  )
}

function RulesBadge({ rules }: { rules: MemberSummary['rules'] }) {
  if (rules.total === 0) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-400 font-medium">
        —
      </span>
    )
  }
  if (rules.acknowledged === rules.total) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
        {rules.acknowledged}/{rules.total}
      </span>
    )
  }
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">
      {rules.acknowledged}/{rules.total}
    </span>
  )
}

export default function HouseholdSummaryCard({ members, currentUserId }: Props) {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl shadow-sm mb-6">
      <div className="px-5 pt-5 pb-3">
        <h2 className="font-semibold text-stone-900">Household Overview</h2>
        <p className="text-stone-500 text-sm mt-0.5">Member status at a glance</p>
      </div>

      {members.length <= 1 ? (
        <div className="px-5 pb-5 pt-1">
          <p className="text-stone-400 text-sm">No other members yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-stone-100">
                <th className="text-left px-5 py-2.5 text-xs font-medium text-stone-400 uppercase tracking-wide">
                  Member
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-stone-400 uppercase tracking-wide">
                  Bills
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-stone-400 uppercase tracking-wide">
                  Chores
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-stone-400 uppercase tracking-wide">
                  Rules
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {members.map((member) => {
                const isMe = member.userId === currentUserId
                return (
                  <tr key={member.userId}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-stone-900 font-medium">{member.name}</span>
                        {member.role === 'owner' && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                            Owner
                          </span>
                        )}
                        {isMe && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-500 font-medium">
                            You
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <BillsBadge bills={member.bills} />
                    </td>
                    <td className="px-4 py-3">
                      <ChoresBadge chores={member.chores} />
                    </td>
                    <td className="px-4 py-3">
                      <RulesBadge rules={member.rules} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
