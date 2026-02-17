// src/routes/checkout.ts — POST /api/stripe/checkout
import { Hono } from 'hono'
import { createSupabaseClient } from '../lib/supabase'
import { createCheckoutSession } from '../lib/stripe'

type Bindings = {
  STRIPE_SECRET_KEY: string
  STRIPE_PUBLISHABLE_KEY: string
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
  SUPABASE_ANON_KEY: string
}

const checkout = new Hono<{ Bindings: Bindings }>()

checkout.post('/api/stripe/checkout', async (c) => {
  try {
    const body = await c.req.json() as {
      plan_code: string
      user_id?: string
      user_email?: string
    }

    const { plan_code, user_id, user_email } = body

    if (!plan_code) {
      return c.json({ error: 'plan_code is required' }, 400)
    }

    // 1. Fetch plan from Supabase pm_plans
    const supabase = createSupabaseClient({
      url: c.env.SUPABASE_URL,
      serviceRoleKey: c.env.SUPABASE_SERVICE_ROLE_KEY,
    })

    const plans = await supabase.select<{
      id: string
      code: string
      name: string
      billing_period: string
      price_cents: number
      currency: string
      included_seats: number
      stripe_price_id: string
      stripe_product_id: string
    }>('pm_plans', `code=eq.${encodeURIComponent(plan_code)}&is_active=eq.true`)

    if (!plans.length) {
      return c.json({ error: `Plan "${plan_code}" not found or inactive` }, 404)
    }

    const plan = plans[0]

    if (!plan.stripe_price_id) {
      return c.json({ error: `Plan "${plan_code}" has no Stripe price configured` }, 400)
    }

    // 2. Determine checkout mode
    const mode: 'subscription' | 'payment' =
      plan.billing_period === 'pass' ? 'payment' : 'subscription'

    // 3. Build URLs
    const origin = new URL(c.req.url).origin
    const successUrl = `${origin}/success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${origin}/cancel`

    // 4. Build metadata
    const metadata: Record<string, string> = {
      plan_code: plan.code,
      plan_id: plan.id,
      billing_period: plan.billing_period,
      included_seats: String(plan.included_seats),
    }
    if (user_id) metadata.user_id = user_id

    // 5. Create Stripe Checkout Session
    const session = await createCheckoutSession(
      { secretKey: c.env.STRIPE_SECRET_KEY },
      {
        priceId: plan.stripe_price_id,
        mode,
        successUrl,
        cancelUrl,
        customerEmail: user_email || undefined,
        clientReferenceId: user_id || undefined,
        metadata,
      }
    )

    console.log(`[CHECKOUT] Created session ${session.id} for plan ${plan_code} (${mode})`)

    return c.json({
      url: session.url,
      session_id: session.id,
    })
  } catch (err: any) {
    console.error('[CHECKOUT ERROR]', err.message)
    return c.json({ error: err.message || 'Internal server error' }, 500)
  }
})

export default checkout
