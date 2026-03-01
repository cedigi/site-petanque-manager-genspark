-- =============================================================================
-- PETANQUE MANAGER — Row Level Security (RLS) Policies
-- Run this in Supabase SQL Editor AFTER 001_schema.sql
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE pm_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_license_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_license_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_device_transfer_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_plans ENABLE ROW LEVEL SECURITY;

-- pm_plans: Everyone can read active plans (public pricing)
DROP POLICY IF EXISTS "plans_read_active" ON pm_plans;
CREATE POLICY "plans_read_active" ON pm_plans
  FOR SELECT USING (is_active = true);

-- pm_subscriptions: Users can only see their own
DROP POLICY IF EXISTS "subscriptions_select_own" ON pm_subscriptions;
CREATE POLICY "subscriptions_select_own" ON pm_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- pm_subscriptions: Service role can insert/update (webhooks)
DROP POLICY IF EXISTS "subscriptions_service_insert" ON pm_subscriptions;
CREATE POLICY "subscriptions_service_insert" ON pm_subscriptions
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "subscriptions_service_update" ON pm_subscriptions;
CREATE POLICY "subscriptions_service_update" ON pm_subscriptions
  FOR UPDATE USING (true);

-- pm_license_keys: Users can only see their own
DROP POLICY IF EXISTS "licenses_select_own" ON pm_license_keys;
CREATE POLICY "licenses_select_own" ON pm_license_keys
  FOR SELECT USING (auth.uid() = user_id);

-- pm_license_keys: Service role can insert/update
DROP POLICY IF EXISTS "licenses_service_insert" ON pm_license_keys;
CREATE POLICY "licenses_service_insert" ON pm_license_keys
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "licenses_service_update" ON pm_license_keys;
CREATE POLICY "licenses_service_update" ON pm_license_keys
  FOR UPDATE USING (true);

-- pm_license_devices: Users can only see their own
DROP POLICY IF EXISTS "devices_select_own" ON pm_license_devices;
CREATE POLICY "devices_select_own" ON pm_license_devices
  FOR SELECT USING (auth.uid() = user_id);

-- pm_license_devices: Users can update their own (release)
DROP POLICY IF EXISTS "devices_update_own" ON pm_license_devices;
CREATE POLICY "devices_update_own" ON pm_license_devices
  FOR UPDATE USING (auth.uid() = user_id);

-- pm_license_devices: Service role can insert (activation from desktop app)
DROP POLICY IF EXISTS "devices_service_insert" ON pm_license_devices;
CREATE POLICY "devices_service_insert" ON pm_license_devices
  FOR INSERT WITH CHECK (true);

-- pm_device_transfer_logs: Users can only see their own
DROP POLICY IF EXISTS "transfer_logs_select_own" ON pm_device_transfer_logs;
CREATE POLICY "transfer_logs_select_own" ON pm_device_transfer_logs
  FOR SELECT USING (auth.uid() = user_id);

-- pm_device_transfer_logs: Can insert (logging from API)
DROP POLICY IF EXISTS "transfer_logs_service_insert" ON pm_device_transfer_logs;
CREATE POLICY "transfer_logs_service_insert" ON pm_device_transfer_logs
  FOR INSERT WITH CHECK (true);
