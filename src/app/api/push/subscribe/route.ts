import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createNotification } from '@/services/notifications.service'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const subscription = await request.json()
  if (!subscription?.endpoint) {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
  }

  const { error } = await supabase.from('push_subscriptions').upsert(
    { user_id: user.id, endpoint: subscription.endpoint, subscription },
    { onConflict: 'user_id,endpoint' },
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { endpoint } = await request.json()

  await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('endpoint', endpoint)

  try {
    const admin = createAdminClient()

    const { data: membership } = await admin
      .from('household_members')
      .select('household_id')
      .eq('user_id', user.id)
      .single()

    if (membership) {
      const { data: household } = await admin
        .from('households')
        .select('id, owner_user_id')
        .eq('id', membership.household_id)
        .single()

      if (household && household.owner_user_id !== user.id) {
        const { data: profile } = await admin
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .single()

        const name = profile?.name ?? 'A member'
        await createNotification(
          household.id,
          household.owner_user_id,
          `${name} turned off push notifications.`,
        )
      }
    }
  } catch {
    // Non-critical — don't fail the response if notification can't be sent
  }

  return NextResponse.json({ ok: true })
}
