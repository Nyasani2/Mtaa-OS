// app/(os)/profile/index.tsx
// FIXED: Uses creator_id (not user_id) — matches your actual streets_posts schema

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/useAuthStore';
import { supabase } from '@/lib/supabase';
import { MediaGallery } from '@/components/media/MediaGallery';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface ProfileData {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
  location: string | null;
  verified: boolean;
  created_at: string;
}

interface ProfileStats {
  posts_count: number;
  followers_count: number;
  following_count: number;
  businesses_count: number;
}

function useWalletBalance() {
  const [balance, setBalance] = useState(0);
  const [currency, setCurrency] = useState('KES');
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('wallets')
      .select('balance, currency')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setBalance(data.balance || 0);
          setCurrency(data.currency || 'KES');
        }
      });
  }, [user?.id]);

  return { balance, currency };
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { balance, currency } = useWalletBalance();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<ProfileStats>({
    posts_count: 0,
    followers_count: 0,
    following_count: 0,
    businesses_count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'business' | 'shop' | 'cv'>('content');

  const userId = user?.id;

  const fetchProfile = useCallback(async () => {
    if (!userId) return;

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      const [
        { count: postsCount },
        { count: followersCount },
        { count: followingCount },
        { count: businessesCount },
      ] = await Promise.all([
        supabase.from('streets_posts').select('*', { count: 'exact', head: true }).eq('creator_id', userId),
        supabase.from('followers').select('*', { count: 'exact', head: true }).eq('following_id', userId),
        supabase.from('followers').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
        supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('owner_id', userId),
      ]);

      setStats({
        posts_count: postsCount || 0,
        followers_count: followersCount || 0,
        following_count: followingCount || 0,
        businesses_count: businessesCount || 0,
      });
    } catch (err) {
      console.error('Profile fetch error:', err);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProfile();
  }, [fetchProfile]);

  const handleEditProfile = () => {
    router.push('/(os)/profile/edit');
  };

  const handleWalletPress = () => {
    router.push('/(os)/wallet');
  };

  const handleUploadPress = () => {
    router.push('/(os)/upload');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  const displayName = profile?.full_name || profile?.username || 'User';
  const handleText = profile?.username ? `@${profile.username}` : `@user_${userId?.slice(0, 8)}`;
  const avatarUri = profile?.avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(displayName) + '&background=6366f1&color=fff';
  const coverUri = profile?.cover_url;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Cover Photo */}
      <View style={styles.coverContainer}>
        {coverUri ? (
          <Image source={{ uri: coverUri }} style={styles.coverImage} />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Ionicons name="image-outline" size={48} color="#6b7280" />
          </View>
        )}
        <TouchableOpacity style={styles.editCoverBtn} onPress={handleEditProfile}>
          <Ionicons name="camera" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Avatar & Basic Info */}
      <View style={styles.headerSection}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
          {profile?.verified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            </View>
          )}
        </View>

        <View style={styles.nameSection}>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.handle}>{handleText}</Text>
          {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}
          {profile?.location && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color="#6b7280" />
              <Text style={styles.locationText}>{profile.location}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleEditProfile}>
          <Text style={styles.primaryBtnText}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={handleUploadPress}>
          <Ionicons name="add-circle" size={18} color="#6366f1" />
          <Text style={styles.secondaryBtnText}>Upload</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <TouchableOpacity style={styles.statItem} onPress={() => setActiveTab('content')}>
          <Text style={styles.statNumber}>{stats.posts_count}</Text>
          <Text style={styles.statLabel}>Posts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statItem} onPress={() => router.push('/(os)/followers')}>
          <Text style={styles.statNumber}>{stats.followers_count}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statItem} onPress={() => router.push('/(os)/following')}>
          <Text style={styles.statNumber}>{stats.following_count}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statItem} onPress={() => setActiveTab('business')}>
          <Text style={styles.statNumber}>{stats.businesses_count}</Text>
          <Text style={styles.statLabel}>Business</Text>
        </TouchableOpacity>
      </View>

      {/* Wallet Card */}
      <TouchableOpacity style={styles.walletCard} onPress={handleWalletPress}>
        <View style={styles.walletHeader}>
          <Ionicons name="wallet-outline" size={20} color="#6366f1" />
          <Text style={styles.walletTitle}>MTAA Wallet</Text>
          <Ionicons name="chevron-forward" size={18} color="#6b7280" />
        </View>
        <Text style={styles.walletBalance}>
          {currency} {balance.toLocaleString()}
        </Text>
        <Text style={styles.walletLabel}>Available Balance</Text>
      </TouchableOpacity>

      {/* Tab Navigation */}
      <View style={styles.tabRow}>
        {(['content', 'business', 'shop', 'cv'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {activeTab === 'content' && (
        <MediaGallery userId={userId} onUploadPress={handleUploadPress} />
      )}

      {activeTab === 'business' && (
        <BusinessSection userId={userId} />
      )}

      {activeTab === 'shop' && (
        <ShopSection userId={userId} />
      )}

      {activeTab === 'cv' && (
        <CVSection userId={userId} />
      )}
    </ScrollView>
  );
}

// ─── Sub-components ────────────────────────────────────────────────

function BusinessSection({ userId }: { userId: string | undefined }) {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!userId) return;
    supabase
      .from('businesses')
      .select('*')
      .eq('owner_id', userId)
      .then(({ data }) => {
        setBusinesses(data || []);
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <ActivityIndicator style={{ marginTop: 20 }} />;
  if (businesses.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="business-outline" size={48} color="#d1d5db" />
        <Text style={styles.emptyText}>No businesses yet</Text>
        <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(os)/business/register')}>
          <Text style={styles.emptyBtnText}>Register Business</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.sectionList}>
      {businesses.map((biz) => (
        <TouchableOpacity key={biz.id} style={styles.businessCard} onPress={() => router.push(`/(os)/business/${biz.id}`)}>
          <Ionicons name="storefront-outline" size={32} color="#6366f1" />
          <View style={styles.businessInfo}>
            <Text style={styles.businessName}>{biz.name}</Text>
            <Text style={styles.businessType}>{biz.type}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#6b7280" />
        </TouchableOpacity>
      ))}
    </View>
  );
}

function ShopSection({ userId }: { userId: string | undefined }) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!userId) return;

    const fetchUserProducts = async () => {
      const { data: shops } = await supabase
        .from('shops')
        .select('id')
        .eq('owner_id', userId);

      if (!shops || shops.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      const shopIds = shops.map((s: any) => s.id);

      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, description, selling_price, images, stock_quantity, is_active, shop_id')
        .in('shop_id', shopIds)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      setProducts(productsData || []);
      setLoading(false);
    };

    fetchUserProducts();
  }, [userId]);

  if (loading) return <ActivityIndicator style={{ marginTop: 20 }} />;
  if (products.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="cart-outline" size={48} color="#d1d5db" />
        <Text style={styles.emptyText}>No products in your shop</Text>
        <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(os)/shop/add-product')}>
          <Text style={styles.emptyBtnText}>Add Product</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.productGrid}>
      {products.map((product) => {
        const imageUrl = product.images && product.images.length > 0 
          ? product.images[0] 
          : 'https://via.placeholder.com/150';

        return (
          <TouchableOpacity 
            key={product.id} 
            style={styles.productCard} 
            onPress={() => router.push(`/(os)/shop/edit-product/${product.id}`)}
          >
            <Image source={{ uri: imageUrl }} style={styles.productImage} />
            <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
            <Text style={styles.productPrice}>KES {product.selling_price}</Text>
            <Text style={styles.productStock}>{product.stock_quantity} in stock</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function CVSection({ userId }: { userId: string | undefined }) {
  const [cv, setCv] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!userId) return;
    supabase
      .from('cv_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
      .then(({ data }) => {
        setCv(data);
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <ActivityIndicator style={{ marginTop: 20 }} />;
  if (!cv) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="document-text-outline" size={48} color="#d1d5db" />
        <Text style={styles.emptyText}>No CV yet</Text>
        <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(os)/cv/create')}>
          <Text style={styles.emptyBtnText}>Create CV</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.cvCard}>
      <Text style={styles.cvTitle}>{cv.title || 'My CV'}</Text>
      {cv.summary && <Text style={styles.cvSummary}>{cv.summary}</Text>}
      {cv.skills && cv.skills.length > 0 && (
        <View style={styles.skillsRow}>
          {cv.skills.map((skill: string, i: number) => (
            <View key={i} style={styles.skillBadge}>
              <Text style={styles.skillText}>{skill}</Text>
            </View>
          ))}
        </View>
      )}
      <TouchableOpacity style={styles.cvEditBtn} onPress={() => router.push('/(os)/cv/edit')}>
        <Text style={styles.cvEditText}>Edit CV</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0f0f' },

  coverContainer: { width: '100%', height: 180, position: 'relative' },
  coverImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  coverPlaceholder: { width: '100%', height: '100%', backgroundColor: '#1f1f1f', justifyContent: 'center', alignItems: 'center' },
  editCoverBtn: { position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 20 },

  headerSection: { paddingHorizontal: 16, paddingTop: 12 },
  avatarContainer: { position: 'relative', marginTop: -50, alignSelf: 'flex-start' },
  avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 4, borderColor: '#0f0f0f' },
  verifiedBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#0f0f0f', borderRadius: 12 },
  nameSection: { marginTop: 12 },
  name: { fontSize: 22, fontWeight: '700', color: '#fff' },
  handle: { fontSize: 15, color: '#9ca3af', marginTop: 2 },
  bio: { fontSize: 14, color: '#d1d5db', marginTop: 8, lineHeight: 20 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  locationText: { fontSize: 13, color: '#9ca3af', marginLeft: 4 },

  actionRow: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 16, gap: 10 },
  primaryBtn: { flex: 1, backgroundColor: '#6366f1', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderWidth: 1, borderColor: '#374151', borderRadius: 8, gap: 6 },
  secondaryBtnText: { color: '#6366f1', fontWeight: '600', fontSize: 14 },

  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16, marginTop: 8, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#1f1f1f' },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 18, fontWeight: '700', color: '#fff' },
  statLabel: { fontSize: 12, color: '#9ca3af', marginTop: 2 },

  walletCard: { margin: 16, backgroundColor: '#1f1f1f', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#374151' },
  walletHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  walletTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: '#9ca3af', marginLeft: 8 },
  walletBalance: { fontSize: 28, fontWeight: '700', color: '#fff' },
  walletLabel: { fontSize: 12, color: '#6b7280', marginTop: 4 },

  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#1f1f1f' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderColor: '#6366f1' },
  tabText: { fontSize: 14, color: '#9ca3af', fontWeight: '500' },
  tabTextActive: { color: '#6366f1', fontWeight: '600' },

  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#6b7280', marginTop: 12 },
  emptyBtn: { marginTop: 16, backgroundColor: '#6366f1', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  emptyBtnText: { color: '#fff', fontWeight: '600' },

  sectionList: { padding: 16 },
  businessCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1f1f1f', padding: 16, borderRadius: 12, marginBottom: 10 },
  businessInfo: { flex: 1, marginLeft: 12 },
  businessName: { fontSize: 16, fontWeight: '600', color: '#fff' },
  businessType: { fontSize: 13, color: '#9ca3af', marginTop: 2 },

  productGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 8 },
  productCard: { width: (width - 48) / 2, margin: 8, backgroundColor: '#1f1f1f', borderRadius: 12, overflow: 'hidden' },
  productImage: { width: '100%', height: 120, resizeMode: 'cover' },
  productName: { fontSize: 13, color: '#fff', padding: 8, paddingBottom: 4 },
  productPrice: { fontSize: 14, fontWeight: '700', color: '#6366f1', paddingHorizontal: 8 },
  productStock: { fontSize: 11, color: '#6b7280', paddingHorizontal: 8, paddingBottom: 8 },

  cvCard: { margin: 16, backgroundColor: '#1f1f1f', borderRadius: 12, padding: 16 },
  cvTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  cvSummary: { fontSize: 14, color: '#d1d5db', marginTop: 8, lineHeight: 20 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  skillBadge: { backgroundColor: '#374151', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  skillText: { color: '#9ca3af', fontSize: 12 },
  cvEditBtn: { marginTop: 12, alignSelf: 'flex-start', backgroundColor: '#374151', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  cvEditText: { color: '#fff', fontWeight: '600' },
});
