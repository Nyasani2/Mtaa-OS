import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useImmigrationStats } from '@/lib/domains/civic/immigration/hooks/useImmigrationStats';
import { useImmigrationAlerts } from '@/lib/domains/civic/immigration/hooks/useImmigrationAlerts';
import ImmigrationNav from '@/lib/domains/civic/immigration/components/ImmigrationNav';
import StatsCard from '@/lib/domains/civic/immigration/components/StatsCard';

export default function ImmigrationScreen() {
  const router = useRouter();
  const { stats, loading } = useImmigrationStats();
  const { alerts } = useImmigrationAlerts();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ImmigrationNav title="Immigration Services" />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <View style={styles.statsRow}>
          <StatsCard label="Active Visas" value={stats?.active_visas || 0} icon="card-outline" color="#3B82F6" />
          <StatsCard label="Overstays" value={stats?.overstays || 0} icon="time-outline" color="#EF4444" />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(civic)/immigration/visas')}>
            <Ionicons name="card-outline" size={28} color="#3B82F6" />
            <Text style={styles.actionText}>Visas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(civic)/immigration/passports')}>
            <Ionicons name="book-outline" size={28} color="#10B981" />
            <Text style={styles.actionText}>Passports</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(civic)/immigration/permits')}>
            <Ionicons name="document-outline" size={28} color="#F59E0B" />
            <Text style={styles.actionText}>Work Permits</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(civic)/immigration/alerts')}>
            <Ionicons name="notifications-outline" size={28} color="#EF4444" />
            <Text style={styles.actionText}>Alerts</Text>
          </TouchableOpacity>
        </View>

        {/* Alerts */}
        <Text style={styles.sectionTitle}>Immigration Alerts</Text>
        {alerts?.slice(0, 3).map((alert: any) => (
          <View key={alert.id} style={styles.alertCard}>
            <AlertBadge severity={alert.severity} />
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

function AlertBadge({ severity }: { severity: string }) {
  const color = severity === 'high' ? '#EF4444' : severity === 'medium' ? '#F59E0B' : '#10B981';
  return <View style={[styles.badge, { backgroundColor: color }]}><Text style={styles.badgeText}>{severity}</Text></View>;
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
    alignItems: 'center',
  },
  alertTitle: { color: '#fff', fontSize: 15, fontWeight: '600' },
  alertDesc: { color: '#9ca3af', fontSize: 13, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
});
