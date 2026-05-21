import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../hooks/useAuthStore';
import { useInstalledApps } from '../../../hooks/useInstalledApps';
import { useRecentActivity } from '../../../hooks/useRecentActivity';
import { LoadingState } from '../../../components/ui/LoadingState';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ErrorState } from '../../../components/ui/ErrorState';
import { Card } from '../../../components/ui/Card';
import { SafeAreaWrapper } from '../../../components/ui/SafeAreaWrapper';

const quickActions = [
  { id: 'wallet', label: 'Wallet', icon: 'wallet', route: '/(os)/wallet', color: '#1E40AF' },
  { id: 'mtaxi', label: 'MTaxi', icon: 'taxi', route: '/(os)/mtaxi', color: '#059669' },
  { id: 'marketplace', label: 'Market', icon: 'store', route: '/(os)/marketplace', color: '#7C3AED' },
  { id: 'messages', label: 'Messages', icon: 'comment', route: '/(os)/messages', color: '#10B981' },
  { id: 'health', label: 'Health', icon: 'heartbeat', route: '/(os)/health', color: '#DC2626' },
  { id: 'settings', label: 'Settings', icon: 'cog', route: '/(os)/settings', color: '#64748B' },
];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isLoading: authLoading } = useAuthStore();
  const { apps, isLoading: appsLoading } = useInstalledApps();
  const { activities, isLoading: activityLoading, error, refetch } = useRecentActivity();
  const isLoading = authLoading || appsLoading || activityLoading;

  if (isLoading) return <SafeAreaWrapper><LoadingState message="Loading your dashboard..." /></SafeAreaWrapper>;
  if (error) return <SafeAreaWrapper><ErrorState title="Dashboard unavailable" message={error.message || 'Failed to load dashboard data'} onRetry={refetch} /></SafeAreaWrapper>;

  return (
    <SafeAreaWrapper>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good day,</Text>
            <Text style={styles.name}>{user?.name || 'Officer'}</Text>
          </View>
          <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/(os)/settings/profile')}>
            <FontAwesome5 name="user-circle" size={36} color="#1E40AF" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.quickGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity key={action.id} style={styles.quickItem} onPress={() => router.push(action.route as any)}>
                <View style={[styles.quickIcon, { backgroundColor: action.color + '15' }]}>
                  <FontAwesome5 name={action.icon} size={20} color={action.color} />
                </View>
                <Text style={styles.quickLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {(!activities || activities.length === 0) ? (
            <EmptyState icon="history" title="No recent activity" message="Your recent actions and notifications will appear here" />
          ) : (
            activities.slice(0, 5).map((activity: any) => (
              <Card key={activity.id} title={activity.title} subtitle={activity.time} icon={activity.icon || 'circle'} iconColor={activity.color || '#64748B'} onPress={() => { if (activity.route) router.push(activity.route); }} />
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Apps</Text>
          {(!apps || apps.length === 0) ? (
            <EmptyState icon="th-large" title="No apps installed" message="Browse the AppStore to install apps" actionLabel="Open AppStore" onAction={() => router.push('/(os)/appstore')} />
          ) : (
            <View style={styles.appsRow}>
              {apps.slice(0, 8).map((app: any) => (
                <TouchableOpacity key={app.id} style={styles.appItem} onPress={() => router.push(app.route as any)}>
                  <View style={[styles.appIcon, { backgroundColor: app.color + '15' || '#F1F5F9' }]}>
                    <FontAwesome5 name={app.icon || 'app'} size={20} color={app.color || '#64748B'} />
                  </View>
                  <Text style={styles.appLabel} numberOfLines={1}>{app.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, paddingBottom: 16 },
  greeting: { fontSize: 14, color: '#64748B' },
  name: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginTop: 2 },
  profileBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  section: { marginTop: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#334155', marginBottom: 12 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickItem: { width: '30%', alignItems: 'center', paddingVertical: 14, backgroundColor: '#FFFFFF', borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  quickIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  quickLabel: { fontSize: 12, fontWeight: '600', color: '#334155' },
  appsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  appItem: { width: '22%', alignItems: 'center' },
  appIcon: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  appLabel: { fontSize: 11, fontWeight: '500', color: '#64748B', textAlign: 'center' },
});
