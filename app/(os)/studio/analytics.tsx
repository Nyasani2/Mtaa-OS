import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Eye, Clock, Timer, Percent, Users, DollarSign } from 'lucide-react-native';
import { useStudio } from '@/domains/studio/hooks/useStudio';
import { useAuthStore } from '@/lib/auth/store/auth.store';

const PERIODS = [
  { key: '7', label: 'Last 7 days' },
  { key: '28', label: 'Last 28 days' },
  { key: '90', label: 'Last 90 days' },
  { key: '365', label: 'Lifetime' },
];

export default function AnalyticsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { getAnalytics } = useStudio();
  const [period, setPeriod] = useState('28');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      setLoading(true);
      const d = await getAnalytics(user.id, period);
      setData(d);
      setLoading(false);
    })();
  }, [period, user?.id]);

  const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const metrics = data ? [
    { icon: Eye, label: 'Views', value: data.views || 0, change: '+12%', color: '#ff0040' },
    { icon: Clock, label: 'Watch Time', value: formatTime(data.watch_time_seconds || 0), change: '+8%', color: '#ff0040' },
    { icon: Timer, label: 'Avg Duration', value: formatTime(data.avg_duration_seconds || 0), change: '-3%', color: '#ff0040' },
    { icon: Percent, label: 'CTR', value: '4.2%', change: '+5%', color: '#ff0040' },
    { icon: Users, label: 'Subscribers', value: data.subscribers || 0, change: '+12%', color: '#ff0040' },
    { icon: DollarSign, label: 'Revenue', value: `KES ${(data.revenue || 0).toLocaleString()}`, change: '+8%', color: '#ff0040' },
  ] : [];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Analytics</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Period selector */}
      <View style={styles.periodRow}>
        {PERIODS.map((p) => (
          <Pressable
            key={p.key}
            style={[styles.periodChip, period === p.key && styles.periodChipActive]}
            onPress={() => setPeriod(p.key)}
          >
            <Text style={[styles.periodText, period === p.key && styles.periodTextActive]}>
              {p.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color="#ff0040" style={{ marginTop: 40 }} />
      ) : (
        <>
          {/* Metrics Grid */}
          <View style={styles.metricsGrid}>
            {metrics.map((m, i) => {
              const Icon = m.icon;
              return (
                <View key={i} style={styles.metricCard}>
                  <View style={styles.metricTop}>
                    <Icon size={18} color={m.color} />
                    <Text style={styles.metricChange}>{m.change}</Text>
                  </View>
                  <Text style={styles.metricValue}>{m.value}</Text>
                  <Text style={styles.metricLabel}>{m.label}</Text>
                </View>
              );
            })}
          </View>

          {/* Audience Retention (placeholder chart) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Audience Retention</Text>
            <View style={styles.retentionBar}>
              {[100, 85, 70, 55, 45, 35, 28, 22, 18, 15].map((h, i) => (
                <View key={i} style={styles.retentionCol}>
                  <View style={[styles.retentionFill, { height: h * 1.2, backgroundColor: i < 5 ? '#ff0040' : '#333' }]} />
                </View>
              ))}
            </View>
            <View style={styles.retentionLabels}>
              <Text style={styles.retentionLabel}>0%</Text>
              <Text style={styles.retentionLabel}>50%</Text>
              <Text style={styles.retentionLabel}>100%</Text>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  periodRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  periodChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
  },
  periodChipActive: { backgroundColor: '#fff' },
  periodText: { color: '#ccc', fontSize: 11, fontWeight: '600' },
  periodTextActive: { color: '#000' },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
  },
  metricTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  metricChange: { color: '#4ade80', fontSize: 11, fontWeight: '600' },
  metricValue: { color: '#fff', fontSize: 20, fontWeight: '800' },
  metricLabel: { color: '#888', fontSize: 11, marginTop: 4 },
  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionTitle: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 12 },
  retentionBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 140,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  retentionCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  retentionFill: { width: '100%', borderRadius: 3 },
  retentionLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, paddingHorizontal: 4 },
  retentionLabel: { color: '#666', fontSize: 10 },
});
