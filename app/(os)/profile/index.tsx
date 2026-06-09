import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  useProfile,
  useProfileRoles,
  useProfileVerifications,
  useProfileReputation,
  useProfileAchievements,
  useProfilePortfolio,
  useProfileAnalytics,
  useBusiness,
} from '@/lib/profile';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function ProfileHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, isLoading: profileLoading, refreshProfile } = useProfile();
  const { roles } = useProfileRoles();
  const { verifications } = useProfileVerifications();
  const { reputation } = useProfileReputation();
  const { achievements } = useProfileAchievements();
  const { portfolios } = useProfilePortfolio();
  const { analytics } = useProfileAnalytics();
  const { businesses } = useBusiness();
  const { balance } = useWallet();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  }, [refreshProfile]);

  // --- Helpers ---
  const getKycProgress = () => {
    if (!verifications?.length) return 0;
    const approved = verifications.filter((v) => v.status === 'approved').length;
    return Math.round((approved / verifications.length) * 100);
  };

  const getVerificationLevelLabel = () => {
    const approved = verifications?.filter((v) => v.status === 'approved').length || 0;
    if (approved >= 5) return 'Fully Verified';
    if (approved >= 3) return 'Level 3';
    if (approved >= 2) return 'Level 2';
    if (approved >= 1) return 'Level 1';
    return 'Unverified';
  };

  const getTrustColor = (score: number) => {
    if (score >= 80) return '#22c55e';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const kycProgress = getKycProgress();
  const trustScore = reputation?.trust_score || profile?.trust_score || 50;
  const trustColor = getTrustColor(trustScore);

  // --- Loading State ---
  if (profileLoading && !profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  // --- Empty State ---
  if (!profile) {
    return (
      <View style={styles.center}>
        <Ionicons name="person-circle-outline" size={64} color="#9ca3af" />
        <Text style={styles.emptyTitle}>No Profile Found</Text>
        <Text style={styles.emptySubtitle}>Complete your profile to unlock all features.</Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/(os)/profile/edit')}
        >
          <Text style={styles.primaryButtonText}>Create Profile</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* ===== COVER + HEADER ===== */}
      <View style={styles.coverContainer}>
        <Image
          source={{ uri: profile.cover_photo_url || 'https://images.unsplash.com/photo-1557683316-973673baf926?w=800' }}
          style={styles.coverImage}
        />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.coverOverlay} />

        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => router.push('/(os)/profile/settings')} style={styles.iconButton}>
            <Ionicons name="settings-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(os)/profile/qr')} style={styles.iconButton}>
            <Ionicons name="qr-code-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(os)/profile/share')} style={styles.iconButton}>
            <Ionicons name="share-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.avatarRow}>
          <Image
            source={{ uri: profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200' }}
            style={styles.avatar}
          />
          <View style={styles.nameColumn}>
            <Text style={styles.displayName}>{profile.display_name || profile.full_name || 'Your Name'}</Text>
            <Text style={styles.username}>@{profile.username || 'username'}</Text>
            <View style={styles.badgeRow}>
              {profile.is_verified && (
                <View style={[styles.badge, { backgroundColor: '#dbeafe' }]}>
                  <Ionicons name="checkmark-circle" size={12} color="#2563eb" />
                  <Text style={[styles.badgeText, { color: '#2563eb' }]}>Verified</Text>
                </View>
              )}
              {roles?.map((r) => (
                <View key={r.role} style={[styles.badge, { backgroundColor: '#f3e8ff' }]}>
                  <Text style={[styles.badgeText, { color: '#7c3aed' }]}>{r.role}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* ===== TRUST SCORE CARD ===== */}
      <AnimatedPressable entering={FadeInUp.delay(100)} style={styles.card} onPress={() => router.push('/(os)/profile/reputation')}>
        <View style={styles.cardHeader}>
          <Ionicons name="shield-checkmark" size={20} color={trustColor} />
          <Text style={styles.cardTitle}>Trust Score</Text>
          <Text style={[styles.scoreValue, { color: trustColor }]}>{trustScore}</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${trustScore}%`, backgroundColor: trustColor }]} />
        </View>
        <Text style={styles.cardSubtitle}>{getVerificationLevelLabel()} · {kycProgress}% KYC Complete</Text>
      </AnimatedPressable>

      {/* ===== QUICK STATS ROW ===== */}
      <Animated.View entering={FadeInUp.delay(150)} style={styles.statsRow}>
        <TouchableOpacity style={styles.statBox} onPress={() => router.push('/(os)/profile/network')}>
          <Text style={styles.statNumber}>{analytics?.total_followers || 0}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statBox} onPress={() => router.push('/(os)/profile/network')}>
          <Text style={styles.statNumber}>{analytics?.total_following || 0}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statBox} onPress={() => router.push('/(os)/profile/portfolio')}>
          <Text style={styles.statNumber}>{portfolios?.length || 0}</Text>
          <Text style={styles.statLabel}>Projects</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statBox} onPress={() => router.push('/(os)/profile/achievements')}>
          <Text style={styles.statNumber}>{achievements?.length || 0}</Text>
          <Text style={styles.statLabel}>Badges</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ===== WALLET QUICK LINK ===== */}
      <AnimatedPressable entering={FadeInUp.delay(200)} style={styles.card} onPress={() => router.push('/(os)/wallet')}>
        <View style={styles.cardHeader}>
          <Ionicons name="wallet-outline" size={20} color="#6366f1" />
          <Text style={styles.cardTitle}>Wallet</Text>
          <Text style={styles.cardAction}>Open →</Text>
        </View>
        <Text style={styles.walletBalance}>KES {balance?.toLocaleString() || '0.00'}</Text>
        <Text style={styles.cardSubtitle}>Available Balance</Text>
      </AnimatedPressable>

      {/* ===== MY BUSINESSES ===== */}
      <AnimatedPressable entering={FadeInUp.delay(250)} style={styles.card} onPress={() => router.push('/(os)/profile/businesses')}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="storefront-outline" size={20} color="#059669" />
          <Text style={styles.cardTitle}>My Businesses</Text>
          <Text style={styles.cardAction}>Manage →</Text>
        </View>
        {businesses && businesses.length > 0 ? (
          businesses.slice(0, 2).map((b) => (
            <View key={b.id} style={styles.businessRow}>
              <View style={[styles.statusDot, { backgroundColor: b.status === 'active' ? '#22c55e' : '#f59e0b' }]} />
              <Text style={styles.businessName}>{b.name}</Text>
              <Text style={styles.businessType}>{b.business_type}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.cardSubtitle}>No businesses yet. Create one to start selling.</Text>
        )}
        <TouchableOpacity style={styles.inlineButton} onPress={() => router.push('/(os)/profile/businesses/create')}>
          <Ionicons name="add-circle" size={16} color="#6366f1" />
          <Text style={styles.inlineButtonText}>Add Business</Text>
        </TouchableOpacity>
      </AnimatedPressable>

      {/* ===== PORTFOLIO SUMMARY ===== */}
      <AnimatedPressable entering={FadeInUp.delay(300)} style={styles.card} onPress={() => router.push('/(os)/profile/portfolio')}>
        <View style={styles.cardHeader}>
          <Ionicons name="briefcase-outline" size={20} color="#7c3aed" />
          <Text style={styles.cardTitle}>Portfolio</Text>
          <Text style={styles.cardAction}>View All →</Text>
        </View>
        {portfolios && portfolios.length > 0 ? (
          portfolios.slice(0, 2).map((p) => (
            <View key={p.id} style={styles.portfolioRow}>
              <Text style={styles.portfolioTitle}>{p.title}</Text>
              <Text style={styles.portfolioType}>{p.portfolio_type}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.cardSubtitle}>No portfolio items yet. Showcase your work.</Text>
        )}
        <TouchableOpacity style={styles.inlineButton} onPress={() => router.push('/(os)/profile/portfolio/create')}>
          <Ionicons name="add-circle" size={16} color="#6366f1" />
          <Text style={styles.inlineButtonText}>Add Portfolio Item</Text>
        </TouchableOpacity>
      </AnimatedPressable>

      {/* ===== ACHIEVEMENTS ===== */}
      <AnimatedPressable entering={FadeInUp.delay(350)} style={styles.card} onPress={() => router.push('/(os)/profile/achievements')}>
        <View style={styles.cardHeader}>
          <Ionicons name="trophy-outline" size={20} color="#d97706" />
          <Text style={styles.cardTitle}>Achievements</Text>
          <Text style={styles.cardAction}>View All →</Text>
        </View>
        {achievements && achievements.length > 0 ? (
          <View style={styles.achievementRow}>
            {achievements.slice(0, 4).map((a) => (
              <View key={a.id} style={styles.achievementBadge}>
                <Ionicons name="medal" size={24} color="#d97706" />
                <Text style={styles.achievementText} numberOfLines={1}>{a.title}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.cardSubtitle}>No achievements yet. Complete verifications to earn badges.</Text>
        )}
      </AnimatedPressable>

      {/* ===== SERVICES & COMMUNITY ===== */}
      <AnimatedPressable entering={FadeInUp.delay(400)} style={styles.card} onPress={() => router.push('/(os)/profile/services')}>
        <View style={styles.cardHeader}>
          <FontAwesome5 name="tools" size={18} color="#0891b2" />
          <Text style={styles.cardTitle}>My Services</Text>
          <Text style={styles.cardAction}>Manage →</Text>
        </View>
        <Text style={styles.cardSubtitle}>List your services, set pricing, and get booked.</Text>
      </AnimatedPressable>

      <AnimatedPressable entering={FadeInUp.delay(450)} style={styles.card} onPress={() => router.push('/(os)/streets')}>
        <View style={styles.cardHeader}>
          <Ionicons name="people-outline" size={20} color="#db2777" />
          <Text style={styles.cardTitle}>My Communities</Text>
          <Text style={styles.cardAction}>Open →</Text>
        </View>
        <Text style={styles.cardSubtitle}>Tribes, groups, and associations you belong to.</Text>
      </AnimatedPressable>

      {/* ===== ANALYTICS CENTER ===== */}
      <AnimatedPressable entering={FadeInUp.delay(500)} style={styles.card} onPress={() => router.push('/(os)/profile/analytics')}>
        <View style={styles.cardHeader}>
          <Ionicons name="bar-chart-outline" size={20} color="#7c3aed" />
          <Text style={styles.cardTitle}>Analytics Center</Text>
          <Text style={styles.cardAction}>View →</Text>
        </View>
        <View style={styles.analyticsRow}>
          <View style={styles.analyticsItem}>
            <Text style={styles.analyticsNumber}>{analytics?.total_views || 0}</Text>
            <Text style={styles.analyticsLabel}>Profile Views</Text>
          </View>
          <View style={styles.analyticsItem}>
            <Text style={styles.analyticsNumber}>{analytics?.total_leads || 0}</Text>
            <Text style={styles.analyticsLabel}>Leads</Text>
          </View>
          <View style={styles.analyticsItem}>
            <Text style={styles.analyticsNumber}>{analytics?.total_revenue || 0}</Text>
            <Text style={styles.analyticsLabel}>Revenue</Text>
          </View>
        </View>
      </AnimatedPressable>

      {/* ===== EDIT PROFILE CTA ===== */}
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => router.push('/(os)/profile/edit')}
      >
        <Ionicons name="create-outline" size={18} color="#fff" />
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, color: '#64748b', fontSize: 14 },
  emptyTitle: { marginTop: 16, fontSize: 18, fontWeight: '700', color: '#1e293b' },
  emptySubtitle: { marginTop: 4, fontSize: 14, color: '#64748b', textAlign: 'center' },
  primaryButton: { marginTop: 20, backgroundColor: '#6366f1', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  primaryButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  // Cover
  coverContainer: { position: 'relative', height: 220 },
  coverImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  coverOverlay: { ...StyleSheet.absoluteFillObject },
  headerActions: { position: 'absolute', top: 48, right: 16, flexDirection: 'row', gap: 8 },
  iconButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },

  // Avatar
  avatarRow: { position: 'absolute', bottom: 16, left: 16, flexDirection: 'row', alignItems: 'flex-end' },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: '#fff' },
  nameColumn: { marginLeft: 12, marginBottom: 4 },
  displayName: { fontSize: 20, fontWeight: '700', color: '#fff', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  username: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, gap: 4 },
  badgeText: { fontSize: 11, fontWeight: '600' },

  // Cards
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: '#1e293b', marginLeft: 8 },
  cardAction: { fontSize: 13, color: '#6366f1', fontWeight: '600' },
  cardSubtitle: { fontSize: 13, color: '#64748b', marginTop: 4 },

  // Trust
  scoreValue: { fontSize: 18, fontWeight: '800' },
  progressBarBg: { height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, marginTop: 8, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },

  // Stats
  statsRow: { flexDirection: 'row', marginHorizontal: 16, marginTop: 12, gap: 8 },
  statBox: { flex: 1, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  statNumber: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },

  // Wallet
  walletBalance: { fontSize: 24, fontWeight: '800', color: '#1e293b', marginTop: 4 },

  // Business
  businessRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  businessName: { flex: 1, fontSize: 14, color: '#1e293b', fontWeight: '500' },
  businessType: { fontSize: 12, color: '#64748b', textTransform: 'capitalize' },

  // Portfolio
  portfolioRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  portfolioTitle: { fontSize: 14, color: '#1e293b', fontWeight: '500' },
  portfolioType: { fontSize: 12, color: '#64748b', textTransform: 'capitalize' },

  // Inline buttons
  inlineButton: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 6 },
  inlineButtonText: { fontSize: 13, color: '#6366f1', fontWeight: '600' },

  // Achievements
  achievementRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  achievementBadge: { alignItems: 'center', width: 60 },
  achievementText: { fontSize: 10, color: '#64748b', marginTop: 4, textAlign: 'center' },

  // Analytics
  analyticsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 },
  analyticsItem: { alignItems: 'center' },
  analyticsNumber: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  analyticsLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },

  // Edit
  editButton: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: '#1e293b',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  editButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
