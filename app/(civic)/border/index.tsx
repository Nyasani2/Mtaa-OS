import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBorderPosts } from '@/lib/domains/civic/border/hooks/useBorderPosts';
import { useBorderAlerts } from '@/lib/domains/civic/border/hooks/useBorderAlerts';
import BorderNav from '@/lib/domains/civic/border/components/BorderNav';
import StatsCard from '@/lib/domains/civic/border/components/StatsCard';

export default function BorderScreen() {
  const router = useRouter();
  const { posts, loading: postsLoading } = useBorderPosts();
  const { alerts, loading: alertsLoading } = useBorderAlerts();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <BorderNav title="Border Management" />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <View style={styles.statsRow}>
          <StatsCard label="Active Posts" value={posts?.length || 0} icon="map-outline" color="#3B82F6" />
          <StatsCard label="Alerts" value={alerts?.length || 0} icon="warning-outline" color="#EF4444" />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(civic)/border/posts')}>
            <Ionicons name="location-outline" size={28} color="#3B82F6" />
            <Text style={styles.actionText}>Border Posts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(civic)/border/inspections')}>
            <Ionicons name="search-outline" size={28} color="#10B981" />
            <Text style={styles.actionText}>Inspections</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(civic)/border/cargo')}>
            <Ionicons name="cube-outline" size={28} color="#F59E0B" />
            <Text style={styles.actionText}>Cargo Manifests</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(civic)/border/transit')}>
            <Ionicons name="airplane-outline" size={28} color="#8B5CF6" />
            <Text style={styles.actionText}>Transit</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Alerts */}
        <Text style={styles.sectionTitle}>Recent Alerts</Text>
        {alerts?.slice(0, 3).map((alert: any) => (
          <View key={alert.id} style={styles.alertCard}>
            <Ionicons name="warning" size={20} color="#EF4444" />
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
    borderLeftColor: '#EF4444',
  },
  alertTitle: { color: '#fff', fontSize: 15, fontWeight: '600' },
  alertDesc: { color: '#9ca3af', fontSize: 13, marginTop: 2 },
});
