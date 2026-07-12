-- Fix follows table: add missing relationship columns
-- First, check if columns already exist (safe migration)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'follows' AND column_name = 'follower_id') THEN
        ALTER TABLE follows ADD COLUMN follower_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'follows' AND column_name = 'following_id') THEN
        ALTER TABLE follows ADD COLUMN following_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'follows' AND column_name = 'status') THEN
        ALTER TABLE follows ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
END $$;

-- Add unique constraint to prevent duplicate follows
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'follows_unique_follow'
    ) THEN
        ALTER TABLE follows ADD CONSTRAINT follows_unique_follow 
        UNIQUE (follower_id, following_id);
    END IF;
END $$;

-- Update RLS policies for follows
DROP POLICY IF EXISTS follows_select ON follows;
DROP POLICY IF EXISTS follows_insert ON follows;
DROP POLICY IF EXISTS follows_delete ON follows;
DROP POLICY IF EXISTS follows_update ON follows;

CREATE POLICY follows_select ON follows
    FOR SELECT USING (
        follower_id = auth.uid() OR following_id = auth.uid()
    );

CREATE POLICY follows_insert ON follows
    FOR INSERT WITH CHECK (follower_id = auth.uid());

CREATE POLICY follows_delete ON follows
    FOR DELETE USING (follower_id = auth.uid());

CREATE POLICY follows_update ON follows
    FOR UPDATE USING (follower_id = auth.uid());
