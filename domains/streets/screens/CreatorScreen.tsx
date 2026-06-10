// domains/streets/screens/CreatorScreen.tsx
// MTAA Streets — Creator Dashboard (FIXED imports)

import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useCreator } from '../hooks/useCreator';

export default function CreatorScreen() {
  const { dashboard, earnings, activeTab, setActiveTab, withdrawEarnings } = useCreator();

  const tabs = ['overview', 'subscribers', 'earnings', 'content'];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Creator Dashboard</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{dashboard?.totalViews || 0}</Text>
            <Text style={styles.statLabel}>Total Views</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{dashboard?.subscriberCount || 0}</Text>
            <Text style={styles.statLabel}>Subscribers</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>${dashboard?.totalEarnings || '0.00'}</Text>
            <Text style={styles.statLabel}>Earnings</Text>
          </View>
        </View>
      </View>

      <View style={styles.tabs}>
        {tabs.map(tab => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {activeTab === 'overview' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <Pressable style={styles.actionBtn} onPress={() => router.push('/streets/live')}>
            <Text>🔴 Go Live</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={() => router.push('/streets/create')}>
            <Text>📝 Create Post</Text>
          </Pressable>
        </View>
      )}

      {activeTab === 'earnings' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Withdraw</Text>
          <Pressable style={styles.withdrawBtn} onPress={() => withdrawEarnings?.mutate?.(earnings?.available || 0)}>
            <Text style={styles.withdrawText}>Withdraw ${earnings?.available || '0.00'}</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#E91E63', padding: 20 },
  title: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', padding: 12, borderRadius: 8 },
  statNum: { color: '#fff', fontSize: 18, fontWeight: '700' },
  statLabel: { color: '#fff', opacity: 0.8, fontSize: 11 },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#E91E63' },
  tabText: { fontSize: 13, color: '#888', textTransform: 'capitalize' },
  activeTabText: { color: '#E91E63', fontWeight: '700' },
  section: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  actionBtn: { backgroundColor: '#fff', padding: 14, borderRadius: 8, marginBottom: 8 },
  withdrawBtn: { backgroundColor: '#4CAF50', padding: 14, borderRadius: 8, alignItems: 'center' },
  withdrawText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
