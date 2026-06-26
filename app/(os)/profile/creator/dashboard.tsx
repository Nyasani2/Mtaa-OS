import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { ProfileService } from '@/lib/profile/services/profile-service';
import type { ProfileStats } from '@/lib/profile/types';

const { width: SCREEN_W } = Dimensions.get('window');

export default function CreatorDashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => { if (!user?.id) return; try { const s = await ProfileService.getProfileStats(user.id); setStats(s); } finally { setLoading(false); setRefreshing(false); } };
  useEffect(() => { fetchData(); }, [user?.id]);

  if (loading) return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color="#00d4ff" /></View>;

  const cards = [
    { label: 'Total Views', value: stats?.total_views || 0, icon: 'eye-outline', color: '#00d4ff' },
    { label: 'Subscribers', value: stats?.total_subscribers || 0, icon: 'people-outline', color: '#ff00ff' },
    { label: 'Tips (KES)', value: stats?.total_tips?.toFixed(2) || '0.00', icon: 'cash-outline', color: '#00ff88' },
    { label: 'Achievements', value: stats?.achievements_count || 0, icon: 'trophy-outline', color: '#ffaa00' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Creator Dashboard</Text>
        <TouchableOpacity onPress={() => router.push('/profile/creator/analytics')}><Ionicons name="stats-chart-outline" size={22} color="#fff" /></TouchableOpacity>
      </View>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#00d4ff" />} showsVerticalScrollIndicator={false}>
        <View style={styles.statsGrid}>
          {cards.map(card => (
            <View key={card.label} style={[styles.statCard, { borderColor: card.color + '44' }]}>
              <Ionicons name={card.icon as any} size={24} color={card.color} />
              <Text style={styles.statValue}>{card.value}</Text>
              <Text style={styles.statLabel}>{card.label}</Text>
            </View>
          ))}
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Creator Tools</Text>
          {[
            { label: 'Content Manager', icon: 'albums-outline', route: '/studio/dashboard' },
            { label: 'Earnings', icon: 'wallet-outline', route: '/profile/creator/earnings' },
            { label: 'Subscribers', icon: 'people-outline', route: '/profile/creator/subscribers' },
            { label: 'Series', icon: 'film-outline', route: '/studio/series' },
            { label: 'Live Schedule', icon: 'radio-outline', route: '/studio/live' },
            { label: 'Media Library', icon: 'musical-notes-outline', route: '/studio/media' },
          ].map(tool => (
            <TouchableOpacity key={tool.label} style={styles.toolRow} onPress={() => router.push(tool.route as any)}>
              <Ionicons name={tool.icon as any} size={20} color="#00d4ff" />
              <Text style={styles.toolText}>{tool.label}</Text>
              <Ionicons name="chevron-forward" size={16} color="#444" />
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verification</Text>
          <TouchableOpacity style={styles.verificationCard} onPress={() => router.push('/profile/creator/verification')}>
            <Ionicons name="shield-checkmark-outline" size={28} color="#00d4ff" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.verificationTitle}>Creator Verification</Text>
              <Text style={styles.verificationSub}>Get verified badge and unlock monetization</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#444" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12 },
  statCard: { width: (SCREEN_W - 56) / 2, backgroundColor: '#111', borderRadius: 12, padding: 16, borderWidth: 1, alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 22, fontWeight: '700', marginTop: 8 },
  statLabel: { color: '#888', fontSize: 11, marginTop: 4 },
  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  toolRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 14, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#1a1a1a' },
  toolText: { color: '#fff', fontSize: 14, flex: 1, marginLeft: 12 },
  verificationCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#00d4ff11', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#00d4ff33' },
  verificationTitle: { color: '#fff', fontSize: 14, fontWeight: '700' },
  verificationSub: { color: '#888', fontSize: 12, marginTop: 2 },
});
