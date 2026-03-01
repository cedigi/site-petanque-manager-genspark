-- =============================================================================
-- PETANQUE MANAGER — Database Schema Reference
-- These tables already exist in Supabase. This file documents the schema.
-- Run only the CREATE TABLE IF NOT EXISTS / ALTER TABLE statements if needed.
-- =============================================================================

-- =====================
-- pm_plans — Available subscription plans
-- =====================
-- Already exists. Example records:
--   SOLO_M (19 EUR/month, 1 seat)
--   duo_m (27 EUR/month, 2 seats)
--   trio_m, trio_y, club_m, club_y, event_7d...
--
-- CREATE TABLE IF NOT EXISTS pm_plans (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   code TEXT UNIQUE NOT NULL,           -- e.g. SOLO_M, duo_y, event_7d
--   name TEXT NOT NULL,                  -- Display name
--   billing_period TEXT,                 -- 'month', 'year', '7d'
--   included_seats INTEGER DEFAULT 1,
--   price_cents INTEGER,                 -- Price in cents (1900 = 19.00 EUR)
--   currency TEXT DEFAULT 'EUR',
--   stripe_price_id TEXT,                -- Stripe price ID for checkout
--   is_active BOOLEAN DEFAULT true,
--   created_at TIMESTAMPTZ DEFAULT now()
-- );

-- =====================
-- pm_subscriptions — User subscriptions (created via Stripe webhooks)
-- =====================
-- CREATE TABLE IF NOT EXISTS pm_subscriptions (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   user_id UUID NOT NULL REFERENCES auth.users(id),
--   plan_id UUID NOT NULL REFERENCES pm_plans(id),
--   status TEXT DEFAULT 'active',        -- active, trial, expired, cancelled, suspended
--   started_at TIMESTAMPTZ DEFAULT now(),
--   current_period_end TIMESTAMPTZ,
--   provider TEXT,                        -- 'stripe'
--   provider_customer_id TEXT,
--   provider_subscription_id TEXT
-- );

-- =====================
-- pm_license_keys — License keys linked to subscriptions
-- =====================
-- CREATE TABLE IF NOT EXISTS pm_license_keys (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   subscription_id UUID REFERENCES pm_subscriptions(id),
--   user_id UUID NOT NULL REFERENCES auth.users(id),
--   license_key TEXT UNIQUE NOT NULL,    -- e.g. PM-AB12-CD34-EF56-GH78-PJ90
--   status TEXT DEFAULT 'active',        -- active, revoked, expired, suspended
--   created_at TIMESTAMPTZ DEFAULT now(),
--   expires_at TIMESTAMPTZ,
--   max_devices INTEGER DEFAULT 1,
--   last_seen_at TIMESTAMPTZ,
--   label TEXT                            -- Optional user label
-- );

-- =====================
-- pm_devices — Registered devices (desktop app registers on first launch)
-- =====================
-- CREATE TABLE IF NOT EXISTS pm_devices (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   user_id UUID NOT NULL REFERENCES auth.users(id),
--   device_hash TEXT NOT NULL,            -- SHA-256 hardware fingerprint
--   device_name TEXT,                     -- e.g. "Pétanque Manager (Win32)"
--   os_name TEXT,                         -- e.g. "Windows"
--   created_at TIMESTAMPTZ DEFAULT now(),
--   last_seen_at TIMESTAMPTZ
-- );

-- =====================
-- pm_activations — Links a license key to a device
-- When user releases a device, revoked_at is set (license key NEVER changes)
-- =====================
-- CREATE TABLE IF NOT EXISTS pm_activations (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   license_key_id UUID NOT NULL REFERENCES pm_license_keys(id),
--   device_id UUID NOT NULL REFERENCES pm_devices(id),
--   activated_at TIMESTAMPTZ DEFAULT now(),
--   last_seen_at TIMESTAMPTZ,
--   revoked_at TIMESTAMPTZ,              -- Set when device is released
--   revoked_reason TEXT,                  -- 'user_release', 'admin', 'expired'
--   revoked_by UUID REFERENCES auth.users(id)
-- );

-- =====================
-- pm_device_events — Audit log for all device actions
-- Records activations, releases, check-ins
-- =====================
-- CREATE TABLE IF NOT EXISTS pm_device_events (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   user_id UUID REFERENCES auth.users(id),
--   license_key_id UUID REFERENCES pm_license_keys(id),
--   device_id UUID REFERENCES pm_devices(id),
--   action TEXT NOT NULL,                 -- 'activation', 'release', 'checkin'
--   metadata JSONB,                       -- Extra data (IP, user_agent, device_name, etc.)
--   created_at TIMESTAMPTZ DEFAULT now()
-- );

-- =====================
-- pm_trials — Trial periods for devices
-- =====================
-- CREATE TABLE IF NOT EXISTS pm_trials (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   user_id UUID REFERENCES auth.users(id),
--   device_hash TEXT,
--   device_name TEXT,
--   started_at TIMESTAMPTZ DEFAULT now(),
--   expires_at TIMESTAMPTZ,
--   created_at TIMESTAMPTZ DEFAULT now()
-- );

-- =====================
-- USEFUL INDEXES (create if not already present)
-- =====================
CREATE INDEX IF NOT EXISTS idx_pm_subscriptions_user_id ON pm_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_pm_subscriptions_status ON pm_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_pm_license_keys_user_id ON pm_license_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_pm_license_keys_subscription_id ON pm_license_keys(subscription_id);
CREATE INDEX IF NOT EXISTS idx_pm_license_keys_status ON pm_license_keys(status);
CREATE INDEX IF NOT EXISTS idx_pm_devices_user_id ON pm_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_pm_devices_device_hash ON pm_devices(device_hash);
CREATE INDEX IF NOT EXISTS idx_pm_activations_license_key_id ON pm_activations(license_key_id);
CREATE INDEX IF NOT EXISTS idx_pm_activations_device_id ON pm_activations(device_id);
CREATE INDEX IF NOT EXISTS idx_pm_device_events_user_id ON pm_device_events(user_id);
CREATE INDEX IF NOT EXISTS idx_pm_device_events_action ON pm_device_events(action);
CREATE INDEX IF NOT EXISTS idx_pm_trials_user_id ON pm_trials(user_id);
