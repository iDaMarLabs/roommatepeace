import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserHousehold } from '@/services/household.service'
import { createPortalSession } from '@/services/subscription.service'

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const household = await getUserHousehold()
  if (!household) {
    return NextResponse.json({ error: 'No household found' }, { status: 404 })
  }

  const stripeCustomerId = (household as unknown as Record<string, string>).stripe_customer_id
  if (!stripeCustomerId) {
    return NextResponse.json({ error: 'No billing account found' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const url = await createPortalSession(stripeCustomerId, appUrl)

  return NextResponse.json({ url })
}
