-- ============================================================
-- BrandFlow Admin System — Run in Supabase SQL Editor
-- Project: ycvnqrvcgwvvatzbtqrt
-- ============================================================

-- 1. Add admin columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_admin        BOOLEAN    DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_locked       BOOLEAN    DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS lock_reason     TEXT,
  ADD COLUMN IF NOT EXISTS admin_notes     TEXT,
  ADD COLUMN IF NOT EXISTS last_active_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS impersonated_by UUID;

-- 2. Grant admin to your account
UPDATE profiles SET is_admin = TRUE
WHERE email = 'muhammadubs@gmail.com';

-- 3. Feature flags
CREATE TABLE IF NOT EXISTS feature_flags (
  id                   UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  key                  TEXT        UNIQUE NOT NULL,
  name                 TEXT        NOT NULL,
  description          TEXT,
  is_enabled_globally  BOOLEAN     DEFAULT TRUE,
  enabled_for_plans    TEXT[]      DEFAULT ARRAY['free','pro','enterprise'],
  rollout_percentage   INTEGER     DEFAULT 100 CHECK (rollout_percentage BETWEEN 0 AND 100),
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Per-user feature overrides
CREATE TABLE IF NOT EXISTS user_feature_overrides (
  id               UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id          UUID        REFERENCES profiles(user_id) ON DELETE CASCADE,
  feature_key      TEXT        REFERENCES feature_flags(key) ON DELETE CASCADE,
  is_enabled       BOOLEAN     NOT NULL,
  reason           TEXT,
  set_by_admin_id  UUID        REFERENCES profiles(user_id),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, feature_key)
);

-- 5. Promo codes
CREATE TABLE IF NOT EXISTS promo_codes (
  id                       UUID           DEFAULT uuid_generate_v4() PRIMARY KEY,
  code                     TEXT           UNIQUE NOT NULL,
  description              TEXT,
  discount_type            TEXT           NOT NULL CHECK (discount_type IN ('percentage','fixed_amount')),
  discount_value           DECIMAL(10,2)  NOT NULL,
  applies_to_plan          TEXT           CHECK (applies_to_plan IN ('pro','enterprise','any')),
  duration                 TEXT           DEFAULT 'once' CHECK (duration IN ('once','repeating','forever')),
  duration_months          INTEGER,
  max_uses                 INTEGER,
  used_count               INTEGER        DEFAULT 0,
  expires_at               TIMESTAMPTZ,
  is_active                BOOLEAN        DEFAULT TRUE,
  stripe_coupon_id         TEXT,
  stripe_promotion_code_id TEXT,
  created_by               UUID           REFERENCES profiles(user_id),
  created_at               TIMESTAMPTZ    DEFAULT NOW()
);

-- 6. Promo code usage tracking
CREATE TABLE IF NOT EXISTS promo_code_uses (
  id               UUID           DEFAULT uuid_generate_v4() PRIMARY KEY,
  promo_code_id    UUID           REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id          UUID           REFERENCES profiles(user_id) ON DELETE CASCADE,
  discount_applied DECIMAL(10,2),
  used_at          TIMESTAMPTZ    DEFAULT NOW(),
  UNIQUE(promo_code_id, user_id)
);

-- 7. Admin audit log
CREATE TABLE IF NOT EXISTS admin_logs (
  id                UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_id          UUID        REFERENCES profiles(user_id),
  admin_email       TEXT,
  action            TEXT        NOT NULL,
  target_user_id    UUID        REFERENCES profiles(user_id),
  target_user_email TEXT,
  details           JSONB       DEFAULT '{}',
  ip_address        TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Global system settings (key-value)
CREATE TABLE IF NOT EXISTS system_settings (
  key         TEXT        PRIMARY KEY,
  value       JSONB       NOT NULL,
  description TEXT,
  updated_by  UUID        REFERENCES profiles(user_id),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Dashboard announcements
CREATE TABLE IF NOT EXISTS announcements (
  id               UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  title            TEXT        NOT NULL,
  message          TEXT        NOT NULL,
  type             TEXT        DEFAULT 'info' CHECK (type IN ('info','warning','critical','maintenance')),
  is_active        BOOLEAN     DEFAULT TRUE,
  show_to_plans    TEXT[]      DEFAULT ARRAY[]::TEXT[],
  target_all_plans BOOLEAN     DEFAULT TRUE,
  link_url         TEXT,
  link_label       TEXT,
  starts_at        TIMESTAMPTZ DEFAULT NOW(),
  expires_at       TIMESTAMPTZ,
  created_by       UUID        REFERENCES profiles(user_id),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Seed feature flags
INSERT INTO feature_flags (key, name, description, enabled_for_plans) VALUES
  ('social_planner',     'Social Planner',      'Schedule posts to social platforms',   ARRAY['free','pro','enterprise']),
  ('ai_insights',        'AI Insights',          'AI-generated performance insights',    ARRAY['pro','enterprise']),
  ('automation',         'Automation Workflows', 'Build automated marketing workflows',  ARRAY['pro','enterprise']),
  ('crm_contacts',       'CRM Contacts',         'Manage leads and customers',           ARRAY['free','pro','enterprise']),
  ('analytics_advanced', 'Advanced Analytics',   'Deep analytics with chart breakdowns', ARRAY['pro','enterprise']),
  ('conversations',      'Conversations Inbox',  'Unified social DM inbox',              ARRAY['pro','enterprise']),
  ('api_access',         'API Access',           'REST API for developers',              ARRAY['enterprise']),
  ('white_label',        'White Label',          'Remove BrandFlow branding',            ARRAY['enterprise'])
ON CONFLICT (key) DO NOTHING;

-- 11. Seed system settings
INSERT INTO system_settings (key, value, description) VALUES
  ('trial_duration_days',   '14',                      'Length of free trial in days'),
  ('allow_new_signups',     'true',                    'Whether new users can register'),
  ('maintenance_mode',      'false',                   'Put site in maintenance mode'),
  ('support_email',         '"support@brandflow.io"',  'Support contact email'),
  ('max_free_social_accts', '3',                       'Max social accounts on free plan'),
  ('max_pro_social_accts',  '999',                     'Max social accounts on pro plan'),
  ('max_free_posts_month',  '30',                      'Max scheduled posts/month on free'),
  ('max_free_contacts',     '100',                     'Max CRM contacts on free plan')
ON CONFLICT (key) DO NOTHING;

-- 12. Enable RLS on all admin tables
ALTER TABLE feature_flags          ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feature_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_uses        ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements          ENABLE ROW LEVEL SECURITY;

-- 13. RLS policies
CREATE POLICY "Admin full access to feature_flags"
  ON feature_flags FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = TRUE));

CREATE POLICY "Users read active feature_flags"
  ON feature_flags FOR SELECT
  USING (is_enabled_globally = TRUE);

CREATE POLICY "Users read own feature overrides"
  ON user_feature_overrides FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admin full access to user_feature_overrides"
  ON user_feature_overrides FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = TRUE));

CREATE POLICY "Admin full access to promo_codes"
  ON promo_codes FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = TRUE));

CREATE POLICY "Admin full access to admin_logs"
  ON admin_logs FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = TRUE));

CREATE POLICY "Admin full access to system_settings"
  ON system_settings FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = TRUE));

CREATE POLICY "Users read system_settings"
  ON system_settings FOR SELECT USING (TRUE);

CREATE POLICY "Admin full access to announcements"
  ON announcements FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = TRUE));

CREATE POLICY "Users read active announcements"
  ON announcements FOR SELECT
  USING (is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW()));

-- 14. has_feature() helper function
CREATE OR REPLACE FUNCTION has_feature(p_user_id UUID, p_feature_key TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_plan     TEXT;
  v_override BOOLEAN;
  v_flag     feature_flags%ROWTYPE;
BEGIN
  SELECT plan INTO v_plan FROM profiles WHERE user_id = p_user_id;
  SELECT is_enabled INTO v_override FROM user_feature_overrides
    WHERE user_id = p_user_id AND feature_key = p_feature_key LIMIT 1;
  IF v_override IS NOT NULL THEN RETURN v_override; END IF;
  SELECT * INTO v_flag FROM feature_flags WHERE key = p_feature_key;
  IF NOT FOUND OR NOT v_flag.is_enabled_globally THEN RETURN FALSE; END IF;
  RETURN v_plan = ANY(v_flag.enabled_for_plans);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Verify: list all tables created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
