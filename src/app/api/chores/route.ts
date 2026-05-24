import { NextRequest, NextResponse } from 'next/server'
import { getChores, createChore } from '@/services/chore.service'
import { getUserHousehold } from '@/services/household.service'

export async function GET() {
  const household = await getUserHousehold()
  if (!household) return NextResponse.json({ error: 'No household' }, { status: 404 })

  const chores = await getChores(household.id)
  return NextResponse.json({ data: chores })
}

export async function POST(request: NextRequest) {
  const household = await getUserHousehold()
  if (!household) return NextResponse.json({ error: 'No household' }, { status: 404 })

  const body = await request.json().catch(() => null)
  const title = typeof body?.title === 'string' ? body.title.trim() : ''
  if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

  const result = await createChore(
    household.id,
    title,
    body.description ?? null,
    body.recurrenceType ?? 'weekly'
  )

  if (result.error) return NextResponse.json({ error: result.error }, { status: 403 })
  if (!result.data) return NextResponse.json({ error: 'Failed to create chore' }, { status: 500 })

  return NextResponse.json({ data: result.data }, { status: 201 })
}
