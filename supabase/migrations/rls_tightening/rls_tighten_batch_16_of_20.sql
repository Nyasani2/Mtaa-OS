-- ============================================
-- RLS TIGHTENING BATCH 16/20
-- Tightens "always-true" SELECT/ALL policies to auth.uid() = user_col
-- Safe: wrapped in DO blocks with column existence checks
-- Run in Supabase SQL Editor
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'savings_group_contributions' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own savings_group_contributions" ON public.savings_group_contributions;
    CREATE POLICY "savings-group-contributions_select-tight" ON public.savings_group_contributions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'savings_group_members' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own savings_group_members" ON public.savings_group_members;
    CREATE POLICY "savings-group-members_select-tight" ON public.savings_group_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'savings_groups' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own savings_groups" ON public.savings_groups;
    CREATE POLICY "savings-groups_select-tight" ON public.savings_groups
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'savings_pools' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own savings_pools" ON public.savings_pools;
    CREATE POLICY "savings-pools_select-tight" ON public.savings_pools
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'shop_adjustments' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own shop_adjustments" ON public.shop_adjustments;
    CREATE POLICY "shop-adjustments_select-tight" ON public.shop_adjustments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'shop_affiliates' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own shop_affiliates" ON public.shop_affiliates;
    CREATE POLICY "shop-affiliates_select-tight" ON public.shop_affiliates
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'shop_analytics' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own shop_analytics" ON public.shop_analytics;
    CREATE POLICY "shop-analytics_select-tight" ON public.shop_analytics
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'shop_items' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own shop_items" ON public.shop_items;
    CREATE POLICY "shop-items_select-tight" ON public.shop_items
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'shop_messages' AND column_name = 'sender_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own shop_messages" ON public.shop_messages;
    CREATE POLICY "shop-messages_select-tight" ON public.shop_messages
  FOR SELECT TO authenticated
  USING (sender_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'shop_notifications' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own shop_notifications" ON public.shop_notifications;
    CREATE POLICY "shop-notifications_select-tight" ON public.shop_notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'shop_payouts' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own shop_payouts" ON public.shop_payouts;
    CREATE POLICY "shop-payouts_select-tight" ON public.shop_payouts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'shop_purchase_orders' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own shop_purchase_orders" ON public.shop_purchase_orders;
    CREATE POLICY "shop-purchase-orders_select-tight" ON public.shop_purchase_orders
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'shop_refunds' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own shop_refunds" ON public.shop_refunds;
    CREATE POLICY "shop-refunds_select-tight" ON public.shop_refunds
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'shop_returns' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own shop_returns" ON public.shop_returns;
    CREATE POLICY "shop-returns_select-tight" ON public.shop_returns
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'shop_staff' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own shop_staff" ON public.shop_staff;
    CREATE POLICY "shop-staff_select-tight" ON public.shop_staff
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'shop_staff_roles' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own shop_staff_roles" ON public.shop_staff_roles;
    CREATE POLICY "shop-staff-roles_select-tight" ON public.shop_staff_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'shop_subscriptions' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own shop_subscriptions" ON public.shop_subscriptions;
    CREATE POLICY "shop-subscriptions_select-tight" ON public.shop_subscriptions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'shop_suppliers' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own shop_suppliers" ON public.shop_suppliers;
    CREATE POLICY "shop-suppliers_select-tight" ON public.shop_suppliers
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'shop_wishlist_items' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own shop_wishlist_items" ON public.shop_wishlist_items;
    CREATE POLICY "shop-wishlist-items_select-tight" ON public.shop_wishlist_items
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'shop_wishlists' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own shop_wishlists" ON public.shop_wishlists;
    CREATE POLICY "shop-wishlists_select-tight" ON public.shop_wishlists
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'street_comments' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own street_comments" ON public.street_comments;
    CREATE POLICY "street-comments_select-tight" ON public.street_comments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'street_content' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own street_content" ON public.street_content;
    CREATE POLICY "street-content_select-tight" ON public.street_content
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'street_follows' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own street_follows" ON public.street_follows;
    CREATE POLICY "street-follows_select-tight" ON public.street_follows
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'street_likes' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own street_likes" ON public.street_likes;
    CREATE POLICY "street-likes_select-tight" ON public.street_likes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'streets_comment_likes' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Comment likes viewable" ON public.streets_comment_likes; DROP POLICY IF EXISTS "Users view own streets_comment_likes" ON public.streets_comment_likes;
    CREATE POLICY "streets-comment-likes_select-tight" ON public.streets_comment_likes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'streets_comments' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "streets_comments_all_access" ON public.streets_comments;
    CREATE POLICY "streets-comments_all-tight" ON public.streets_comments
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'streets_comments' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own streets_comments" ON public.streets_comments;
    CREATE POLICY "streets-comments_select-tight" ON public.streets_comments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'streets_earnings' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own streets_earnings" ON public.streets_earnings;
    CREATE POLICY "streets-earnings_select-tight" ON public.streets_earnings
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'streets_follows' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own streets_follows" ON public.streets_follows;
    CREATE POLICY "streets-follows_select-tight" ON public.streets_follows
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'streets_gifts' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own streets_gifts" ON public.streets_gifts;
    CREATE POLICY "streets-gifts_select-tight" ON public.streets_gifts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

