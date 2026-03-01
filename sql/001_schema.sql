-- =============================================================================
-- PETANQUE MANAGER — Complete Database Schema
-- Run this in Supabase SQL Editor
-- =============================================================================

-- pm_plans (already exists, but ensure structure is correct)
CREATE TABLE IF NOT EXISTS pm_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  billing_period TEXT NOT NULL CHECK (billing_period IN ('month', 'year', 'pass')),
  price_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'eur',
  included_seats INTEGER NOT NULL DEFAULT 1,
  stripe_price_id TEXT,
  stripe_product_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- pm_subscriptions (already exists from webhook, ensure structure)
CREATE TABLE IF NOT EXISTS pm_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES pm_plans(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trial', 'expired', 'suspended', 'cancelled')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ,
  provider TEXT DEFAULT 'stripe',
  provider_customer_id TEXT,
  provider_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- pm_license_keys (already exists from webhook, ensure structure)
CREATE TABLE IF NOT EXISTS pm_license_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES pm_subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  license_key TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired', 'suspended')),
  label TEXT,
  max_devices INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- pm_license_devices (NEW — tracks which PCs are linked to which license)
CREATE TABLE IF NOT EXISTS pm_license_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID NOT NULL REFERENCES pm_license_keys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_name TEXT NOT NULL DEFAULT 'PC sans nom',
  device_fingerprint TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'released', 'revoked')),
  activated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_check_in TIMESTAMPTZ DEFAULT now(),
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- pm_device_transfer_logs (NEW — audit log for device transfers)
CREATE TABLE IF NOT EXISTS pm_device_transfer_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID NOT NULL REFERENCES pm_license_keys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES pm_license_devices(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('release', 'activate', 'revoke')),
  device_name TEXT,
  device_fingerprint TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pm_subscriptions_user ON pm_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_pm_subscriptions_status ON pm_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_pm_license_keys_user ON pm_license_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_pm_license_keys_subscription ON pm_license_keys(subscription_id);
CREATE INDEX IF NOT EXISTS idx_pm_license_keys_key ON pm_license_keys(license_key);
CREATE INDEX IF NOT EXISTS idx_pm_license_devices_license ON pm_license_devices(license_id);
CREATE INDEX IF NOT EXISTS idx_pm_license_devices_user ON pm_license_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_pm_license_devices_status ON pm_license_devices(status);
CREATE INDEX IF NOT EXISTS idx_pm_device_transfer_logs_license ON pm_device_transfer_logs(license_id);
CREATE INDEX IF NOT EXISTS idx_pm_device_transfer_logs_user ON pm_device_transfer_logs(user_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to pm_subscriptions
DROP TRIGGER IF EXISTS set_updated_at_pm_subscriptions ON pm_subscriptions;
CREATE TRIGGER set_updated_at_pm_subscriptions
  BEFORE UPDATE ON pm_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
