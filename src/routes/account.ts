// src/routes/account.ts — Client portal API routes
import { Hono } from 'hono'

type Bindings = {
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
  SUPABASE_ANON_KEY: string
}

const account = new Hono<{ Bindings: Bindings }>()

// ============================================================
// Helper: verify JWT token and extract user
// ============================================================
async function verifyToken(c: any): Promise<{ id: string; email: string } | null> {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  
  const token = authHeader.replace('Bearer ', '')
  const supabaseUrl = c.env.SUPABASE_URL
  const supabaseKey = c.env.SUPABASE_ANON_KEY

  // Verify token with Supabase Auth
  const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!res.ok) return null
  const user = await res.json() as any
  if (!user?.id) return null
  return { id: user.id, email: user.email }
}

// Helper: Supabase service client for server-side ops
function serviceHeaders(c: any) {
  return {
    'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  }
}

// ============================================================
// AUTH: Login with email/password
// ============================================================
account.post('/api/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json() as { email: string; password: string }
    if (!email || !password) {
      return c.json({ error: 'Email et mot de passe requis.' }, 400)
    }

    const res = await fetch(`${c.env.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': c.env.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json() as any

    if (!res.ok) {
      const msg = data?.error_description || data?.msg || data?.error || 'Identifiants invalides.'
      return c.json({ error: msg }, 401)
    }

    return c.json({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      user: {
        id: data.user?.id,
        email: data.user?.email,
      },
    })
  } catch (err: any) {
    return c.json({ error: err.message || 'Erreur serveur.' }, 500)
  }
})

// ============================================================
// AUTH: Refresh token
// ============================================================
account.post('/api/auth/refresh', async (c) => {
  try {
    const { refresh_token } = await c.req.json() as { refresh_token: string }
    if (!refresh_token) {
      return c.json({ error: 'Refresh token requis.' }, 400)
    }

    const res = await fetch(`${c.env.SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: {
        'apikey': c.env.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token }),
    })

    const data = await res.json() as any
    if (!res.ok) {
      return c.json({ error: 'Session expirée. Veuillez vous reconnecter.' }, 401)
    }

    return c.json({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
    })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// ============================================================
// AUTH: Password reset request
// ============================================================
account.post('/api/auth/reset-password', async (c) => {
  try {
    const { email } = await c.req.json() as { email: string }
    if (!email) {
      return c.json({ error: 'Email requis.' }, 400)
    }

    const origin = new URL(c.req.url).origin
    const res = await fetch(`${c.env.SUPABASE_URL}/auth/v1/recover`, {
      method: 'POST',
      headers: {
        'apikey': c.env.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        gotrue_meta_security: { captcha_token: '' },
      }),
    })

    // Always return success to prevent email enumeration
    return c.json({ success: true, message: 'Si un compte existe, un email de réinitialisation a été envoyé.' })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// ============================================================
// AUTH: Get current user info
// ============================================================
account.get('/api/auth/me', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Non authentifié.' }, 401)
  return c.json({ user })
})

// ============================================================
// AUTH: Logout (just informational, token invalidation is client-side)
// ============================================================
account.post('/api/auth/logout', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '')
    // Try to sign out server-side
    await fetch(`${c.env.SUPABASE_URL}/auth/v1/logout`, {
      method: 'POST',
      headers: {
        'apikey': c.env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
      },
    }).catch(() => {})
  }
  return c.json({ success: true })
})

// ============================================================
// ACCOUNT: Get dashboard data (subscriptions, licenses, devices)
// ============================================================
account.get('/api/account/dashboard', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Non authentifié.' }, 401)

  const baseUrl = `${c.env.SUPABASE_URL}/rest/v1`
  const headers = serviceHeaders(c)

  try {
    // 1. Fetch subscriptions with plan info
    const subsRes = await fetch(
      `${baseUrl}/pm_subscriptions?user_id=eq.${user.id}&select=*,pm_plans(code,name,billing_period,included_seats)&order=created_at.desc`,
      { headers }
    )
    const subscriptions = subsRes.ok ? await subsRes.json() as any[] : []

    // 2. Fetch licenses
    const licRes = await fetch(
      `${baseUrl}/pm_license_keys?user_id=eq.${user.id}&select=*&order=created_at.desc`,
      { headers }
    )
    const licenses = licRes.ok ? await licRes.json() as any[] : []

    // 3. Fetch devices
    const devRes = await fetch(
      `${baseUrl}/pm_license_devices?user_id=eq.${user.id}&select=*&order=created_at.desc`,
      { headers }
    )
    const devices = devRes.ok ? await devRes.json() as any[] : []

    // 4. Compute summaries
    const activeLicenses = licenses.filter((l: any) => l.status === 'active')
    const totalSlots = activeLicenses.reduce((sum: number, l: any) => sum + (l.max_devices || 0), 0)
    const activeDevices = devices.filter((d: any) => d.status === 'active')
    const usedSlots = activeDevices.length
    const freeSlots = Math.max(0, totalSlots - usedSlots)

    // 5. Mask license keys for security (show first 7 and last 4 chars)
    const maskedLicenses = licenses.map((l: any) => ({
      ...l,
      license_key_masked: maskLicenseKey(l.license_key),
    }))

    return c.json({
      user: { id: user.id, email: user.email },
      subscriptions,
      licenses: maskedLicenses,
      devices,
      summary: {
        total_slots: totalSlots,
        used_slots: usedSlots,
        free_slots: freeSlots,
        active_subscriptions: subscriptions.filter((s: any) => s.status === 'active').length,
        active_licenses: activeLicenses.length,
      },
    })
  } catch (err: any) {
    console.error('[DASHBOARD ERROR]', err.message)
    return c.json({ error: 'Erreur lors du chargement des données.' }, 500)
  }
})

// ============================================================
// ACCOUNT: Release a device (free a slot)
// ============================================================
account.post('/api/account/devices/:deviceId/release', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Non authentifié.' }, 401)

  const deviceId = c.req.param('deviceId')
  const baseUrl = `${c.env.SUPABASE_URL}/rest/v1`
  const headers = serviceHeaders(c)

  try {
    // 1. Verify device belongs to user and is active
    const devRes = await fetch(
      `${baseUrl}/pm_license_devices?id=eq.${deviceId}&user_id=eq.${user.id}&status=eq.active`,
      { headers }
    )
    const devices = devRes.ok ? await devRes.json() as any[] : []

    if (!devices.length) {
      return c.json({ error: 'Appareil non trouvé ou déjà libéré.' }, 404)
    }

    const device = devices[0]
    const now = new Date().toISOString()

    // 2. Update device status to released
    const updateRes = await fetch(
      `${baseUrl}/pm_license_devices?id=eq.${deviceId}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          status: 'released',
          released_at: now,
        }),
      }
    )

    if (!updateRes.ok) {
      throw new Error('Failed to release device')
    }

    // 3. Log the transfer
    const logData = {
      license_id: device.license_id,
      user_id: user.id,
      device_id: deviceId,
      action: 'release',
      device_name: device.device_name,
      device_fingerprint: device.device_fingerprint,
      ip_address: c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || null,
      user_agent: c.req.header('user-agent') || null,
    }

    await fetch(`${baseUrl}/pm_device_transfer_logs`, {
      method: 'POST',
      headers,
      body: JSON.stringify(logData),
    })

    console.log(`[DEVICE RELEASE] User ${user.id} released device ${deviceId} (${device.device_name})`)

    return c.json({
      success: true,
      message: `L'appareil "${device.device_name}" a été libéré. Vous pouvez maintenant activer cette licence sur un autre PC.`,
      device_id: deviceId,
      license_key_unchanged: true,
    })
  } catch (err: any) {
    console.error('[RELEASE ERROR]', err.message)
    return c.json({ error: 'Erreur lors de la libération de l\'appareil.' }, 500)
  }
})

// ============================================================
// ACCOUNT: Get transfer history
// ============================================================
account.get('/api/account/transfers', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Non authentifié.' }, 401)

  const baseUrl = `${c.env.SUPABASE_URL}/rest/v1`
  const headers = serviceHeaders(c)

  const res = await fetch(
    `${baseUrl}/pm_device_transfer_logs?user_id=eq.${user.id}&order=created_at.desc&limit=50`,
    { headers }
  )

  const logs = res.ok ? await res.json() as any[] : []
  return c.json({ transfers: logs })
})

// ============================================================
// Helper: mask license key PM-XXXX-XXXX-XXXX-XXXX-7F3A -> PM-XXXX-XXXX-****-****-7F3A
// ============================================================
function maskLicenseKey(key: string): string {
  if (!key || key.length < 10) return key
  const parts = key.split('-')
  if (parts.length >= 6) {
    // PM-XXXX-XXXX-XXXX-XXXX-XXXX -> PM-XXXX-XXXX-****-****-XXXX
    return `${parts[0]}-${parts[1]}-${parts[2]}-****-****-${parts[5]}`
  }
  // Fallback: show first 7 and last 4
  return key.substring(0, 7) + '****' + key.substring(key.length - 4)
}

export default account
