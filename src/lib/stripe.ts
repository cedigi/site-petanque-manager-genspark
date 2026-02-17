// src/lib/stripe.ts — Stripe helpers for Cloudflare Workers (REST API, no Node SDK)

export interface StripeConfig {
  secretKey: string
}

async function stripeRequest(config: StripeConfig, endpoint: string, method: string = 'GET', body?: Record<string, any>) {
  const url = `https://api.stripe.com/v1${endpoint}`
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${config.secretKey}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  }

  let formBody: string | undefined
  if (body) {
    formBody = encodeFormData(body)
  }

  const res = await fetch(url, {
    method,
    headers,
    body: formBody,
  })

  const data = await res.json() as any
  if (!res.ok) {
    throw new Error(`Stripe API error: ${data.error?.message || res.statusText}`)
  }
  return data
}

/**
 * Encode nested objects to Stripe's form-encoded format
 * e.g. { metadata: { user_id: '123' } } -> metadata[user_id]=123
 */
function encodeFormData(obj: Record<string, any>, prefix?: string): string {
  const parts: string[] = []
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}[${key}]` : key
    const value = obj[key]
    if (value === null || value === undefined) continue
    if (typeof value === 'object' && !Array.isArray(value)) {
      parts.push(encodeFormData(value, fullKey))
    } else if (Array.isArray(value)) {
      value.forEach((v, i) => {
        if (typeof v === 'object') {
          parts.push(encodeFormData(v, `${fullKey}[${i}]`))
        } else {
          parts.push(`${encodeURIComponent(`${fullKey}[${i}]`)}=${encodeURIComponent(v)}`)
        }
      })
    } else {
      parts.push(`${encodeURIComponent(fullKey)}=${encodeURIComponent(value)}`)
    }
  }
  return parts.filter(Boolean).join('&')
}

/**
 * Create a Stripe Checkout Session
 */
export async function createCheckoutSession(
  config: StripeConfig,
  params: {
    priceId: string
    mode: 'subscription' | 'payment'
    successUrl: string
    cancelUrl: string
    customerEmail?: string
    clientReferenceId?: string
    metadata?: Record<string, string>
  }
) {
  const body: Record<string, any> = {
    'success_url': params.successUrl,
    'cancel_url': params.cancelUrl,
    'mode': params.mode,
    'line_items': [{ price: params.priceId, quantity: 1 }],
  }

  if (params.customerEmail) {
    body['customer_email'] = params.customerEmail
  }
  if (params.clientReferenceId) {
    body['client_reference_id'] = params.clientReferenceId
  }
  if (params.metadata) {
    body['metadata'] = params.metadata
  }
  // For subscriptions, pass metadata to subscription too
  if (params.mode === 'subscription' && params.metadata) {
    body['subscription_data'] = { metadata: params.metadata }
  }

  return stripeRequest(config, '/checkout/sessions', 'POST', body)
}

/**
 * Retrieve a Checkout Session with line items
 */
export async function retrieveCheckoutSession(config: StripeConfig, sessionId: string) {
  return stripeRequest(config, `/checkout/sessions/${sessionId}?expand[0]=line_items&expand[1]=subscription`)
}

/**
 * Retrieve a Subscription
 */
export async function retrieveSubscription(config: StripeConfig, subscriptionId: string) {
  return stripeRequest(config, `/subscriptions/${subscriptionId}`)
}

/**
 * Verify Stripe webhook signature (HMAC-SHA256)
 * Adapted for Web Crypto API (Cloudflare Workers compatible)
 */
export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  tolerance: number = 300 // 5 minutes
): Promise<boolean> {
  const parts = signature.split(',')
  const timestamp = parts.find(p => p.startsWith('t='))?.slice(2)
  const sig = parts.find(p => p.startsWith('v1='))?.slice(3)

  if (!timestamp || !sig) return false

  // Check tolerance
  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - parseInt(timestamp)) > tolerance) return false

  // Compute expected signature
  const signedPayload = `${timestamp}.${payload}`
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signatureBytes = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(signedPayload)
  )

  const expectedSig = Array.from(new Uint8Array(signatureBytes))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  // Constant-time comparison
  if (expectedSig.length !== sig.length) return false
  let result = 0
  for (let i = 0; i < expectedSig.length; i++) {
    result |= expectedSig.charCodeAt(i) ^ sig.charCodeAt(i)
  }
  return result === 0
}
