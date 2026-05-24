import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe/client'

export async function upgradeToPremium(
  householdId: string,
  stripeCustomerId: string,
  stripeSubscriptionId: string
): Promise<void> {
  const supabase = createAdminClient()
  await supabase
    .from('households')
    .update({
      plan_tier: 'premium',
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
    })
    .eq('id', householdId)
}

export async function downgradeToFree(stripeSubscriptionId: string): Promise<void> {
  const supabase = createAdminClient()
  await supabase
    .from('households')
    .update({ plan_tier: 'free', stripe_subscription_id: null })
    .eq('stripe_subscription_id', stripeSubscriptionId)
}

export async function getHouseholdBySubscription(
  stripeSubscriptionId: string
): Promise<{ id: string; plan_tier: string } | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('households')
    .select('id, plan_tier')
    .eq('stripe_subscription_id', stripeSubscriptionId)
    .maybeSingle()
  return data
}

export async function createCheckoutSession(
  householdId: string,
  userEmail: string,
  priceId: string,
  appUrl: string
): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: userEmail,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard?upgraded=true`,
    cancel_url: `${appUrl}/dashboard`,
    metadata: { household_id: householdId },
  })
  return session.url!
}

export async function createPortalSession(
  stripeCustomerId: string,
  appUrl: string
): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${appUrl}/dashboard`,
  })
  return session.url
}
