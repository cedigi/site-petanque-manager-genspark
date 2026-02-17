// src/routes/webhook.ts — POST /api/stripe/webhook
import { Hono } from 'hono'
import { createSupabaseClient } from '../lib/supabase'
import { verifyWebhookSignature, retrieveCheckoutSession, retrieveSubscription } from '../lib/stripe'
import { generateLicenseKey, computeExpiresAt } from '../lib/license'

type Bindings = {
  STRIPE_SECRET_KEY: string
  STRIPE_WEBHOOK_SECRET: string
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
}

const webhook = new Hono<{ Bindings: Bindings }>()

webhook.post('/api/stripe/webhook', async (c) => {
  const payload = await c.req.text()
  const signature = c.req.header('stripe-signature') || ''

  // 1. Verify signature (skip if webhook secret not configured yet)
  if (c.env.STRIPE_WEBHOOK_SECRET && !c.env.STRIPE_WEBHOOK_SECRET.startsWith('whsec_REMPLACE')) {
    const valid = await verifyWebhookSignature(payload, signature, c.env.STRIPE_WEBHOOK_SECRET)
    if (!valid) {
      console.error('[WEBHOOK] Invalid signature')
      return c.json({ error: 'Invalid signature' }, 400)
    }
  } else {
    console.warn('[WEBHOOK] Signature verification skipped (webhook secret not configured)')
  }

  const event = JSON.parse(payload)
  console.log(`[WEBHOOK] Received event: ${event.type} (${event.id})`)

  const stripeConfig = { secretKey: c.env.STRIPE_SECRET_KEY }
  const supabase = createSupabaseClient({
    url: c.env.SUPABASE_URL,
    serviceRoleKey: c.env.SUPABASE_SERVICE_ROLE_KEY,
  })

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object, stripeConfig, supabase)
        break

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object, stripeConfig, supabase)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object, supabase)
        break

      default:
        console.log(`[WEBHOOK] Unhandled event type: ${event.type}`)
    }

    return c.json({ received: true })
  } catch (err: any) {
    console.error(`[WEBHOOK ERROR] ${event.type}:`, err.message)
    return c.json({ error: err.message }, 500)
  }
})

// ============================================================
// checkout.session.completed
// ============================================================
async function handleCheckoutCompleted(
  session: any,
  stripeConfig: { secretKey: string },
  supabase: ReturnType<typeof createSupabaseClient>
) {
  console.log(`[CHECKOUT.COMPLETED] Session ${session.id}, mode=${session.mode}`)

  const metadata = session.metadata || {}
  const planCode = metadata.plan_code
  const planId = metadata.plan_id
  const billingPeriod = metadata.billing_period || 'month'
  const includedSeats = parseInt(metadata.included_seats) || 1
  const email = session.customer_email || session.customer_details?.email

  if (!email) {
    console.error('[CHECKOUT.COMPLETED] No email found in session')
    return
  }

  // 1. Get or create Supabase auth user
  let userId = metadata.user_id || session.client_reference_id
  if (!userId) {
    const user = await supabase.getOrCreateUser(email)
    userId = user.id
    console.log(`[CHECKOUT.COMPLETED] User ${userId} (${email})`)
  }

  // 2. Create subscription record
  const now = new Date()
  const expiresAt = computeExpiresAt(billingPeriod, new Date(now))

  const subscriptionData: Record<string, any> = {
    user_id: userId,
    plan_id: planId,
    status: 'active',
    started_at: now.toISOString(),
    current_period_end: expiresAt,
    provider: 'stripe',
    provider_customer_id: session.customer || null,
  }

  // For subscriptions, add the Stripe subscription ID
  if (session.mode === 'subscription' && session.subscription) {
    const subId = typeof session.subscription === 'string' 
      ? session.subscription 
      : session.subscription.id
    subscriptionData.provider_subscription_id = subId
  }

  const [subscription] = await supabase.insert('pm_subscriptions', subscriptionData)
  console.log(`[CHECKOUT.COMPLETED] Created subscription ${subscription.id}`)

  // 3. Generate license key
  const licenseKey = generateLicenseKey()
  const licenseData = {
    subscription_id: subscription.id,
    user_id: userId,
    license_key: licenseKey,
    status: 'active',
    created_at: now.toISOString(),
    expires_at: expiresAt,
    max_devices: includedSeats,
    label: `License ${planCode}`,
  }

  const [license] = await supabase.insert('pm_license_keys', licenseData)
  console.log(`[CHECKOUT.COMPLETED] Generated license ${license.id}: ${licenseKey}`)
  console.log(`[CHECKOUT.COMPLETED] ✅ Complete — user=${userId}, plan=${planCode}, key=${licenseKey}, expires=${expiresAt}`)
}

// ============================================================
// invoice.paid (subscription renewal)
// ============================================================
async function handleInvoicePaid(
  invoice: any,
  stripeConfig: { secretKey: string },
  supabase: ReturnType<typeof createSupabaseClient>
) {
  // Skip the first invoice (handled by checkout.session.completed)
  if (invoice.billing_reason === 'subscription_create') {
    console.log('[INVOICE.PAID] First invoice — skipped (handled by checkout.session.completed)')
    return
  }

  const stripeSubId = invoice.subscription
  if (!stripeSubId) {
    console.log('[INVOICE.PAID] No subscription ID — skipped')
    return
  }

  console.log(`[INVOICE.PAID] Renewal for subscription ${stripeSubId}`)

  // 1. Get Stripe subscription to find current_period_end
  const stripeSub = await retrieveSubscription(stripeConfig, stripeSubId)
  const newPeriodEnd = new Date(stripeSub.current_period_end * 1000).toISOString()

  // 2. Update pm_subscriptions
  const subs = await supabase.update(
    'pm_subscriptions',
    `provider_subscription_id=eq.${stripeSubId}`,
    {
      status: 'active',
      current_period_end: newPeriodEnd,
    }
  )

  if (subs.length) {
    console.log(`[INVOICE.PAID] Updated subscription ${subs[0].id}, new period_end=${newPeriodEnd}`)

    // 3. Extend license expires_at
    const licenses = await supabase.update(
      'pm_license_keys',
      `subscription_id=eq.${subs[0].id}&status=eq.active`,
      { expires_at: newPeriodEnd }
    )

    if (licenses.length) {
      console.log(`[INVOICE.PAID] Extended license ${licenses[0].id} to ${newPeriodEnd}`)
    }
  } else {
    console.warn(`[INVOICE.PAID] No matching subscription for ${stripeSubId}`)
  }
}

// ============================================================
// customer.subscription.deleted (cancellation)
// ============================================================
async function handleSubscriptionDeleted(
  subscription: any,
  supabase: ReturnType<typeof createSupabaseClient>
) {
  const stripeSubId = subscription.id
  console.log(`[SUBSCRIPTION.DELETED] ${stripeSubId}`)

  // 1. Update subscription status
  const subs = await supabase.update(
    'pm_subscriptions',
    `provider_subscription_id=eq.${stripeSubId}`,
    { status: 'cancelled' }
  )

  if (subs.length) {
    console.log(`[SUBSCRIPTION.DELETED] Marked subscription ${subs[0].id} as cancelled`)

    // 2. Revoke license
    const licenses = await supabase.update(
      'pm_license_keys',
      `subscription_id=eq.${subs[0].id}&status=eq.active`,
      { status: 'revoked' }
    )

    if (licenses.length) {
      console.log(`[SUBSCRIPTION.DELETED] Revoked license ${licenses[0].id}`)
    }
  } else {
    console.warn(`[SUBSCRIPTION.DELETED] No matching subscription for ${stripeSubId}`)
  }
}

export default webhook
