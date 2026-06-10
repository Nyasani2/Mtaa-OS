import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import type { PulseTrend } from '../types';

export function TrendingSection({ trends }: { trends: PulseTrend[] }) {
  const router = useRouter();
  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>🔥 Trending Now</Text>
        <TouchableOpacity onPress={() => router.push('/(os)/pulse/trending')}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>
      {trends.slice(0, 5).map((trend, i) => (
        <TouchableOpacity key={trend.id} style={styles.trendItem} onPress={() => router.push(`/(os)/pulse/${trend.entity_type}/${trend.entity_id}`)}>
          <Text style={styles.rank}>#{i + 1}</Text>
          <View style={styles.trendInfo}>
            <Text style={styles.trendName}>{trend.entity_name}</Text>
            <Text style={styles.trendMeta}>{trend.entity_type} • {trend.score.toFixed(0)} pts</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  seeAll: { color: '#FF6B35', fontSize: 13, fontWeight: '600' },
  trendItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  rank: { fontSize: 14, fontWeight: '700', color: '#FF6B35', width: 30 },
  trendInfo: { flex: 1 },
  trendName: { fontSize: 15, fontWeight: '600', color: '#fff' },
  trendMeta: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
});
