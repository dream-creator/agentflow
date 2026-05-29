-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  brokerage TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'team')),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'past_due')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- LEADS (core entity)
-- ============================================
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'csv_import', 'website', 'referral', 'open_house', 'zillow', 'other')),
  pipeline_stage TEXT NOT NULL DEFAULT 'new_lead' CHECK (pipeline_stage IN (
    'new_lead',
    'contacted',
    'showing',
    'offer',
    'closed_won',
    'closed_lost'
  )),
  notes TEXT,
  next_action TEXT,
  next_action_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- ACTIONS (follow-up tracking)
-- ============================================
CREATE TABLE actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('call', 'text', 'email', 'meeting', 'showing', 'note')),
  description TEXT,
  due_date DATE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_leads_user_id ON leads(user_id);
CREATE INDEX idx_leads_pipeline_stage ON leads(pipeline_stage);
CREATE INDEX idx_leads_next_action_date ON leads(next_action_date) WHERE is_active = true;
CREATE INDEX idx_actions_due_date ON actions(due_date) WHERE completed = false;
CREATE INDEX idx_actions_user_id ON actions(user_id);
CREATE INDEX idx_actions_lead_id ON actions(lead_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only read/update their own
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Leads: users can only CRUD their own leads
CREATE POLICY "Users can view own leads" ON leads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own leads" ON leads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own leads" ON leads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own leads" ON leads FOR DELETE USING (auth.uid() = user_id);

-- Actions: users can only CRUD their own actions
CREATE POLICY "Users can view own actions" ON actions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own actions" ON actions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own actions" ON actions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own actions" ON actions FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- FUNCTION: Auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- FUNCTION: Free tier lead limit (1 lead)
-- ============================================
CREATE OR REPLACE FUNCTION check_free_tier_lead_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_plan TEXT;
  lead_count BIGINT;
BEGIN
  SELECT plan INTO current_plan FROM profiles WHERE id = NEW.user_id;

  IF current_plan = 'free' THEN
    SELECT COUNT(*) INTO lead_count FROM leads WHERE user_id = NEW.user_id AND is_active = true;

    IF lead_count >= 1 THEN
      RAISE EXCEPTION 'Free tier limited to 1 active lead. Upgrade to Pro for unlimited.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER enforce_free_tier_limit
  BEFORE INSERT ON leads
  FOR EACH ROW EXECUTE FUNCTION check_free_tier_lead_limit();
