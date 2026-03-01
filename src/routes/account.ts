// src/routes/account.ts — Client portal API routes (uses REAL Supabase tables)
// Tables: pm_plans, pm_subscriptions, pm_license_keys, pm_devices, pm_activations, pm_device_events
import { Hono } from 'hono'

type Bindings = {
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
  SUPABASE_ANON_KEY: string
}

const account = new Hono<{ Bindings: Bindings }>()

// ============================================================
// Plan display names mapping (code → human-readable)
// ============================================================
const PLAN_DISPLAY: Record<string, { name: string; seats: number }> = {
  'solo_m': { name: 'Solo (Mensuel)', seats: 1 },
  'solo_y': { name: 'Solo (Annuel)', seats: 1 },
  'SOLO_M': { name: 'Solo (Mensuel)', seats: 1 },
  'SOLO_Y': { name: 'Solo (Annuel)', seats: 1 },
  'duo_m': { name: 'Duo (Mensuel)', seats: 2 },
  'duo_y': { name: 'Duo (Annuel)', seats: 2 },
  'DUO_M': { name: 'Duo (Mensuel)', seats: 2 },
  'DUO_Y': { name: 'Duo (Annuel)', seats: 2 },
  'trio_m': { name: 'Trio (Mensuel)', seats: 3 },
  'trio_y': { name: 'Trio (Annuel)', seats: 3 },
  'TRIO_M': { name: 'Trio (Mensuel)', seats: 3 },
  'TRIO_Y': { name: 'Trio (Annuel)', seats: 3 },
  'club_m': { name: 'Club Pack (Mensuel)', seats: 5 },
  'club_y': { name: 'Club Pack (Annuel)', seats: 5 },
  'CLUB_M': { name: 'Club Pack (Mensuel)', seats: 5 },
  'CLUB_Y': { name: 'Club Pack (Annuel)', seats: 5 },
  'event_7d': { name: 'Pass Événement (7j)', seats: 2 },
  'EVENT_7D': { name: 'Pass Événement (7j)', seats: 2 },
}

function getPlanDisplayName(code: string, fallbackName?: string): string {
  return PLAN_DISPLAY[code]?.name || fallbackName || code
}

// ============================================================
// Status labels (DB → display)
// ============================================================
const STATUS_LABELS: Record<string, string> = {
  'active': 'Actif',
  'trial': 'Essai',
  'expired': 'Expiré',
  'cancelled': 'Annulé',
  'suspended': 'Suspendu',
  'revoked': 'Révoqué',
  'released': 'Libéré',
}

function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] || status
}

function getStatusType(status: string): string {
  const map: Record<string, string> = {
    'active': 'active',
    'trial': 'trial',
    'expired': 'expired',
    'cancelled': 'expired',
    'suspended': 'suspended',
    'revoked': 'expired',
    'released': 'released',
  }
  return map[status] || 'expired'
}

// ============================================================
// Helper: verify JWT token and extract user
// ============================================================
async function verifyToken(c: any): Promise<{ id: string; email: string } | null> {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null

  const token = authHeader.replace('Bearer ', '')
  const supabaseUrl = c.env.SUPABASE_URL
  const supabaseKey = c.env.SUPABASE_ANON_KEY

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

// Helper: service-role headers
function svcHeaders(c: any) {
  return {
    'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  }
}

function baseUrl(c: any) {
  return `${c.env.SUPABASE_URL}/rest/v1`
}

// ============================================================
// AUTH: Login
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
      user: { id: data.user?.id, email: data.user?.email },
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
    if (!refresh_token) return c.json({ error: 'Refresh token requis.' }, 400)

    const res = await fetch(`${c.env.SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: {
        'apikey': c.env.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token }),
    })

    const data = await res.json() as any
    if (!res.ok) return c.json({ error: 'Session expirée. Veuillez vous reconnecter.' }, 401)

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
// AUTH: Password reset
// ============================================================
account.post('/api/auth/reset-password', async (c) => {
  try {
    const { email } = await c.req.json() as { email: string }
    if (!email) return c.json({ error: 'Email requis.' }, 400)

    await fetch(`${c.env.SUPABASE_URL}/auth/v1/recover`, {
      method: 'POST',
      headers: {
        'apikey': c.env.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })

    // Anti-enumeration: always return success
    return c.json({ success: true, message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.' })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// ============================================================
// AUTH: Me
// ============================================================
account.get('/api/auth/me', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Non authentifié.' }, 401)
  return c.json({ user })
})

// ============================================================
// AUTH: Logout
// ============================================================
account.post('/api/auth/logout', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '')
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
// DASHBOARD: Get all user data
// Uses real tables: pm_subscriptions, pm_plans, pm_license_keys,
//                   pm_activations, pm_devices, pm_device_events
// ============================================================
account.get('/api/account/dashboard', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Non authentifié.' }, 401)

  const url = baseUrl(c)
  const h = svcHeaders(c)

  try {
    // 1. Subscriptions with plan join (disambiguated FK)
    const subsRes = await fetch(
      `${url}/pm_subscriptions?user_id=eq.${user.id}&select=*,pm_plans!pm_subscriptions_plan_id_fkey(id,code,name,billing_period,included_seats,price_cents,currency)&order=started_at.desc`,
      { headers: h }
    )
    const rawSubscriptions = subsRes.ok ? await subsRes.json() as any[] : []

    // Format subscriptions with display names
    const subscriptions = rawSubscriptions.map((s: any) => {
      const plan = s.pm_plans || {}
      const planCode = plan.code || ''
      const isExpired = s.current_period_end && new Date(s.current_period_end) < new Date()
      const effectiveStatus = isExpired && s.status === 'active' ? 'expired' : s.status

      return {
        id: s.id,
        plan_code: planCode,
        plan_name: getPlanDisplayName(planCode, plan.name),
        billing_period: plan.billing_period || '',
        billing_period_label: plan.billing_period === 'month' ? 'Mensuel' : plan.billing_period === 'year' ? 'Annuel' : plan.billing_period || '',
        included_seats: plan.included_seats || 1,
        price: plan.price_cents ? (plan.price_cents / 100).toFixed(2) + ' ' + (plan.currency || 'EUR') : null,
        status: effectiveStatus,
        status_label: getStatusLabel(effectiveStatus),
        status_type: getStatusType(effectiveStatus),
        started_at: s.started_at,
        current_period_end: s.current_period_end,
      }
    })

    // 2. License keys
    const licRes = await fetch(
      `${url}/pm_license_keys?user_id=eq.${user.id}&select=*&order=created_at.desc`,
      { headers: h }
    )
    const rawLicenses = licRes.ok ? await licRes.json() as any[] : []

    // 3. Activations for this user's licenses (join device info)
    const licenseIds = rawLicenses.map((l: any) => l.id)
    let activations: any[] = []
    if (licenseIds.length > 0) {
      const licFilter = licenseIds.map((id: string) => `"${id}"`).join(',')
      const actRes = await fetch(
        `${url}/pm_activations?license_key_id=in.(${licFilter})&select=*,pm_devices!pm_activations_device_id_fkey(id,device_name,device_hash,os_name,last_seen_at,created_at)&order=created_at.desc`,
        { headers: h }
      )
      activations = actRes.ok ? await actRes.json() as any[] : []
    }

    // 4. Compute summaries
    const activeLicenses = rawLicenses.filter((l: any) => l.status === 'active')
    const totalSlots = activeLicenses.reduce((sum: number, l: any) => sum + (l.max_devices || 0), 0)
    const activeActivations = activations.filter((a: any) => !a.revoked_at)
    const usedSlots = activeActivations.length
    const freeSlots = Math.max(0, totalSlots - usedSlots)

    // 5. Format licenses with masked keys and device counts
    const licenses = rawLicenses.map((l: any) => {
      // Find associated subscription to get plan name
      const sub = rawSubscriptions.find((s: any) => s.id === l.subscription_id)
      const planCode = sub?.pm_plans?.code || ''
      const activeDevCount = activations.filter((a: any) => a.license_key_id === l.id && !a.revoked_at).length
      const isExpired = l.expires_at && new Date(l.expires_at) < new Date()
      const effectiveStatus = isExpired && l.status === 'active' ? 'expired' : l.status

      return {
        id: l.id,
        subscription_id: l.subscription_id,
        license_key_masked: maskLicenseKey(l.license_key),
        plan_name: getPlanDisplayName(planCode, sub?.pm_plans?.name),
        status: effectiveStatus,
        status_label: getStatusLabel(effectiveStatus),
        status_type: getStatusType(effectiveStatus),
        max_devices: l.max_devices || 1,
        active_devices: activeDevCount,
        created_at: l.created_at,
        expires_at: l.expires_at,
        last_seen_at: l.last_seen_at,
      }
    })

    // 6. Build device list from activations
    const devices = activations.map((a: any) => {
      const dev = a.pm_devices || {}
      const isRevoked = !!a.revoked_at
      const effectiveStatus = isRevoked ? 'released' : 'active'

      return {
        activation_id: a.id,
        license_key_id: a.license_key_id,
        device_id: dev.id || a.device_id,
        device_name: dev.device_name || 'PC sans nom',
        device_hash: dev.device_hash || '',
        os_name: dev.os_name || '',
        activated_at: a.activated_at,
        last_seen_at: a.last_seen_at || dev.last_seen_at,
        revoked_at: a.revoked_at,
        status: effectiveStatus,
        status_label: getStatusLabel(effectiveStatus),
        status_type: getStatusType(effectiveStatus),
        license_key_masked: maskLicenseKey(
          rawLicenses.find((l: any) => l.id === a.license_key_id)?.license_key || ''
        ),
      }
    })

    // Active subscriptions count (not expired)
    const activeSubsCount = subscriptions.filter((s: any) => s.status === 'active' || s.status === 'trial').length

    return c.json({
      user: { id: user.id, email: user.email },
      subscriptions,
      licenses,
      devices,
      summary: {
        total_slots: totalSlots,
        used_slots: usedSlots,
        free_slots: freeSlots,
        active_subscriptions: activeSubsCount,
        active_licenses: activeLicenses.length,
      },
    })
  } catch (err: any) {
    console.error('[DASHBOARD ERROR]', err.message)
    return c.json({ error: 'Erreur lors du chargement des données.' }, 500)
  }
})

// ============================================================
// RELEASE DEVICE: Revoke an activation (free a slot)
// Sets revoked_at on pm_activations + logs in pm_device_events
// License key NEVER changes.
// ============================================================
account.post('/api/account/devices/:activationId/release', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Non authentifié.' }, 401)

  const activationId = c.req.param('activationId')
  const url = baseUrl(c)
  const h = svcHeaders(c)

  try {
    // 1. Fetch activation + verify ownership through license_key
    const actRes = await fetch(
      `${url}/pm_activations?id=eq.${activationId}&select=*,pm_devices!pm_activations_device_id_fkey(id,device_name,device_hash)`,
      { headers: h }
    )
    const acts = actRes.ok ? await actRes.json() as any[] : []
    if (!acts.length) {
      return c.json({ error: 'Activation non trouvée.' }, 404)
    }
    const activation = acts[0]

    // Already revoked?
    if (activation.revoked_at) {
      return c.json({ error: 'Cet appareil a déjà été libéré.' }, 400)
    }

    // Verify the license belongs to this user
    const licRes = await fetch(
      `${url}/pm_license_keys?id=eq.${activation.license_key_id}&user_id=eq.${user.id}`,
      { headers: h }
    )
    const lics = licRes.ok ? await licRes.json() as any[] : []
    if (!lics.length) {
      return c.json({ error: 'Vous n\'êtes pas autorisé à libérer cet appareil.' }, 403)
    }

    const now = new Date().toISOString()
    const deviceInfo = activation.pm_devices || {}

    // 2. Revoke activation (set revoked_at + reason)
    const revokeRes = await fetch(
      `${url}/pm_activations?id=eq.${activationId}`,
      {
        method: 'PATCH',
        headers: h,
        body: JSON.stringify({
          revoked_at: now,
          revoked_reason: 'user_release',
          revoked_by: user.id,
        }),
      }
    )

    if (!revokeRes.ok) {
      const errBody = await revokeRes.text()
      console.error('[REVOKE FAILED]', revokeRes.status, errBody)
      throw new Error('Échec de la libération')
    }

    // 3. Log the release event in pm_device_events
    await fetch(`${url}/pm_device_events`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        user_id: user.id,
        license_key_id: activation.license_key_id,
        device_id: deviceInfo.id || activation.device_id,
        action: 'release',
        metadata: {
          source: 'espace_client',
          device_name: deviceInfo.device_name || '',
          device_hash: deviceInfo.device_hash || '',
          ip: c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown',
          user_agent: c.req.header('user-agent') || '',
          timestamp: now,
        },
      }),
    })

    console.log(`[DEVICE RELEASE] User ${user.email} (${user.id}) released activation ${activationId} — device: ${deviceInfo.device_name} (${deviceInfo.device_hash?.substring(0, 8)}...)`)

    return c.json({
      success: true,
      message: `L'appareil "${deviceInfo.device_name || 'PC'}" a été libéré avec succès. Vous pouvez maintenant activer cette même licence sur un autre PC.`,
      activation_id: activationId,
      license_key_unchanged: true,
    })
  } catch (err: any) {
    console.error('[RELEASE ERROR]', err.message)
    return c.json({ error: 'Erreur lors de la libération de l\'appareil.' }, 500)
  }
})

// ============================================================
// TRANSFER HISTORY: recent release/activation events
// ============================================================
account.get('/api/account/transfers', async (c) => {
  const user = await verifyToken(c)
  if (!user) return c.json({ error: 'Non authentifié.' }, 401)

  const url = baseUrl(c)
  const h = svcHeaders(c)

  try {
    const res = await fetch(
      `${url}/pm_device_events?user_id=eq.${user.id}&action=in.(release,activation)&order=created_at.desc&limit=50`,
      { headers: h }
    )

    const logs = res.ok ? await res.json() as any[] : []

    const formattedLogs = logs.map((log: any) => ({
      id: log.id,
      action: log.action,
      action_label: log.action === 'release' ? 'Libération' : log.action === 'activation' ? 'Activation' : log.action,
      device_name: log.metadata?.device_name || '—',
      created_at: log.created_at,
      ip: log.metadata?.ip || '—',
    }))

    return c.json({ transfers: formattedLogs })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// ============================================================
// Helper: mask license key
// PM-AB12-CD34-EF56-GH78-PJ90 -> PM-AB12-****-****-****-PJ90
// ============================================================
function maskLicenseKey(key: string): string {
  if (!key || key.length < 10) return key || '—'
  const parts = key.split('-')
  if (parts.length >= 6) {
    return `${parts[0]}-${parts[1]}-****-****-****-${parts[parts.length - 1]}`
  }
  // Generic masking for shorter keys
  return key.substring(0, 7) + '****' + key.substring(key.length - 4)
}

export default account
