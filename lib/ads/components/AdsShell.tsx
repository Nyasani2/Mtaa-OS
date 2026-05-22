import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const campaigns = [
  { id: 1, name: 'Summer Sale', status: 'Active', impressions: '12.5K', clicks: '850', spend: 'KES 5,000' },
  { id: 2, name: 'New Launch', status: 'Paused', impressions: '8.2K', clicks: '420', spend: 'KES 3,200' },
];

export function AdsShell() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ads</Text>
        <TouchableOpacity style={styles.createBtn}>
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.createText}>New Campaign</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>24.5K</Text>
          <Text style={styles.statLabel}>Impressions</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>1.2K</Text>
          <Text style={styles.statLabel}>Clicks</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>4.8%</Text>
          <Text style={styles.statLabel}>CTR</Text>
        </View>
      </View>
      <Text style={styles.sectionTitle}>Campaigns</Text>
      {campaigns.map(c => (
        <View key={c.id} style={styles.campaignCard}>
          <View style={styles.campaignHeader}>
            <Text style={styles.campaignName}>{c.name}</Text>
            <View style={[styles.statusBadge, c.status === 'Active' ? styles.statusActive : styles.statusPaused]}>
              <Text style={styles.statusText}>{c.status}</Text>
            </View>
          </View>
          <View style={styles.campaignStats}>
            <Text style={styles.campStat}><Ionicons name="eye" size={12} /> {c.impressions}</Text>
            <Text style={styles.campStat}><Ionicons name="finger-print" size={12} /> {c.clicks}</Text>
            <Text style={styles.campStat}><Ionicons name="cash" size={12} /> {c.spend}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050816' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  title: { fontSize: 32, fontWeight: 'bold', color: 'white' },
  createBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#6366F1', padding: 10, borderRadius: 12, gap: 6 },
  createText: { color: 'white', fontSize: 13, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 16 },
  statBox: { flex: 1, backgroundColor: '#1E293B', borderRadius: 12, padding: 14, alignItems: 'center' },
  statNum: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  statLabel: { color: '#94A3B8', fontSize: 11, marginTop: 2 },
  sectionTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginHorizontal: 16, marginBottom: 12 },
  campaignCard: { backgroundColor: '#1E293B', marginHorizontal: 16, padding: 16, borderRadius: 12, marginBottom: 8 },
  campaignHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  campaignName: { color: 'white', fontSize: 16, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusActive: { backgroundColor: '#10B98130' },
  statusPaused: { backgroundColor: '#F59E0B30' },
  statusText: { fontSize: 11, fontWeight: 'bold', color: '#94A3B8' },
  campaignStats: { flexDirection: 'row', gap: 16 },
  campStat: { color: '#94A3B8', fontSize: 12 },
});
