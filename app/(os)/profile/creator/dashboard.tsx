import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { ProfileService } from '@/lib/profile/services/profile-service';

export default function CreatorDashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ postsCount: 0, followersCount: 0, followingCount: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    if (!user?.id) { setLoading(false); return; }
    try { const data = await ProfileService.getProfileStats(user.id); setStats(data); }
    catch (e) { console.warn('[CreatorDashboard]', e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { loadStats(); }, [user?.id]);
  if (loading) return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color="#2563EB" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#0f172a" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Creator Dashboard</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadStats(); }} />} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.subtitle}>Manage your content and profile</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}><Text style={styles.statNumber}>{stats.postsCount}</Text><Text style={styles.statLabel}>Posts</Text></View>
          <View style={styles.statCard}><Text style={styles.statNumber}>{stats.followersCount}</Text><Text style={styles.statLabel}>Followers</Text></View>
          <View style={styles.statCard}><Text style={styles.statNumber}>{stats.followingCount}</Text><Text style={styles.statLabel}>Following</Text></View>
        </View>
        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/streets')}>
          <View style={[styles.actionIcon, { backgroundColor: '#2563EB15' }]}><Ionicons name="create-outline" size={24} color="#2563EB" /></View>
          <View style={{ flex: 1 }}><Text style={styles.actionTitle}>Go to Streets</Text><Text style={styles.actionDesc}>Create and manage posts</Text></View>
          <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(os)/profile/edit')}>
          <View style={[styles.actionIcon, { backgroundColor: '#05966915' }]}><Ionicons name="person-outline" size={24} color="#059669" /></View>
          <View style={{ flex: 1 }}><Text style={styles.actionTitle}>Edit Profile</Text><Text style={styles.actionDesc}>Update your profile information</Text></View>
          <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
        </TouchableOpacity>
        <View style={styles.gettingStarted}>
          <Text style={styles.gettingStartedTitle}>Getting Started</Text>
          <Text style={styles.gettingStartedText}>Start creating content on Streets to build your audience. Share photos, videos, and articles with the MTAA community.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { color: '#0f172a', fontSize: 18, fontWeight: '700' },
  subtitle: { color: '#64748b', fontSize: 14, marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  statNumber: { color: '#0f172a', fontSize: 22, fontWeight: '800' },
  statLabel: { color: '#64748b', fontSize: 12, marginTop: 4 },
  actionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  actionIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  actionTitle: { color: '#0f172a', fontSize: 15, fontWeight: '600' },
  actionDesc: { color: '#64748b', fontSize: 12, marginTop: 2 },
  gettingStarted: { marginTop: 20 },
  gettingStartedTitle: { color: '#0f172a', fontSize: 16, fontWeight: '700', marginBottom: 8 },
  gettingStartedText: { color: '#64748b', fontSize: 13, lineHeight: 20 },
});
