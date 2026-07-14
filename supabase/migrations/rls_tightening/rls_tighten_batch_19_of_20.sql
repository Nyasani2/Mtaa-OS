-- ============================================
-- RLS TIGHTENING BATCH 19/20
-- Tightens "always-true" SELECT/ALL policies to auth.uid() = user_col
-- Safe: wrapped in DO blocks with column existence checks
-- Run in Supabase SQL Editor
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tribe_communities' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own tribe_communities" ON public.tribe_communities;
    CREATE POLICY "tribe-communities_select-tight" ON public.tribe_communities
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tribe_community_members' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own tribe_community_members" ON public.tribe_community_members;
    CREATE POLICY "tribe-community-members_select-tight" ON public.tribe_community_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tribe_contributions' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own tribe_contributions" ON public.tribe_contributions;
    CREATE POLICY "tribe-contributions_select-tight" ON public.tribe_contributions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tribe_donations' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own tribe_donations" ON public.tribe_donations;
    CREATE POLICY "tribe-donations_select-tight" ON public.tribe_donations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tribe_event_attendees' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own tribe_event_attendees" ON public.tribe_event_attendees;
    CREATE POLICY "tribe-event-attendees_select-tight" ON public.tribe_event_attendees
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tribe_lineage' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own tribe_lineage" ON public.tribe_lineage;
    CREATE POLICY "tribe-lineage_select-tight" ON public.tribe_lineage
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tribe_live_rooms' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own tribe_live_rooms" ON public.tribe_live_rooms;
    CREATE POLICY "tribe-live-rooms_select-tight" ON public.tribe_live_rooms
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tribe_marketplace' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own tribe_marketplace" ON public.tribe_marketplace;
    CREATE POLICY "tribe-marketplace_select-tight" ON public.tribe_marketplace
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tribe_migration_routes' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own tribe_migration_routes" ON public.tribe_migration_routes;
    CREATE POLICY "tribe-migration-routes_select-tight" ON public.tribe_migration_routes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tribe_museum' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own tribe_museum" ON public.tribe_museum;
    CREATE POLICY "tribe-museum_select-tight" ON public.tribe_museum
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tribe_post_likes' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own tribe_post_likes" ON public.tribe_post_likes;
    CREATE POLICY "tribe-post-likes_select-tight" ON public.tribe_post_likes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tribe_storytelling' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own tribe_storytelling" ON public.tribe_storytelling;
    CREATE POLICY "tribe-storytelling_select-tight" ON public.tribe_storytelling
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tribe_translations' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own tribe_translations" ON public.tribe_translations;
    CREATE POLICY "tribe-translations_select-tight" ON public.tribe_translations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tribe_treasury' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own tribe_treasury" ON public.tribe_treasury;
    CREATE POLICY "tribe-treasury_select-tight" ON public.tribe_treasury
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tribe_verified_historians' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own tribe_verified_historians" ON public.tribe_verified_historians;
    CREATE POLICY "tribe-verified-historians_select-tight" ON public.tribe_verified_historians
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tribe_votes' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own tribe_votes" ON public.tribe_votes;
    CREATE POLICY "tribe-votes_select-tight" ON public.tribe_votes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'truck_assignments' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own truck_assignments" ON public.truck_assignments;
    CREATE POLICY "truck-assignments_select-tight" ON public.truck_assignments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'truck_documents' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own truck_documents" ON public.truck_documents;
    CREATE POLICY "truck-documents_select-tight" ON public.truck_documents
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'truck_loads' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own truck_loads" ON public.truck_loads;
    CREATE POLICY "truck-loads_select-tight" ON public.truck_loads
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'truck_maintenance_logs' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own truck_maintenance_logs" ON public.truck_maintenance_logs;
    CREATE POLICY "truck-maintenance-logs_select-tight" ON public.truck_maintenance_logs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'truck_trips' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own truck_trips" ON public.truck_trips;
    CREATE POLICY "truck-trips_select-tight" ON public.truck_trips
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_follows' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Read follows" ON public.user_follows;
    CREATE POLICY "user-follows_select-tight" ON public.user_follows
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_onboarding' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own user_onboarding" ON public.user_onboarding;
    CREATE POLICY "user-onboarding_select-tight" ON public.user_onboarding
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_penalties' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own user_penalties" ON public.user_penalties;
    CREATE POLICY "user-penalties_select-tight" ON public.user_penalties
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_pins' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own user_pins" ON public.user_pins;
    CREATE POLICY "user-pins_select-tight" ON public.user_pins
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_preferences' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own user_preferences" ON public.user_preferences;
    CREATE POLICY "user-preferences_select-tight" ON public.user_preferences
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_presence' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own user_presence" ON public.user_presence;
    CREATE POLICY "user-presence_select-tight" ON public.user_presence
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_settings' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own user_settings" ON public.user_settings;
    CREATE POLICY "user-settings_select-tight" ON public.user_settings
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_tribe_groups' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own user_tribe_groups" ON public.user_tribe_groups;
    CREATE POLICY "user-tribe-groups_select-tight" ON public.user_tribe_groups
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wallet_access_rules' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own wallet_access_rules" ON public.wallet_access_rules;
    CREATE POLICY "wallet-access-rules_select-tight" ON public.wallet_access_rules
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

