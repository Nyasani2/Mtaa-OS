// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function MTruckHaulsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('active');
  
  const hauls = [
    { id: '1', status: 'active', cargo: 'Construction Materials', from: 'Nairobi', to: 'Mombasa', pay: 45000, date: 'Today' },
    { id: '2', status: 'pending', cargo: 'Agricultural Produce', from: 'Nakuru', to: 'Kisumu', pay: 28000, date: 'Tomorrow' },
    { id: '3', status: 'completed', cargo: 'FMCG Goods', from: 'Mombasa', to: 'Nairobi', pay: 42000, date: '2 days ago' },
  ];

  const filteredHauls = hauls.filter(h => activeTab === 'all' || h.status === activeTab);

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return '#84cc16';
      case 'pending': return '#f59e0b';
      case 'completed': return '#3b82f6';
      default: return '#94a3b8';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>My Hauls</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
        {['all', 'active', 'pending', 'completed'].map(tab => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredHauls.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={48} color="#64748b" />
            <Text style={styles.emptyText}>No hauls found</Text>
          </View>
        ) : (
          filteredHauls.map((haul) => (
            <TouchableOpacity key={haul.id} style={styles.haulCard} onPress={() => Alert.alert('Haul Details', `Cargo: ${haul.cargo}\nPay: KES ${haul.pay}`)}>
              <View style={styles.cardHeader}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(haul.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(haul.status) }]}>{haul.status.toUpperCase()}</Text>
                </View>
                <Text style={styles.pay}>KES {haul.pay.toLocaleString()}</Text>
              </View>
              
              <Text style={styles.cargo}>{haul.cargo}</Text>
              
              <View style={styles.routeContainer}>
                <View style={styles.routePoint}>
                  <Ionicons name="location" size={16} color="#84cc16" />
                  <Text style={styles.routeText}>{haul.from}</Text>
                </View>
                <View style={styles.routeLine} />
                <View style={styles.routePoint}>
                  <Ionicons name="flag" size={16} color="#ef4444" />
                  <Text style={styles.routeText}>{haul.to}</Text>
                </View>
              </View>

              <View style={styles.footer}>
                <Text style={styles.date}>{haul.date}</Text>
                <Ionicons name="chevron-forward" size={20} color="#64748b" />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  tabBar: { paddingHorizontal: 16, marginBottom: 16 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1e293b', marginRight: 8 },
  tabActive: { backgroundColor: '#84cc16' },
  tabText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#0f172a' },
  content: { flex: 1, paddingHorizontal: 16 },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#94a3b8', fontSize: 16, marginTop: 12 },
  haulCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },
  pay: { color: '#22c55e', fontSize: 18, fontWeight: '800' },
  cargo: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 12 },
  routeContainer: { marginBottom: 12 },
  routePoint: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  routeText: { color: '#e2e8f0', fontSize: 14, flex: 1 },
  routeLine: { width: 2, height: 16, backgroundColor: '#334155', marginLeft: 7, marginVertical: 4 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 12 },
  date: { color: '#94a3b8', fontSize: 13 },
});
