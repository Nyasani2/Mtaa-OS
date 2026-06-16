import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface AnalyticsPeriod {
  label: string;
  views: number;
  watchTime: number;
  revenue: number;
  subscribers: number;
}

const MOCK_DATA: Record<string, AnalyticsPeriod> = {
  today: { label: 'Today', views: 12400, watchTime: 4200, revenue: 3400, subscribers: 89 },
  week: { label: 'This Week', views: 87600, watchTime: 28400, revenue: 21800, subscribers: 567 },
  month: { label: 'This Month', views: 342000, watchTime: 112000, revenue: 84500, subscribers: 2100 },
  year: { label: 'This Year', views: 2100000, watchTime: 680000, revenue: 520000, subscribers: 15000 },
};

export default function StudioAnalyticsScreen() {
  const router = useRouter();
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year'>('week');
  const data = MOCK_DATA[period];

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  const barData = [
    { label: 'Mon', value: 65 },
    { label: 'Tue', value: 80 },
    { label: 'Wed', value: 45 },
    { label: 'Thu', value: 90 },
    { label: 'Fri', value: 70 },
    { label: 'Sat', value: 95 },
    { label: 'Sun', value: 85 },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📊 Analytics</Text>
      </View>

      {/* Period Selector */}
      <View style={styles.periodRow}>
        {(['today', 'week', 'month', 'year'] as const).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodBtn, period === p && styles.periodBtnActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="eye" size={22} color="#3B82F6" />
            <Text style={styles.statValue}>{data.views.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Views</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time" size={22} color="#22C55E" />
            <Text style={styles.statValue}>{formatTime(data.watchTime)}</Text>
            <Text style={styles.statLabel}>Watch Time</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="cash" size={22} color="#F59E0B" />
            <Text style={styles.statValue}>KES {data.revenue.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="people" size={22} color="#A855F7" />
            <Text style={styles.statValue}>+{data.subscribers.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Subscribers</Text>
          </View>
        </View>

        {/* Views Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Views This Week</Text>
          <View style={styles.chartBars}>
            {barData.map((bar) => (
              <View key={bar.label} style={styles.barColumn}>
                <View style={styles.barWrap}>
                  <View style={[styles.bar, { height: bar.value * 1.2 }]} />
                </View>
                <Text style={styles.barLabel}>{bar.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Top Videos */}
        <Text style={styles.sectionTitle}>Top Performing Videos</Text>
        {[
          { title: 'Nairobi Street Food Tour', views: 45200, revenue: 12800 },
          { title: 'Sauti Sol Interview', views: 38900, revenue: 9500 },
          { title: 'Coast Vlog Mombasa', views: 21400, revenue: 5600 },
        ].map((video, idx) => (
          <View key={idx} style={styles.videoCard}>
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>#{idx + 1}</Text>
            </View>
            <View style={styles.videoInfo}>
              <Text style={styles.videoTitle}>{video.title}</Text>
              <Text style={styles.videoMeta}>{video.views.toLocaleString()} views • KES {video.revenue.toLocaleString()}</Text>
            </View>
            <Ionicons name="trending-up" size={20} color="#22C55E" />
          </View>
        ))}

        {/* Demographics Placeholder */}
        <Text style={styles.sectionTitle}>Audience Demographics</Text>
        <View style={styles.demoCard}>
          <View style={styles.demoItem}>
            <Text style={styles.demoLabel}>Top Location</Text>
            <Text style={styles.demoValue}>Nairobi, Kenya</Text>
          </View>
          <View style={styles.demoItem}>
            <Text style={styles.demoLabel}>Age Group</Text>
            <Text style={styles.demoValue}>18-34 (68%)</Text>
          </View>
          <View style={styles.demoItem}>
            <Text style={styles.demoLabel}>Device</Text>
            <Text style={styles.demoValue}>Mobile (82%)</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  backBtn: { padding: 8, alignSelf: 'flex-start' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#F8FAFC', marginTop: 4 },
  periodRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  periodBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 10,
    backgroundColor: '#1E293B', alignItems: 'center', borderWidth: 1, borderColor: '#334155',
  },
  periodBtnActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  periodText: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  periodTextActive: { color: '#FFF' },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 12, gap: 8, marginTop: 4,
  },
  statCard: {
    width: '47%', backgroundColor: '#1E293B', borderRadius: 14,
    padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#334155',
  },
  statValue: { fontSize: 18, fontWeight: '800', color: '#F1F5F9', marginTop: 6 },
  statLabel: { fontSize: 11, color: '#64748B', marginTop: 4, fontWeight: '600' },
  chartCard: {
    backgroundColor: '#1E293B', borderRadius: 16,
    marginHorizontal: 16, marginTop: 16, padding: 16,
    borderWidth: 1, borderColor: '#334155',
  },
  chartTitle: { fontSize: 15, fontWeight: '700', color: '#F1F5F9', marginBottom: 14 },
  chartBars: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120 },
  barColumn: { alignItems: 'center', flex: 1 },
  barWrap: { width: 20, height: 120, justifyContent: 'flex-end', backgroundColor: '#0F172A', borderRadius: 4, overflow: 'hidden' },
  bar: { width: '100%', backgroundColor: '#3B82F6', borderRadius: 4 },
  barLabel: { fontSize: 10, color: '#64748B', marginTop: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#F1F5F9', marginHorizontal: 16, marginTop: 20, marginBottom: 10 },
  videoCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1E293B', marginHorizontal: 16, marginBottom: 10,
    padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#334155',
  },
  rankBadge: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: '#3B82F620', justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  rankText: { fontSize: 13, fontWeight: '800', color: '#3B82F6' },
  videoInfo: { flex: 1 },
  videoTitle: { fontSize: 14, fontWeight: '600', color: '#F1F5F9' },
  videoMeta: { fontSize: 12, color: '#64748B', marginTop: 2 },
  demoCard: {
    backgroundColor: '#1E293B', borderRadius: 14,
    marginHorizontal: 16, padding: 16,
    borderWidth: 1, borderColor: '#334155',
  },
  demoItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#334155',
  },
  demoLabel: { fontSize: 13, color: '#94A3B8' },
  demoValue: { fontSize: 13, fontWeight: '700', color: '#F1F5F9' },
});
