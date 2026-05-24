import { NextRequest, NextResponse } from 'next/server'
import { getBills, createBill } from '@/services/bill.service'
import { getUserHousehold } from '@/services/household.service'

export async function GET() {
  const household = await getUserHousehold()
  if (!household) return NextResponse.json({ error: 'No household' }, { status: 404 })

  const bills = await getBills(household.id)
  return NextResponse.json({ data: bills })
}

export async function POST(request: NextRequest) {
  const household = await getUserHousehold()
  if (!household) return NextResponse.json({ error: 'No household' }, { status: 404 })

  const body = await request.json().catch(() => null)
  const title = typeof body?.title === 'string' ? body.title.trim() : ''
  const amountCents = typeof body?.amount_cents === 'number' ? body.amount_cents : 0
  const dueDate = typeof body?.due_date === 'string' ? body.due_date : ''

  if (!title || !dueDate) {
    return NextResponse.json({ error: 'Title and due date are required' }, { status: 400 })
  }

  const result = await createBill(household.id, title, amountCents, dueDate)
  if (result.error) return NextResponse.json({ error: result.error }, { status: 403 })
  if (!result.data) return NextResponse.json({ error: 'Failed to create bill' }, { status: 500 })

  return NextResponse.json({ data: result.data }, { status: 201 })
}
