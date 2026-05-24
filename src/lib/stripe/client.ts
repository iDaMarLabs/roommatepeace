import Stripe from 'stripe'

let _instance: Stripe | null = null

function getInstance(): Stripe {
  if (!_instance) {
    _instance = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-04-22.dahlia',
    })
  }
  return _instance
}

export const stripe = new Proxy({} as Stripe, {
  get(_, prop: string | symbol) {
    return (getInstance() as unknown as Record<string | symbol, unknown>)[prop]
  },
})
