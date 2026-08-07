import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Image, Pressable, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Settings, Upload, Video, Music, Podcast, BookOpen, Radio, FileText } from 'lucide-react-native';
import { useStudio, StudioVideo } from '@/domains/studio/hooks/useStudio';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import VideoCard from '@/domains/studio/components/video-card';

const TABS = [
  { key: 'videos', label: 'Videos', icon: Video },
  { key: 'music', label: 'Music', icon: Music },
  { key: 'podcasts', label: 'Podcasts', icon: Podcast },
  { key: 'courses', label: 'Courses', icon: BookOpen },
  { key: 'livestreams', label: 'Livestreams', icon: Radio },
  { key: 'drafts', label: 'Drafts', icon: FileText },
];

export default function CreatorProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { getCreatorProfile, getCreatorVideos } = useStudio();

  const [profile, setProfile] = useState<any>(null);
  const [videos, setVideos] = useState<StudioVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('videos');

  const targetId = id || user?.id;
  const isOwn = !id || id === user?.id;

  useEffect(() => {
    if (!targetId) return;
    (async () => {
      setLoading(true);
      const p = await getCreatorProfile(targetId);
      setProfile(p);
      const v = await getCreatorVideos(targetId);
      setVideos(v);
      setLoading(false);
    })();
  }, [targetId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff0040" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Profile not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Studio</Text>
        {isOwn && (
          <Pressable onPress={() => router.push('/(os)/studio/settings')}>
            <Settings size={22} color="#fff" />
          </Pressable>
        )}
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        {profile.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarText}>{(profile.display_name || '?').charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <Text style={styles.name}>{profile.display_name || 'Creator'}</Text>
        <Text style={styles.handle}>@{profile.handle || 'creator'}</Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{profile.followers_count || 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{profile.following_count || 0}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{profile.total_views || 0}</Text>
            <Text style={styles.statLabel}>Views</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{profile.subscriber_count || 0}</Text>
            <Text style={styles.statLabel}>Subscribers</Text>
          </View>
        </View>

        {/* Revenue */}
        <View style={styles.revenueCard}>
          <View>
            <Text style={styles.revenueLabel}>Total Revenue</Text>
            <Text style={styles.revenueAmount}>KES {profile.total_revenue?.toLocaleString() || '0'}</Text>
          </View>
          <Pressable onPress={() => router.push('/(os)/studio/analytics')}>
            <Text style={styles.analyticsLink}>View Analytics</Text>
          </Pressable>
        </View>

        {/* Action Buttons */}
        {isOwn && (
          <View style={styles.actionRow}>
            <Pressable
              style={styles.uploadBtn}
              onPress={() => router.push('/(os)/studio/upload-center')}
            >
              <Upload size={16} color="#fff" />
              <Text style={styles.uploadBtnText}>Upload</Text>
            </Pressable>
            <Pressable
              style={styles.liveBtn}
              onPress={() => router.push('/(os)/studio/live-setup')}
            >
              <Radio size={16} color="#fff" />
              <Text style={styles.liveBtnText}>Go Live</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <Pressable
              key={t.key}
              style={[styles.tab, activeTab === t.key && styles.tabActive]}
              onPress={() => setActiveTab(t.key)}
            >
              <Icon size={14} color={activeTab === t.key ? '#000' : '#aaa'} />
              <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Tab Content */}
      <View style={styles.content}>
        {activeTab === 'videos' && (
          <>
            {videos.length > 0 ? (
              <View style={styles.grid}>
                {videos.map((v) => (
                  <VideoCard
                    key={v.id}
                    id={v.id}
                    title={v.title}
                    thumbnail_url={v.thumbnail_url}
                    creator_name={v.creator_name}
                    creator_avatar={v.creator_avatar}
                    view_count={v.view_count}
                    duration_seconds={v.duration_seconds}
                    created_at={v.created_at}
                    size="small"
                  />
                ))}
              </View>
            ) : (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No videos yet</Text>
              </View>
            )}
          </>
        )}
        {activeTab !== 'videos' && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{activeTab} coming soon</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  notFound: { color: '#fff', fontSize: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  profileCard: { alignItems: 'center', paddingVertical: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 10 },
  avatarFallback: { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  name: { color: '#fff', fontSize: 18, fontWeight: '700' },
  handle: { color: '#aaa', fontSize: 13, marginTop: 2 },
  statsRow: { flexDirection: 'row', marginTop: 16, gap: 24 },
  stat: { alignItems: 'center' },
  statNum: { color: '#fff', fontSize: 16, fontWeight: '700' },
  statLabel: { color: '#888', fontSize: 11, marginTop: 2 },
  revenueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    width: '90%',
    padding: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  revenueLabel: { color: '#888', fontSize: 12 },
  revenueAmount: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 2 },
  analyticsLink: { color: '#ff0040', fontSize: 12, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 14, width: '90%' },
  uploadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff0040',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  uploadBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  liveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a2a2a',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  liveBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  tabScroll: { paddingHorizontal: 12, marginTop: 10, maxHeight: 40 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
    marginHorizontal: 4,
    gap: 4,
    height: 32,
  },
  tabActive: { backgroundColor: '#fff' },
  tabText: { color: '#aaa', fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: '#000' },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  empty: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#666', fontSize: 14 },
});
