import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const metrics = [
  { label: 'DAU', value: '12.5K', change: '+8%', color: '#10B981' },
  { label: 'Transactions', value: '45.2K', change: '+12%', color: '#6366F1' },
  { label: 'Revenue', value: 'KES 2.4M', change: '+5%', color: '#F59E0B' },
  { label: 'New Users', value: '1.8K', change: '+15%', color: '#EC4899' },
];

export function AnalyticsShell() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        <TouchableOpacity style={styles.exportBtn}>
          <Ionicons name="download" size={18} color="white" />
        </TouchableOpacity>
      </View>
      <View style={styles.grid}>
        {metrics.map((m, i) => (
          <View key={i} style={styles.metricCard}>
            <Text style={styles.metricLabel}>{m.label}</Text>
            <Text style={styles.metricValue}>{m.value}</Text>
            <Text style={[styles.metricChange, { color: m.color }]}>{m.change}</Text>
          </View>
        ))}
      </View>
      <View style={styles.chartPlaceholder}>
        <Ionicons name="bar-chart" size={48} color="#334155" />
        <Text style={styles.chartText}>Revenue Trend</Text>
        <Text style={styles.chartSub}>Last 30 days</Text>
      </View>
      <Text style={styles.sectionTitle}>Top Apps</Text>
      {['MTaxi', 'Wallet', 'Shop', 'MTruck'].map((app, i) => (
        <View key={i} style={styles.appRow}>
          <Text style={styles.appName}>{i + 1}. {app}</Text>
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: str(100 - i * 15) + '%', backgroundColor: metrics[i].color }]} />
          </View>
          <Text style={styles.appValue}>{100 - i * 15}%</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050816' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  title: { fontSize: 32, fontWeight: 'bold', color: 'white' },
  exportBtn: { backgroundColor: '#1E293B', padding: 10, borderRadius: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 },
  metricCard: { width: '48%', margin: '1%', backgroundColor: '#1E293B', borderRadius: 12, padding: 14 },
  metricLabel: { color: '#94A3B8', fontSize: 12 },
  metricValue: { color: 'white', fontSize: 20, fontWeight: 'bold', marginTop: 6 },
  metricChange: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  chartPlaceholder: { height: 200, backgroundColor: '#1E293B', margin: 16, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  chartText: { color: '#94A3B8', marginTop: 8 },
  chartSub: { color: '#64748B', fontSize: 12 },
  sectionTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginHorizontal: 16, marginTop: 8, marginBottom: 12 },
  appRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 10 },
  appName: { color: 'white', width: 80, fontSize: 14 },
  barBg: { flex: 1, height: 8, backgroundColor: '#1E293B', borderRadius: 4, marginHorizontal: 10 },
  barFill: { height: 8, borderRadius: 4 },
  appValue: { color: '#94A3B8', fontSize: 12, width: 40, textAlign: 'right' },
});
