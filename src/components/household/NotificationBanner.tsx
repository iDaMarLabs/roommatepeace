'use client'

import { useState } from 'react'
import { dismissNotificationAction } from '@/app/(dashboard)/dashboard/actions'
import type { HouseholdNotification } from '@/services/notifications.service'

export default function NotificationBanner({
  notifications,
}: {
  notifications: HouseholdNotification[]
}) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const visible = notifications.filter((n) => !dismissed.has(n.id))
  if (visible.length === 0) return null

  return (
    <div className="space-y-2 mb-6">
      {visible.map((n) => (
        <div
          key={n.id}
          className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200"
        >
          <p className="text-sm text-amber-800 flex-1">{n.message}</p>
          <button
            onClick={async () => {
              setDismissed((prev) => new Set(prev).add(n.id))
              await dismissNotificationAction(n.id)
            }}
            className="text-amber-500 hover:text-amber-700 text-xs shrink-0 font-medium"
          >
            Dismiss
          </button>
        </div>
      ))}
    </div>
  )
}
