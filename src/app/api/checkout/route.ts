import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserHousehold } from '@/services/household.service'
import { createCheckoutSession } from '@/services/subscription.service'

const PLAN_TO_PRICE: Record<string, string | undefined> = {
  monthly: process.env.STRIPE_PRICE_MONTHLY,
  yearly: process.env.STRIPE_PRICE_YEARLY,
}

const VALID_PRICES = new Set([
  process.env.STRIPE_PRICE_MONTHLY,
  process.env.STRIPE_PRICE_YEARLY,
])

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)

  let priceId = typeof body?.priceId === 'string' ? body.priceId : ''
  if (!priceId && typeof body?.plan === 'string') {
    priceId = PLAN_TO_PRICE[body.plan] ?? ''
  }

  if (!priceId || !VALID_PRICES.has(priceId)) {
    return NextResponse.json({ error: 'Invalid price' }, { status: 400 })
  }

  const household = await getUserHousehold()
  if (!household) {
    return NextResponse.json({ error: 'No household found' }, { status: 404 })
  }

  if (household.owner_user_id !== user.id) {
    return NextResponse.json(
      { error: 'Only the household owner can upgrade' },
      { status: 403 }
    )
  }

  if (household.plan_tier === 'premium') {
    return NextResponse.json({ error: 'Already on premium plan' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const url = await createCheckoutSession(household.id, user.email!, priceId, appUrl)

  return NextResponse.json({ url })
}
