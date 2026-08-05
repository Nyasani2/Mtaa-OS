import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCustomsStats } from '@/lib/domains/civic/customs/hooks/useCustomsStats';
import { useCustomsAlerts } from '@/lib/domains/civic/customs/hooks/useCustomsAlerts';
import CustomsNav from '@/lib/domains/civic/customs/components/CustomsNav';
import StatsCard from '@/lib/domains/civic/customs/components/StatsCard';

export default function CustomsScreen() {
  const router = useRouter();
  const { stats, loading } = useCustomsStats();
  const { alerts } = useCustomsAlerts();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CustomsNav title="Customs & Excise" />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <View style={styles.statsRow}>
          <StatsCard label="Entries Today" value={stats?.today_entries || 0} icon="document-outline" color="#3B82F6" />
          <StatsCard label="Revenue" value={`KES ${stats?.today_revenue?.toLocaleString() || 0}`} icon="cash-outline" color="#10B981" />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(civic)/customs/entries')}>
            <Ionicons name="document-text-outline" size={28} color="#3B82F6" />
            <Text style={styles.actionText}>Entries</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(civic)/customs/inspections')}>
            <Ionicons name="search-outline" size={28} color="#10B981" />
            <Text style={styles.actionText}>Inspections</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(civic)/customs/warehouses')}>
            <Ionicons name="cube-outline" size={28} color="#F59E0B" />
            <Text style={styles.actionText}>Warehouses</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(civic)/customs/tariffs')}>
            <Ionicons name="list-outline" size={28} color="#8B5CF6" />
            <Text style={styles.actionText}>Tariffs</Text>
          </TouchableOpacity>
        </View>

        {/* Alerts */}
        <Text style={styles.sectionTitle}>Customs Alerts</Text>
        {alerts?.slice(0, 3).map((alert: any) => (
          <View key={alert.id} style={styles.alertCard}>
            <Ionicons name="warning" size={20} color="#F59E0B" />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.alertTitle}>{alert.title}</Text>
              <Text style={styles.alertDesc}>{alert.description}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  scroll: { flex: 1, paddingHorizontal: 16 },
  statsRow: { flexDirection: 'row', gap: 12, marginVertical: 16 },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  actionCard: {
    width: '47%',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  actionText: { color: '#fff', marginTop: 8, fontSize: 13, fontWeight: '600' },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 20, marginBottom: 12 },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  alertTitle: { color: '#fff', fontSize: 15, fontWeight: '600' },
  alertDesc: { color: '#9ca3af', fontSize: 13, marginTop: 2 },
});
