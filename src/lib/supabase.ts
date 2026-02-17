// src/lib/supabase.ts — Supabase REST client for Cloudflare Workers (no node deps)

export interface SupabaseConfig {
  url: string
  serviceRoleKey: string
}

export function createSupabaseClient(config: SupabaseConfig) {
  const { url, serviceRoleKey } = config
  const baseUrl = `${url}/rest/v1`
  const headers = {
    'apikey': serviceRoleKey,
    'Authorization': `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  }

  return {
    // SELECT from table
    async select<T = any>(table: string, query: string = ''): Promise<T[]> {
      const res = await fetch(`${baseUrl}/${table}?${query}`, {
        method: 'GET',
        headers: { ...headers, 'Prefer': 'return=representation' },
      })
      if (!res.ok) {
        const err = await res.text()
        throw new Error(`Supabase SELECT ${table} failed: ${res.status} — ${err}`)
      }
      return res.json() as Promise<T[]>
    },

    // INSERT into table
    async insert<T = any>(table: string, data: Record<string, any>): Promise<T[]> {
      const res = await fetch(`${baseUrl}/${table}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.text()
        throw new Error(`Supabase INSERT ${table} failed: ${res.status} — ${err}`)
      }
      return res.json() as Promise<T[]>
    },

    // UPDATE table
    async update<T = any>(table: string, query: string, data: Record<string, any>): Promise<T[]> {
      const res = await fetch(`${baseUrl}/${table}?${query}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.text()
        throw new Error(`Supabase UPDATE ${table} failed: ${res.status} — ${err}`)
      }
      return res.json() as Promise<T[]>
    },

    // Supabase Auth: create user or get existing
    async getOrCreateUser(email: string): Promise<{ id: string; email: string }> {
      // Try to find existing user by email via admin API
      const listRes = await fetch(`${url}/auth/v1/admin/users?page=1&per_page=1`, {
        method: 'GET',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
      })

      if (listRes.ok) {
        const data = await listRes.json() as any
        const users = data.users || data
        if (Array.isArray(users)) {
          const existing = users.find((u: any) => u.email === email)
          if (existing) {
            return { id: existing.id, email: existing.email }
          }
        }
      }

      // Search specifically by email
      const searchRes = await fetch(`${url}/auth/v1/admin/users?page=1&per_page=50`, {
        method: 'GET',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
      })

      if (searchRes.ok) {
        const data = await searchRes.json() as any
        const users = data.users || data
        if (Array.isArray(users)) {
          const existing = users.find((u: any) => u.email === email)
          if (existing) {
            return { id: existing.id, email: existing.email }
          }
        }
      }

      // Create new user
      const createRes = await fetch(`${url}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          email_confirm: true,
          app_metadata: { provider: 'stripe' },
        }),
      })

      if (!createRes.ok) {
        const err = await createRes.text()
        // If user already exists (422), try to extract from error
        if (createRes.status === 422) {
          // Re-search with broader range
          const retryRes = await fetch(`${url}/auth/v1/admin/users?page=1&per_page=500`, {
            method: 'GET',
            headers: {
              'apikey': serviceRoleKey,
              'Authorization': `Bearer ${serviceRoleKey}`,
            },
          })
          if (retryRes.ok) {
            const retryData = await retryRes.json() as any
            const users = retryData.users || retryData
            if (Array.isArray(users)) {
              const found = users.find((u: any) => u.email === email)
              if (found) return { id: found.id, email: found.email }
            }
          }
        }
        throw new Error(`Supabase create user failed: ${createRes.status} — ${err}`)
      }

      const newUser = await createRes.json() as any
      return { id: newUser.id, email: newUser.email }
    },
  }
}
