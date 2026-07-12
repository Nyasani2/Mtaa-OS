-- Fix RLS policies for wallet_accounts
DROP POLICY IF EXISTS wallet_accounts_user_isolation ON wallet_accounts;

CREATE POLICY wallet_accounts_user_isolation ON wallet_accounts
    FOR ALL USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Fix RLS policies for user_home_settings  
DROP POLICY IF EXISTS home_settings_own ON user_home_settings;

CREATE POLICY home_settings_own ON user_home_settings
    FOR ALL USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Ensure wallet_accounts has a default account for every user
-- This is a seed/upsert to prevent 406 when querying
INSERT INTO wallet_accounts (user_id, wallet_id, account_type, currency, balance, available_balance, hold_balance, status, is_default)
SELECT 
    p.id,
    gen_random_uuid(),
    'main',
    'KES',
    0,
    0,
    0,
    'active',
    true
FROM user_profiles p
LEFT JOIN wallet_accounts wa ON wa.user_id = p.id
WHERE wa.id IS NULL;

-- Ensure user_home_settings has a default row for every user
INSERT INTO user_home_settings (user_id, wallpaper_url, wallpaper_type, blur_strength, theme, show_dock, dock_apps)
SELECT 
    p.id,
    null,
    'solid',
    0,
    'dark',
    true,
    '[]'::jsonb
FROM user_profiles p
LEFT JOIN user_home_settings uhs ON uhs.user_id = p.id
WHERE uhs.id IS NULL;
