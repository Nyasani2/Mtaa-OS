import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { PulseAnalytics } from '../types';

export function AnalyticsSection({ analytics }: { analytics: PulseAnalytics[] }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📊 Live Metrics</Text>
      <View style={styles.grid}>
        {analytics.slice(0, 6).map(metric => (
          <View key={metric.id} style={styles.metricCard}>
            <Text style={styles.metricValue}>{metric.metric_value.toLocaleString()}</Text>
            <Text style={styles.metricName}>{metric.metric_name}</Text>
            {metric.dimension_value && <Text style={styles.metricDim}>{metric.dimension_value}</Text>}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#fff', paddingHorizontal: 16, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8 },
  metricCard: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 8, width: '48%', alignItems: 'center' },
  metricValue: { fontSize: 20, fontWeight: '700', color: '#FF6B35' },
  metricName: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 4, textAlign: 'center' },
  metricDim: { fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
});
