-- ============================================
-- STREETS SCHEMA FK FIX
-- ============================================
-- Problem: streets_posts.creator_id FK references user_profiles.user_id
--          but user_profiles has no 'id' column, no 'full_name', no 'verified'
--          profiles table has id, full_name, username, verified, avatar_url, bio
-- Solution: Change all FKs to reference profiles.id
-- ============================================

-- 1. Fix streets_posts.creator_id FK
ALTER TABLE streets_posts 
DROP CONSTRAINT IF EXISTS streets_posts_creator_id_fkey;

ALTER TABLE streets_posts
ADD CONSTRAINT streets_posts_creator_id_fkey
FOREIGN KEY (creator_id) REFERENCES profiles(id)
ON DELETE CASCADE;

-- 2. Fix streets_comments.user_id FK
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'streets_comments_user_id_fkey' 
        AND table_name = 'streets_comments'
    ) THEN
        ALTER TABLE streets_comments DROP CONSTRAINT streets_comments_user_id_fkey;
    END IF;
END $$;

ALTER TABLE streets_comments
ADD CONSTRAINT streets_comments_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id)
ON DELETE CASCADE;

-- 3. Fix streets_follows FKs
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'streets_follows_follower_id_fkey' AND table_name = 'streets_follows') THEN
        ALTER TABLE streets_follows DROP CONSTRAINT streets_follows_follower_id_fkey;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'streets_follows_following_id_fkey' AND table_name = 'streets_follows') THEN
        ALTER TABLE streets_follows DROP CONSTRAINT streets_follows_following_id_fkey;
    END IF;
END $$;

ALTER TABLE streets_follows
ADD CONSTRAINT streets_follows_follower_id_fkey
FOREIGN KEY (follower_id) REFERENCES profiles(id)
ON DELETE CASCADE;

ALTER TABLE streets_follows
ADD CONSTRAINT streets_follows_following_id_fkey
FOREIGN KEY (following_id) REFERENCES profiles(id)
ON DELETE CASCADE;

-- 4. Fix streets_likes.user_id FK
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'streets_likes_user_id_fkey' AND table_name = 'streets_likes') THEN
        ALTER TABLE streets_likes DROP CONSTRAINT streets_likes_user_id_fkey;
    END IF;
END $$;

ALTER TABLE streets_likes
ADD CONSTRAINT streets_likes_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id)
ON DELETE CASCADE;

-- 5. Fix streets_saves.user_id FK
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'streets_saves_user_id_fkey' AND table_name = 'streets_saves') THEN
        ALTER TABLE streets_saves DROP CONSTRAINT streets_saves_user_id_fkey;
    END IF;
END $$;

ALTER TABLE streets_saves
ADD CONSTRAINT streets_saves_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id)
ON DELETE CASCADE;

-- 6. Fix streets_shares.user_id FK
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'streets_shares_user_id_fkey' AND table_name = 'streets_shares') THEN
        ALTER TABLE streets_shares DROP CONSTRAINT streets_shares_user_id_fkey;
    END IF;
END $$;

ALTER TABLE streets_shares
ADD CONSTRAINT streets_shares_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id)
ON DELETE CASCADE;

-- 7. Fix streets_messages FKs
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'streets_messages_sender_id_fkey' AND table_name = 'streets_messages') THEN
        ALTER TABLE streets_messages DROP CONSTRAINT streets_messages_sender_id_fkey;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'streets_messages_receiver_id_fkey' AND table_name = 'streets_messages') THEN
        ALTER TABLE streets_messages DROP CONSTRAINT streets_messages_receiver_id_fkey;
    END IF;
END $$;

ALTER TABLE streets_messages
ADD CONSTRAINT streets_messages_sender_id_fkey
FOREIGN KEY (sender_id) REFERENCES profiles(id)
ON DELETE CASCADE;

ALTER TABLE streets_messages
ADD CONSTRAINT streets_messages_receiver_id_fkey
FOREIGN KEY (receiver_id) REFERENCES profiles(id)
ON DELETE CASCADE;

-- ============================================
-- VERIFY
-- ============================================
SELECT 
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name LIKE 'streets_%'
ORDER BY tc.table_name;
