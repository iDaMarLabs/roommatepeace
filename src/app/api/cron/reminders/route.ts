import { NextResponse } from 'next/server'
import { markMissedChores, sendDailyReminders, deleteOrphanedAccounts } from '@/services/reminder.service'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const missed = await markMissedChores()
  const result = await sendDailyReminders()
  const purged = await deleteOrphanedAccounts()
  return NextResponse.json({ ok: true, missed, purged, ...result })
}
