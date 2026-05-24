import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import {
  upgradeToPremium,
  downgradeToFree,
  getHouseholdBySubscription,
} from '@/services/subscription.service'
import type Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const householdId = session.metadata?.household_id
        if (!householdId || !session.customer || !session.subscription) break

        await upgradeToPremium(
          householdId,
          session.customer as string,
          session.subscription as string
        )
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const household = await getHouseholdBySubscription(sub.id)
        if (!household) break

        if (sub.status === 'active' && household.plan_tier !== 'premium') {
          await upgradeToPremium(household.id, sub.customer as string, sub.id)
        } else if (sub.status === 'canceled' || sub.status === 'unpaid') {
          await downgradeToFree(sub.id)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await downgradeToFree(sub.id)
        break
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
