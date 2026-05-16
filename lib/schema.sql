-- ============================================================
-- BrandFlow — Supabase Database Schema
-- ============================================================
--
-- HOW TO RUN:
--   1. Go to https://supabase.com/dashboard/project/ycvnqrvcgwvvatzbtqrt
--   2. Click "SQL Editor" in the left sidebar
--   3. Copy THIS ENTIRE FILE and paste it into the editor
--   4. Click the green "Run" button
--
-- AFTER RUNNING:
--   1. Go to Project Settings → API (left sidebar)
--   2. Copy "Project URL" → paste as NEXT_PUBLIC_SUPABASE_URL in .env.local
--      (must be just the base URL, e.g. https://xyz.supabase.co — no /rest/v1/)
--   3. Copy "anon public" key → paste as NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
--   4. Copy "service_role secret" key → paste as SUPABASE_SERVICE_ROLE_KEY in .env.local
--   5. Restart the dev server: Ctrl+C then npm run dev
--
-- SEED DEMO DATA (after registering your account):
--   1. Go to Supabase Dashboard → Authentication → Users
--   2. Copy your user UUID
--   3. Run in SQL Editor: SELECT seed_demo_data('your-uuid-here');
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ── Profiles (extends auth.users) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id                      UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id                 UUID        REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name               TEXT,
  email                   TEXT,
  avatar_url              TEXT,
  plan                    TEXT        DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  stripe_customer_id      TEXT,
  stripe_subscription_id  TEXT,
  trial_ends_at           TIMESTAMPTZ DEFAULT NOW() + INTERVAL '14 days',
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);


-- ── Social accounts ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS social_accounts (
  id               UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id          UUID        REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  platform         TEXT        NOT NULL CHECK (platform IN ('instagram','facebook','twitter','linkedin','tiktok','youtube')),
  account_name     TEXT        NOT NULL,
  account_id       TEXT        NOT NULL,
  access_token     TEXT,
  refresh_token    TEXT,
  followers_count  INTEGER     DEFAULT 0,
  following_count  INTEGER     DEFAULT 0,
  is_active        BOOLEAN     DEFAULT TRUE,
  connected_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, platform, account_id)
);


-- ── Posts (scheduled & published) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
  id            UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id       UUID        REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  content       TEXT        NOT NULL,
  platforms     TEXT[]      DEFAULT '{}',
  media_urls    TEXT[]      DEFAULT '{}',
  status        TEXT        DEFAULT 'draft' CHECK (status IN ('draft','scheduled','published','failed')),
  scheduled_at  TIMESTAMPTZ,
  published_at  TIMESTAMPTZ,
  analytics     JSONB       DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);


-- ── Campaigns ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaigns (
  id           UUID           DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id      UUID           REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  name         TEXT           NOT NULL,
  description  TEXT,
  status       TEXT           DEFAULT 'draft' CHECK (status IN ('draft','active','paused','completed')),
  budget       DECIMAL(10,2)  DEFAULT 0,
  spent        DECIMAL(10,2)  DEFAULT 0,
  reach        INTEGER        DEFAULT 0,
  impressions  INTEGER        DEFAULT 0,
  clicks       INTEGER        DEFAULT 0,
  conversions  INTEGER        DEFAULT 0,
  ctr          DECIMAL(5,2)   DEFAULT 0,
  platforms    TEXT[]         DEFAULT '{}',
  start_date   DATE,
  end_date     DATE,
  created_at   TIMESTAMPTZ    DEFAULT NOW(),
  updated_at   TIMESTAMPTZ    DEFAULT NOW()
);


-- ── Contacts (CRM) ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contacts (
  id               UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id          UUID        REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  full_name        TEXT        NOT NULL,
  email            TEXT,
  phone            TEXT,
  company          TEXT,
  job_title        TEXT,
  avatar_url       TEXT,
  status           TEXT        DEFAULT 'lead' CHECK (status IN ('lead','prospect','customer','churned')),
  source           TEXT,
  tags             TEXT[]      DEFAULT '{}',
  notes            TEXT,
  social_profiles  JSONB       DEFAULT '{}',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);


-- ── Conversations (inbox) ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id                         UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id                    UUID        REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  contact_id                 UUID        REFERENCES contacts(id) ON DELETE SET NULL,
  platform                   TEXT        NOT NULL,
  platform_conversation_id   TEXT,
  status                     TEXT        DEFAULT 'open' CHECK (status IN ('open','resolved','archived')),
  last_message               TEXT,
  last_message_at            TIMESTAMPTZ DEFAULT NOW(),
  unread_count               INTEGER     DEFAULT 0,
  created_at                 TIMESTAMPTZ DEFAULT NOW()
);


-- ── Messages ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id                   UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id      UUID        REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  content              TEXT        NOT NULL,
  direction            TEXT        NOT NULL CHECK (direction IN ('inbound','outbound')),
  platform_message_id  TEXT,
  read_at              TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);


-- ── Analytics snapshots (daily) ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_snapshots (
  id             UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id        UUID        REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  platform       TEXT        NOT NULL,
  snapshot_date  DATE        NOT NULL,
  reach          INTEGER     DEFAULT 0,
  engagement     INTEGER     DEFAULT 0,
  impressions    INTEGER     DEFAULT 0,
  followers      INTEGER     DEFAULT 0,
  clicks         INTEGER     DEFAULT 0,
  profile_views  INTEGER     DEFAULT 0,
  data           JSONB       DEFAULT '{}',
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, platform, snapshot_date)
);


-- ── Tasks ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id            UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id       UUID        REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  title         TEXT        NOT NULL,
  due_at        TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  priority      TEXT        DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);


-- ── AI Insights ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_insights (
  id            UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id       UUID        REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  title         TEXT        NOT NULL,
  description   TEXT        NOT NULL,
  insight_type  TEXT        DEFAULT 'performance',
  action_url    TEXT,
  is_read       BOOLEAN     DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);


-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_accounts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts               ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns           ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages            ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks               ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights         ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before recreating (safe re-run)
DROP POLICY IF EXISTS "own_profile"             ON profiles;
DROP POLICY IF EXISTS "own_social"              ON social_accounts;
DROP POLICY IF EXISTS "own_posts"               ON posts;
DROP POLICY IF EXISTS "own_campaigns"           ON campaigns;
DROP POLICY IF EXISTS "own_contacts"            ON contacts;
DROP POLICY IF EXISTS "own_conversations"       ON conversations;
DROP POLICY IF EXISTS "own_tasks"               ON tasks;
DROP POLICY IF EXISTS "own_insights"            ON ai_insights;
DROP POLICY IF EXISTS "own_analytics"           ON analytics_snapshots;
DROP POLICY IF EXISTS "own_messages"            ON messages;
DROP POLICY IF EXISTS "Users see own profile"         ON profiles;
DROP POLICY IF EXISTS "Users see own social accounts" ON social_accounts;
DROP POLICY IF EXISTS "Users see own posts"           ON posts;
DROP POLICY IF EXISTS "Users see own campaigns"       ON campaigns;
DROP POLICY IF EXISTS "Users see own contacts"        ON contacts;
DROP POLICY IF EXISTS "Users see own conversations"   ON conversations;
DROP POLICY IF EXISTS "Users see own tasks"           ON tasks;
DROP POLICY IF EXISTS "Users see own insights"        ON ai_insights;

CREATE POLICY "own_profile"       ON profiles            FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_social"        ON social_accounts     FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_posts"         ON posts               FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_campaigns"     ON campaigns           FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_contacts"      ON contacts            FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_conversations" ON conversations       FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_tasks"         ON tasks               FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_insights"      ON ai_insights         FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_analytics"     ON analytics_snapshots FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_messages"      ON messages            FOR ALL
  USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );


-- ── Auto-create profile on sign-up ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ── updated_at auto-refresh ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at  ON profiles;
DROP TRIGGER IF EXISTS trg_posts_updated_at     ON posts;
DROP TRIGGER IF EXISTS trg_campaigns_updated_at ON campaigns;
DROP TRIGGER IF EXISTS trg_contacts_updated_at  ON contacts;

CREATE TRIGGER trg_profiles_updated_at  BEFORE UPDATE ON profiles  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_posts_updated_at     BEFORE UPDATE ON posts     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_contacts_updated_at  BEFORE UPDATE ON contacts  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ── Demo seed data ─────────────────────────────────────────────────────────────
-- Usage: SELECT seed_demo_data('your-user-uuid-here');
CREATE OR REPLACE FUNCTION seed_demo_data(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Tasks
  INSERT INTO tasks (user_id, title, due_at, priority) VALUES
    (p_user_id, 'Schedule Instagram campaign',   NOW() + INTERVAL '2 hours', 'urgent'),
    (p_user_id, 'Reply to 15 unread messages',   NOW() + INTERVAL '4 hours', 'high'),
    (p_user_id, 'Review new leads',              NOW() + INTERVAL '6 hours', 'high'),
    (p_user_id, 'Approve content calendar',      NOW() + INTERVAL '1 day',   'medium'),
    (p_user_id, 'Analyze campaign performance',  NOW() + INTERVAL '1 day',   'medium');

  -- Campaigns
  INSERT INTO campaigns (user_id, name, status, budget, spent, reach, ctr, platforms) VALUES
    (p_user_id, 'Summer Sale 2024',    'active',  4200,  2100, 84000,  4.2, ARRAY['instagram','facebook']),
    (p_user_id, 'Brand Awareness Q2', 'active',  8000,  5600, 240000, 2.8, ARRAY['instagram','linkedin']),
    (p_user_id, 'Product Launch',     'paused',  12000, 3200, 47000,  3.1, ARRAY['facebook','tiktok']),
    (p_user_id, 'Holiday Campaign',   'draft',   6500,  0,    0,      0,   ARRAY['instagram']);

  -- Contacts
  INSERT INTO contacts (user_id, full_name, email, company, status, tags) VALUES
    (p_user_id, 'Jane Cooper',        'jane@techcorp.com',   'TechCorp',   'customer', ARRAY['VIP','Enterprise']),
    (p_user_id, 'Brooklyn Simmons',   'brooklyn@startup.io', 'StartupIO',  'prospect', ARRAY['Warm Lead']),
    (p_user_id, 'Dianne Russell',     'dianne@design.co',    'DesignCo',   'lead',     ARRAY['New']),
    (p_user_id, 'Cameron Williamson', 'cam@agency.net',      'Agency Net', 'customer', ARRAY['Pro Plan']);

  -- Analytics snapshots (last 7 days)
  INSERT INTO analytics_snapshots (user_id, platform, snapshot_date, reach, engagement, impressions, followers, clicks) VALUES
    (p_user_id, 'instagram', CURRENT_DATE - 6, 45000, 3200, 92000,  88100, 1200),
    (p_user_id, 'instagram', CURRENT_DATE - 5, 52000, 4100, 108000, 88400, 1500),
    (p_user_id, 'instagram', CURRENT_DATE - 4, 48000, 3800, 99000,  88700, 1350),
    (p_user_id, 'instagram', CURRENT_DATE - 3, 61000, 5200, 124000, 89100, 1800),
    (p_user_id, 'instagram', CURRENT_DATE - 2, 55000, 4700, 113000, 89400, 1650),
    (p_user_id, 'instagram', CURRENT_DATE - 1, 67000, 5900, 138000, 89600, 2100),
    (p_user_id, 'instagram', CURRENT_DATE,     72000, 6100, 147000, 89700, 2300);

  -- AI Insights
  INSERT INTO ai_insights (user_id, title, description, insight_type) VALUES
    (p_user_id, 'Engagement is 24% higher than last week!',
     'Best performing channel: Instagram. Your recent reels are driving exceptional reach.',
     'performance'),
    (p_user_id, 'Best time to post: 6–8 PM weekdays',
     'Posts published between 6–8 PM receive 3× more engagement based on your last 30 days.',
     'audience'),
    (p_user_id, 'TikTok videos under 30s get 2× completions',
     'Optimize your short-form content for higher completion rates and better algorithm reach.',
     'content');
END;
$$ LANGUAGE plpgsql;
