-- =============================================================================
-- PETANQUE MANAGER — Row Level Security (RLS) Policies
-- Based on REAL existing tables in Supabase:
--   pm_plans, pm_subscriptions, pm_license_keys,
--   pm_devices, pm_activations, pm_device_events, pm_trials
--
-- Run this in Supabase SQL Editor.
-- The service_role key bypasses RLS; these policies protect anon/user tokens.
-- =============================================================================

-- =====================
-- 1. ENABLE RLS ON ALL TABLES
-- =====================
ALTER TABLE pm_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_license_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_device_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_trials ENABLE ROW LEVEL SECURITY;


-- =====================
-- 2. pm_plans — Public read for active plans (pricing page)
-- =====================
DROP POLICY IF EXISTS "plans_public_read" ON pm_plans;
CREATE POLICY "plans_public_read" ON pm_plans
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Service role: full write (admin manages plans)
DROP POLICY IF EXISTS "plans_service_write" ON pm_plans;
CREATE POLICY "plans_service_write" ON pm_plans
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- =====================
-- 3. pm_subscriptions — Users see only their own subscriptions
-- =====================
DROP POLICY IF EXISTS "subscriptions_select_own" ON pm_subscriptions;
CREATE POLICY "subscriptions_select_own" ON pm_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role: full access (Stripe webhooks create/update subs)
DROP POLICY IF EXISTS "subscriptions_service_all" ON pm_subscriptions;
CREATE POLICY "subscriptions_service_all" ON pm_subscriptions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- =====================
-- 4. pm_license_keys — Users see only their own license keys
-- =====================
DROP POLICY IF EXISTS "licenses_select_own" ON pm_license_keys;
CREATE POLICY "licenses_select_own" ON pm_license_keys
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role: full access (webhook creates licenses, API updates)
DROP POLICY IF EXISTS "licenses_service_all" ON pm_license_keys;
CREATE POLICY "licenses_service_all" ON pm_license_keys
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- =====================
-- 5. pm_devices — Users see only their own devices
-- =====================
DROP POLICY IF EXISTS "devices_select_own" ON pm_devices;
CREATE POLICY "devices_select_own" ON pm_devices
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role: full access (desktop app registers devices)
DROP POLICY IF EXISTS "devices_service_all" ON pm_devices;
CREATE POLICY "devices_service_all" ON pm_devices
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- =====================
-- 6. pm_activations — Users see activations for their licenses
-- =====================
DROP POLICY IF EXISTS "activations_select_own" ON pm_activations;
CREATE POLICY "activations_select_own" ON pm_activations
  FOR SELECT
  TO authenticated
  USING (
    license_key_id IN (
      SELECT id FROM pm_license_keys WHERE user_id = auth.uid()
    )
  );

-- Users can update their own activations (release device = set revoked_at)
DROP POLICY IF EXISTS "activations_update_own" ON pm_activations;
CREATE POLICY "activations_update_own" ON pm_activations
  FOR UPDATE
  TO authenticated
  USING (
    license_key_id IN (
      SELECT id FROM pm_license_keys WHERE user_id = auth.uid()
    )
  );

-- Service role: full access (desktop app creates activations)
DROP POLICY IF EXISTS "activations_service_all" ON pm_activations;
CREATE POLICY "activations_service_all" ON pm_activations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- =====================
-- 7. pm_device_events — Users see only their own events
-- =====================
DROP POLICY IF EXISTS "device_events_select_own" ON pm_device_events;
CREATE POLICY "device_events_select_own" ON pm_device_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert events (release logging from espace client)
DROP POLICY IF EXISTS "device_events_insert_own" ON pm_device_events;
CREATE POLICY "device_events_insert_own" ON pm_device_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Service role: full access (API + desktop app logs events)
DROP POLICY IF EXISTS "device_events_service_all" ON pm_device_events;
CREATE POLICY "device_events_service_all" ON pm_device_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- =====================
-- 8. pm_trials — Users see only their own trials
-- =====================
DROP POLICY IF EXISTS "trials_select_own" ON pm_trials;
CREATE POLICY "trials_select_own" ON pm_trials
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role: full access
DROP POLICY IF EXISTS "trials_service_all" ON pm_trials;
CREATE POLICY "trials_service_all" ON pm_trials
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- =====================
-- VERIFICATION: List all RLS policies
-- =====================
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename LIKE 'pm_%'
-- ORDER BY tablename, policyname;
