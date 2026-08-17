-- FIX 1: Make the trigger function run with elevated privileges
-- This makes it bypass RLS on any tables it touches (like user_roles)
ALTER FUNCTION copy_default_categories() SECURITY DEFINER;

-- FIX 2 (alternative): If the above doesn't work, disable the trigger temporarily
-- to test if it's the cause:
-- ALTER TABLE shops DISABLE TRIGGER trg_copy_defaults;

-- FIX 3 (nuclear): Drop the trigger entirely if it's not needed
-- DROP TRIGGER IF EXISTS trg_copy_defaults ON shops;
