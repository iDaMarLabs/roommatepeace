import { NextRequest, NextResponse } from 'next/server'
import { createHousehold, getUserHousehold } from '@/services/household.service'

export async function GET() {
  const household = await getUserHousehold()
  if (!household) return NextResponse.json({ data: null }, { status: 404 })
  return NextResponse.json({ data: household })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''

  if (!name) {
    return NextResponse.json(
      { error: 'Household name is required' },
      { status: 400 }
    )
  }

  const household = await createHousehold(name)
  if (!household) {
    return NextResponse.json(
      { error: 'Failed to create household. Check server logs for details.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: household }, { status: 201 })
}
