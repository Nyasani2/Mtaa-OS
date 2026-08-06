-- MTAA OS V10 — Family & Child Account System
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS family_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('parent', 'guardian', 'child', 'dependent')),
  is_primary BOOLEAN DEFAULT false,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(family_id, user_id)
);

CREATE TABLE IF NOT EXISTS child_sub_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  date_of_birth DATE,
  avatar_url TEXT,
  pin_code TEXT,
  is_active BOOLEAN DEFAULT true,
  spending_limit NUMERIC(12,2),
  permissions JSONB DEFAULT '{
    "can_post": false,
    "can_comment": false,
    "can_purchase": false,
    "can_message": false,
    "can_join_tribes": false,
    "education_access": true,
    "streets_access": false,
    "studio_access": false
  }',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_sub_accounts ENABLE ROW LEVEL SECURITY;

-- Family Groups RLS
CREATE POLICY "Users can view their family groups"
  ON family_groups FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Users can create family groups"
  ON family_groups FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their family groups"
  ON family_groups FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete their family groups"
  ON family_groups FOR DELETE USING (auth.uid() = created_by);

-- Family Members RLS
CREATE POLICY "Family members visible to family"
  ON family_members FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM family_members fm WHERE fm.family_id = family_members.family_id
  ));
CREATE POLICY "Parents can add family members"
  ON family_members FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT user_id FROM family_members WHERE family_id = family_members.family_id AND role IN ('parent', 'guardian')
  ));
CREATE POLICY "Parents can update family members"
  ON family_members FOR UPDATE
  USING (auth.uid() IN (
    SELECT user_id FROM family_members WHERE family_id = family_members.family_id AND role IN ('parent', 'guardian')
  ));
CREATE POLICY "Parents can remove family members"
  ON family_members FOR DELETE
  USING (auth.uid() IN (
    SELECT user_id FROM family_members WHERE family_id = family_members.family_id AND role IN ('parent', 'guardian')
  ));

-- Child Sub-Accounts RLS
CREATE POLICY "Parents can manage child accounts"
  ON child_sub_accounts FOR ALL USING (auth.uid() = parent_id);

-- Functions
CREATE OR REPLACE FUNCTION create_child_sub_account(
  p_parent_id UUID, p_family_id UUID, p_display_name TEXT,
  p_date_of_birth DATE DEFAULT NULL, p_pin_code TEXT DEFAULT NULL, p_permissions JSONB DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_child_id UUID;
BEGIN
  INSERT INTO child_sub_accounts (family_id, parent_id, display_name, date_of_birth, pin_code, permissions)
  VALUES (p_family_id, p_parent_id, p_display_name, p_date_of_birth, p_pin_code,
    COALESCE(p_permissions, '{"can_post":false,"can_comment":false,"can_purchase":false,"can_message":false,"can_join_tribes":false,"education_access":true,"streets_access":false,"studio_access":false}'::jsonb))
  RETURNING id INTO v_child_id;
  RETURN v_child_id;
END; $$;

CREATE OR REPLACE FUNCTION get_family_members(p_user_id UUID)
RETURNS TABLE (family_id UUID, member_user_id UUID, member_role TEXT, member_name TEXT, member_avatar TEXT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY SELECT fm.family_id, fm.user_id, fm.role, up.full_name, up.avatar_url
  FROM family_members fm JOIN user_profiles up ON up.id = fm.user_id
  WHERE fm.family_id IN (SELECT family_id FROM family_members WHERE user_id = p_user_id);
END; $$;

CREATE OR REPLACE FUNCTION get_child_sub_accounts(p_parent_id UUID)
RETURNS SETOF child_sub_accounts LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN RETURN QUERY SELECT * FROM child_sub_accounts WHERE parent_id = p_parent_id AND is_active = true ORDER BY display_name;
END; $$;

-- Triggers
CREATE OR REPLACE FUNCTION update_family_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS family_groups_updated ON family_groups;
CREATE TRIGGER family_groups_updated BEFORE UPDATE ON family_groups FOR EACH ROW EXECUTE FUNCTION update_family_updated_at();
DROP TRIGGER IF EXISTS family_members_updated ON family_members;
CREATE TRIGGER family_members_updated BEFORE UPDATE ON family_members FOR EACH ROW EXECUTE FUNCTION update_family_updated_at();
DROP TRIGGER IF EXISTS child_sub_accounts_updated ON child_sub_accounts;
CREATE TRIGGER child_sub_accounts_updated BEFORE UPDATE ON child_sub_accounts FOR EACH ROW EXECUTE FUNCTION update_family_updated_at();

-- Verify
SELECT 'family_groups' as table_name, COUNT(*) as count FROM family_groups
UNION ALL SELECT 'family_members', COUNT(*) FROM family_members
UNION ALL SELECT 'child_sub_accounts', COUNT(*) FROM child_sub_accounts;
