import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

interface Achievement { type: string; title: string; desc: string; icon: string; color: string; earned: boolean; earnedAt: string | null; progress: number; }

const ACHIEVEMENT_DEFS = [
  { type: 'first_post', title: 'First Post', desc: 'Published your first post', icon: 'create-outline', color: '#00d4ff' },
  { type: 'first_follower', title: 'First Follower', desc: 'Gained your first follower', icon: 'person-add-outline', color: '#00ff88' },
  { type: 'verified', title: 'Verified', desc: 'Identity verified', icon: 'shield-checkmark-outline', color: '#00d4ff' },
  { type: 'creator', title: 'Creator', desc: 'Became a content creator', icon: 'sparkles-outline', color: '#ff00ff' },
  { type: 'business', title: 'Business Owner', desc: 'Registered a business', icon: 'business-outline', color: '#ffaa00' },
  { type: 'top_rated', title: 'Top Rated', desc: 'Achieved 4.5+ rating', icon: 'star-outline', color: '#ffaa00' },
  { type: 'early_adopter', title: 'Early Adopter', desc: 'Joined during early access', icon: 'rocket-outline', color: '#ff4444' },
  { type: 'influencer', title: 'Influencer', desc: 'Reached 1,000+ followers', icon: 'trending-up-outline', color: '#ff00ff' },
  { type: 'power_user', title: 'Power User', desc: 'High engagement across modules', icon: 'flash-outline', color: '#ffaa00' },
  { type: 'community_builder', title: 'Community Builder', desc: 'Built a strong following', icon: 'people-outline', color: '#00ff88' },
  { type: 'content_creator', title: 'Content Creator', desc: 'Created 50+ pieces of content', icon: 'film-outline', color: '#00d4ff' },
  { type: 'cashpoint_agent', title: 'CashPoint Agent', desc: 'Became a CashPoint agent', icon: 'storefront-outline', color: '#00d4ff' },
  { type: 'wallet_user', title: 'Wallet Active', desc: 'Made 10+ wallet transactions', icon: 'wallet-outline', color: '#00ff88' },
  { type: 'marketplace_seller', title: 'Marketplace Seller', desc: 'Sold 5+ items', icon: 'cart-outline', color: '#ffaa00' },
];

async function withTimeout<T>(promise: Promise<T>, fallback: T, ms = 4000): Promise<T> {
  return Promise.race([promise.catch(() => fallback), new Promise<T>(r => setTimeout(() => r(fallback), ms))]);
}

export default function AchievementsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ earned: 0, total: ACHIEVEMENT_DEFS.length, points: 0 });

  const loadAchievements = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    setLoading(true);
    try {
      const safeQuery = async <T,>(builder: any, fallback: T): Promise<T> => withTimeout(builder.then((r: any) => r.data ?? r.count ?? fallback).catch(() => fallback), fallback, 3500);
      const [posts, followers, profile, content, agent, trust, walletTxs, marketplaceSales, followerCount, postCount, contentCount] = await Promise.all([
        safeQuery(supabase.from('streets_posts').select('id, created_at').eq('creator_id', user.id).limit(1), []),
        safeQuery(supabase.from('user_follows').select('id, created_at').eq('following_id', user.id).limit(1), []),
        safeQuery(supabase.from('user_profiles').select('is_verified, created_at, trust_score').eq('user_id', user.id).single(), null),
        safeQuery(supabase.from('content').select('id').eq('user_id', user.id).limit(1), []),
        safeQuery(supabase.from('cashpoint_agents').select('id, created_at').eq('user_id', user.id).single(), null),
        safeQuery(supabase.from('marketplace_trust').select('rating').eq('user_id', user.id).gte('rating', 4.5).limit(1), []),
        safeQuery(supabase.from('wallet_transactions').select('id').eq('user_id', user.id).limit(10), []),
        safeQuery(supabase.from('marketplace_orders').select('id').eq('seller_id', user.id).eq('status', 'completed').limit(5), []),
        safeQuery(supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('following_id', user.id), 0),
        safeQuery(supabase.from('streets_posts').select('*', { count: 'exact', head: true }).eq('creator_id', user.id), 0),
        safeQuery(supabase.from('content').select('*', { count: 'exact', head: true }).eq('user_id', user.id), 0),
      ]);
      const earlyAdopterCutoff = new Date('2025-06-01');
      const computed: Achievement[] = ACHIEVEMENT_DEFS.map((def: any) => {
        let earned = false, earnedAt: string | null = null, progress = 0;
        switch (def.type) {
          case 'first_post': earned = (posts && posts.length > 0) || false; earnedAt = (posts as any[])?.[0]?.created_at || null; progress = earned ? 100 : 0; break;
          case 'first_follower': earned = (followers && followers.length > 0) || false; earnedAt = (followers as any[])?.[0]?.created_at || null; progress = earned ? 100 : 0; break;
          case 'verified': earned = (profile as any)?.is_verified || false; earnedAt = (profile as any)?.created_at || null; progress = earned ? 100 : 0; break;
          case 'creator': earned = (content && content.length > 0) || (postCount || 0) > 0; earnedAt = (content as any[])?.[0]?.created_at || (posts as any[])?.[0]?.created_at || null; progress = earned ? 100 : Math.min(100, ((contentCount || 0) + (postCount || 0)) * 20); break;
          case 'business': earned = !!agent; earnedAt = (agent as any)?.created_at || null; progress = earned ? 100 : 0; break;
          case 'top_rated': earned = ((trust as any[]) && (trust as any[]).length > 0) || ((profile as any)?.trust_score || 0) >= 90; progress = Math.min(100, ((profile as any)?.trust_score || 0)); break;
          case 'early_adopter': earned = (profile as any)?.created_at ? new Date((profile as any)?.created_at) < earlyAdopterCutoff : false; earnedAt = (profile as any)?.created_at || null; progress = earned ? 100 : 0; break;
          case 'influencer': earned = (followerCount || 0) >= 1000; progress = Math.min(100, ((followerCount || 0) / 1000) * 100); break;
          case 'power_user': { const engagement = (followerCount || 0) + (postCount || 0) + (contentCount || 0) + (walletTxs?.length || 0); earned = engagement >= 100; progress = Math.min(100, engagement); break; }
          case 'community_builder': earned = (followerCount || 0) >= 500; progress = Math.min(100, ((followerCount || 0) / 500) * 100); break;
          case 'content_creator': earned = (postCount || 0) >= 50 || (contentCount || 0) >= 50; progress = Math.min(100, (((postCount || 0) + (contentCount || 0)) / 50) * 100); break;
          case 'cashpoint_agent': earned = !!agent; earnedAt = (agent as any)?.created_at || null; progress = earned ? 100 : 0; break;
          case 'wallet_user': earned = (walletTxs?.length || 0) >= 10; progress = Math.min(100, ((walletTxs?.length || 0) / 10) * 100); break;
          case 'marketplace_seller': earned = (marketplaceSales?.length || 0) >= 5; progress = Math.min(100, ((marketplaceSales?.length || 0) / 5) * 100); break;
        }
        return { ...def, earned, earnedAt, progress };
      });
      const earnedCount = computed.filter((a: any) => a.earned).length;
      const points = earnedCount * 100 + computed.reduce((sum, a) => sum + (a.earned ? Math.round(a.progress / 10) : 0), 0);
      setAchievements(computed); setStats({ earned: earnedCount, total: ACHIEVEMENT_DEFS.length, points });
    } catch (err) { console.error('Achievements load error:', err); }
    finally { setLoading(false); setRefreshing(false); }
  }, [user?.id]);

  useEffect(() => { loadAchievements(); }, [loadAchievements]);
  const onRefresh = () => { setRefreshing(true); loadAchievements(); };
  const shareAchievements = async () => { await Share.share({ message: `I have earned ${stats.earned}/${stats.total} achievements on MTAA! 🏆 Total Points: ${stats.points}` }); };
  const formatDate = (dateStr: string | null) => { if (!dateStr) return ''; return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); };

  if (loading) return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color="#00d4ff" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Achievements</Text>
        <TouchableOpacity onPress={shareAchievements}><Ionicons name="share-outline" size={22} color="#00d4ff" /></TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00d4ff" />}>
        <View style={styles.statsCard}>
          <View style={styles.statItem}><Text style={styles.statNumber}>{stats.earned}</Text><Text style={styles.statLabel}>Earned</Text></View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}><Text style={styles.statNumber}>{stats.total}</Text><Text style={styles.statLabel}>Total</Text></View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}><Text style={styles.statNumber}>{stats.points}</Text><Text style={styles.statLabel}>Points</Text></View>
        </View>
        <View style={styles.progressSection}>
          <View style={styles.progressBarBg}><View style={[styles.progressBarFill, { width: `${(stats.earned / stats.total) * 100}%` }]} /></View>
          <Text style={styles.progressText}>{Math.round((stats.earned / stats.total) * 100)}% Complete</Text>
        </View>
        <Text style={styles.sectionTitle}>All Achievements</Text>
        {achievements.map((ach: any) => (
          <View key={ach.type} style={[styles.achievementCard, ach.earned && styles.earnedCard]}>
            <View style={[styles.achievementIcon, { backgroundColor: ach.earned ? ach.color + '22' : '#1a1a1a' }]}>
              <Ionicons name={ach.icon as any} size={24} color={ach.earned ? ach.color : '#444'} />
            </View>
            <View style={styles.achievementInfo}>
              <Text style={[styles.achievementTitle, !ach.earned && styles.lockedTitle]}>{ach.title}</Text>
              <Text style={styles.achievementDesc}>{ach.desc}</Text>
              {ach.earned && ach.earnedAt && <Text style={styles.earnedDate}>Earned {formatDate(ach.earnedAt)}</Text>}
              {!ach.earned && ach.progress > 0 && <View style={styles.miniProgress}><View style={[styles.miniProgressFill, { width: `${ach.progress}%`, backgroundColor: ach.color }]} /><Text style={styles.miniProgressText}>{Math.round(ach.progress)}%</Text></View>}
            </View>
            {ach.earned ? <View style={styles.earnedBadge}><Ionicons name="checkmark-circle" size={22} color={ach.color} /></View> : <Ionicons name="lock-closed" size={18} color="#333" />}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  statsCard: { flexDirection: 'row', margin: 16, backgroundColor: '#111', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#1a1a1a' },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: '#1a1a1a' },
  statNumber: { color: '#00d4ff', fontSize: 28, fontWeight: '800' },
  statLabel: { color: '#888', fontSize: 12, marginTop: 4 },
  progressSection: { paddingHorizontal: 16, marginBottom: 16 },
  progressBarBg: { height: 8, backgroundColor: '#1a1a1a', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#00d4ff', borderRadius: 4 },
  progressText: { color: '#888', fontSize: 12, marginTop: 6, textAlign: 'center' },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginHorizontal: 16, marginBottom: 12 },
  achievementCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', marginHorizontal: 16, marginBottom: 8, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#1a1a1a' },
  earnedCard: { borderColor: '#00d4ff33', backgroundColor: '#00d4ff08' },
  achievementIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  achievementInfo: { flex: 1 },
  achievementTitle: { color: '#fff', fontSize: 14, fontWeight: '600' },
  lockedTitle: { color: '#555' },
  achievementDesc: { color: '#888', fontSize: 12, marginTop: 2 },
  earnedDate: { color: '#00d4ff', fontSize: 11, marginTop: 3 },
  earnedBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#00d4ff11', justifyContent: 'center', alignItems: 'center' },
  miniProgress: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 },
  miniProgressFill: { height: 4, borderRadius: 2, flex: 1 },
  miniProgressText: { color: '#666', fontSize: 10 },
});
