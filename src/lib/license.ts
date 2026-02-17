// src/lib/license.ts — License key generation PM-XXXX-XXXX-XXXX-XXXX-XXXX

/**
 * Generate a license key in format PM-XXXX-XXXX-XXXX-XXXX-XXXX
 * Uses Web Crypto API (available in Cloudflare Workers)
 */
export function generateLicenseKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // No I/O/0/1 to avoid confusion
  const segments = 5
  const segmentLength = 4
  const parts: string[] = ['PM']

  const randomBytes = new Uint8Array(segments * segmentLength)
  crypto.getRandomValues(randomBytes)

  let byteIdx = 0
  for (let s = 0; s < segments; s++) {
    let segment = ''
    for (let c = 0; c < segmentLength; c++) {
      segment += chars[randomBytes[byteIdx] % chars.length]
      byteIdx++
    }
    parts.push(segment)
  }

  return parts.join('-')
}

/**
 * Compute expires_at based on billing period
 */
export function computeExpiresAt(billingPeriod: string, startDate?: Date): string {
  const now = startDate || new Date()

  if (billingPeriod === 'pass') {
    // Pass = 7 days from now
    now.setDate(now.getDate() + 7)
  } else if (billingPeriod === 'month') {
    // Monthly = 1 month from now
    now.setMonth(now.getMonth() + 1)
  } else if (billingPeriod === 'year') {
    // Yearly = 1 year from now
    now.setFullYear(now.getFullYear() + 1)
  }

  return now.toISOString()
}
