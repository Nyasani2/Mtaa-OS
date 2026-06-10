import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import type { PulseTrend } from '../types';

export function TrendingCard({ trend, rank }: { trend: PulseTrend; rank: number }) {
  const router = useRouter();
  return (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/(os)/pulse/${trend.entity_type}/${trend.entity_id}`)}>
      <Text style={styles.rank}>#{rank}</Text>
      <View style={styles.info}>
        <Text style={styles.name}>{trend.entity_name}</Text>
        <Text style={styles.meta}>{trend.entity_type} • {trend.view_count.toLocaleString()} views • {trend.engagement_count.toLocaleString()} engagements</Text>
        {trend.velocity > 0 && <Text style={styles.velocity}>↑ {trend.velocity.toFixed(1)}x trending</Text>}
      </View>
      <Text style={styles.score}>{trend.score.toFixed(0)}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 12, marginBottom: 8 },
  rank: { fontSize: 18, fontWeight: '800', color: '#FF6B35', width: 40 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: '#fff' },
  meta: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  velocity: { fontSize: 11, color: '#34D399', marginTop: 2 },
  score: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.3)' },
});
