import React from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { useProfile } from '@/lib/profile/hooks/useProfile'; // YOUR existing hook
import { useProfileTimeline } from '@/lib/profile/hooks/useProfileTimeline'; // NEW

const { width } = Dimensions.get('window');
const GRID_SIZE = (width - 48) / 3;

function Avatar({ url, name, size = 80 }: { url: string | null; name: string; size?: number }) {
  if (url) return <Image source={{ uri: url }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  const initial = (name || 'U').charAt(0).toUpperCase();
  return (
    <View style={[styles.avatarFallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={{ color: '#fff', fontSize: size * 0.35, fontWeight: '700' }}>{initial}</Text>
    </View>
  );
}

function TimelineCard({ item }: { item: any }) {
  const router = useRouter();
  const icons: Record<string, string> = {
    streets_post: 'videocam', marketplace_listing: 'cart', job_listing: 'briefcase', tribes_post: 'people'
  };
  const colors: Record<string, string> = {
    streets_post: '#ef4444', marketplace_listing: '#84cc16', job_listing: '#f59e0b', tribes_post: '#d946ef'
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        if (item.source_app === 'streets') router.push(`/streets?postId=${item.source_id}`);
        else if (item.source_app === 'marketplace') router.push(`/(commerce)/marketplace/${item.source_id}`);
        else if (item.source_app === 'jobs') router.push(`/(work)/jobs/details/${item.source_id}`);
      }}
    >
      {item.thumbnail_url || item.media_url ? (
        <Image source={{ uri: item.thumbnail_url || item.media_url }} style={styles.cardMedia} />
      ) : (
        <View style={[styles.cardMedia, { backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center' }]}>
          <Ionicons name={icons[item.content_type] as any || 'apps'} size={28} color={colors[item.content_type] || '#666'} />
        </View>
      )}
      <View style={styles.cardOverlay}>
        <View style={[styles.sourceBadge, { backgroundColor: colors[item.content_type] || '#666' }]}>
          <Ionicons name={icons[item.content_type] as any || 'apps'} size={10} color="#fff" />
          <Text style={styles.sourceText}>{item.source_app}</Text>
        </View>
      </View>
      {item.title && <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>}
      <View style={styles.cardStats}>
        <Text style={styles.cardStat}>👁 {item.view_count || 0}</Text>
        <Text style={styles.cardStat}>❤ {item.like_count || 0}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function ProfileOSScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuthStore();
  const profileUserId = id || user?.id;
  const isOwnProfile = user?.id === profileUserId;

  // YOUR existing hook — gets profile, roles, verifications, etc.
  const { profile, isLoading: profileLoading } = useProfile();

  // NEW timeline hook
  const {
    timeline, stats, loading: timelineLoading, following,
    activeTab, setActiveTab, refresh, handleFollow
  } = useProfileTimeline(profileUserId || '');

  const loading = profileLoading || timelineLoading;
  const name = profile?.display_name || profile?.full_name || 'User';
  const username = profile?.username ? `@${profile.username}` : '';

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#0af" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{name}</Text>
          <TouchableOpacity onPress={() => router.push('/settings/profile')}>
            <Ionicons name="settings-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <Avatar url={profile?.avatar_url} name={name} size={90} />
          <Text style={styles.name}>{name}</Text>
          {username ? <Text style={styles.username}>{username}</Text> : null}
          {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.content_count}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <TouchableOpacity style={styles.statItem} onPress={() => router.push(`/profile/followers?id=${profileUserId}`)}>
              <Text style={styles.statNumber}>{stats.followers_count}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statItem} onPress={() => router.push(`/profile/following?id=${profileUserId}`)}>
              <Text style={styles.statNumber}>{stats.following_count}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.total_views}</Text>
              <Text style={styles.statLabel}>Views</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionRow}>
            {isOwnProfile ? (
              <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/settings/profile')}>
                <Text style={styles.editBtnText}>Edit Profile</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity style={[styles.followBtn, following && styles.followingBtn]} onPress={handleFollow}>
                  <Text style={[styles.followBtnText, following && styles.followingBtnText]}>
                    {following ? 'Following' : 'Follow'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.messageBtn} onPress={() => router.push(`/(communication)/messages?userId=${profileUserId}`)}>
                  <Ionicons name="mail" size={18} color="#fff" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Content Tabs */}
        <View style={styles.tabs}>
          {[
            { key: 'all', label: 'All', icon: 'apps' },
            { key: 'streets', label: 'Streets', icon: 'videocam' },
            { key: 'marketplace', label: 'Market', icon: 'cart' },
            { key: 'jobs', label: 'Jobs', icon: 'briefcase' },
            { key: 'tribes', label: 'Tribes', icon: 'people' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <Ionicons name={tab.icon as any} size={16} color={activeTab === tab.key ? '#0af' : '#888'} />
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content Grid */}
        {timeline.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="images-outline" size={48} color="#333" />
            <Text style={styles.emptyText}>No content yet</Text>
            {isOwnProfile && (
              <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/streets/create')}>
                <Text style={styles.createBtnText}>Create First Post</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.grid}>
            {timeline.map((item) => <TimelineCard key={item.id} item={item} />)}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12,
  },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '600' },
  profileSection: { alignItems: 'center', paddingVertical: 16 },
  avatarFallback: { backgroundColor: '#333', alignItems: 'center', justifyContent: 'center' },
  name: { color: '#fff', fontSize: 20, fontWeight: '700', marginTop: 12 },
  username: { color: '#888', fontSize: 14, marginTop: 2 },
  bio: { color: '#ccc', fontSize: 14, marginTop: 8, textAlign: 'center', paddingHorizontal: 32 },
  statsRow: { flexDirection: 'row', marginTop: 16, gap: 24 },
  statItem: { alignItems: 'center' },
  statNumber: { color: '#fff', fontSize: 18, fontWeight: '700' },
  statLabel: { color: '#888', fontSize: 12, marginTop: 2 },
  actionRow: { flexDirection: 'row', marginTop: 16, gap: 10 },
  editBtn: { backgroundColor: '#222', paddingHorizontal: 32, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#333' },
  editBtnText: { color: '#fff', fontWeight: '600' },
  followBtn: { backgroundColor: '#0af', paddingHorizontal: 32, paddingVertical: 10, borderRadius: 8 },
  followBtnText: { color: '#fff', fontWeight: '600' },
  followingBtn: { backgroundColor: '#222', borderWidth: 1, borderColor: '#444' },
  followingBtnText: { color: '#ccc' },
  messageBtn: { backgroundColor: '#222', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#333' },
  tabs: {
    flexDirection: 'row', justifyContent: 'space-around',
    borderTopWidth: 1, borderTopColor: '#222',
    borderBottomWidth: 1, borderBottomColor: '#222',
    paddingVertical: 8,
  },
  tab: { alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 8 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#0af' },
  tabText: { color: '#888', fontSize: 11 },
  tabTextActive: { color: '#0af', fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 4 },
  card: { width: GRID_SIZE, marginBottom: 4 },
  cardMedia: { width: GRID_SIZE, height: GRID_SIZE * 1.3, borderRadius: 8, backgroundColor: '#111' },
  cardOverlay: { position: 'absolute', top: 6, left: 6 },
  sourceBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, gap: 3 },
  sourceText: { color: '#fff', fontSize: 9, fontWeight: '600' },
  cardTitle: { color: '#ccc', fontSize: 11, marginTop: 4, paddingHorizontal: 2 },
  cardStats: { flexDirection: 'row', gap: 8, marginTop: 2, paddingHorizontal: 2 },
  cardStat: { color: '#888', fontSize: 10 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: '#555', marginTop: 12 },
  createBtn: { marginTop: 16, backgroundColor: '#0af', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  createBtnText: { color: '#fff', fontWeight: '600' },
});
