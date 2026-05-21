import { View, ScrollView, StyleSheet } from 'react-native';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SafeAreaWrapper } from '@/components/ui/SafeAreaWrapper';
import { StatsCard } from '@/lib/domains/civic/border/components/StatsCard';
import { AlertBadge } from '@/lib/domains/civic/border/components/AlertBadge';
import { Card } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useBorderAlerts } from '@/lib/domains/civic/border/hooks/useBorderAlerts';
import { useBorderPosts } from '@/lib/domains/civic/border/hooks/useBorderPosts';
import { Text } from 'react-native';

export default function BorderDashboard() {
  const { data: alerts, isLoading: alertsLoading, error: alertsError } = useBorderAlerts();
  const { data: posts, isLoading: postsLoading } = useBorderPosts();
  const activeAlerts = alerts?.filter(a => !a.resolved_at) || [];
  const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');

  if (alertsLoading || postsLoading) return <SafeAreaWrapper><LoadingState message="Loading border data..." /></SafeAreaWrapper>;
  if (alertsError) return <SafeAreaWrapper><ErrorState message="Failed to load border data" /></SafeAreaWrapper>;

  return (
    <SafeAreaWrapper>
      <ScreenHeader title="Border Command Centre" subtitle="Real-time border monitoring" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.statsGrid}>
          <StatsCard label="Active Posts" value={posts?.length || 0} icon="🏛️" color="#10b981" />
          <StatsCard label="Active Alerts" value={activeAlerts.length} icon="🚨" color={criticalAlerts.length > 0 ? "#ef4444" : "#f59e0b"} />
          <StatsCard label="Officers On Duty" value={posts?.reduce((sum, p) => sum + (p.officers_on_duty || 0), 0) || 0} icon="👮" color="#3b82f6" />
          <StatsCard label="Crossings Today" value={posts?.reduce((sum, p) => sum + (p.crossings_today || 0), 0) || 0} icon="🚶" color="#8b5cf6" />
        </View>
        {criticalAlerts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Critical Alerts</Text>
            {criticalAlerts.map(alert => <AlertBadge key={alert.id} alert={alert} />)}
          </View>
        )}
        {activeAlerts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Alerts</Text>
            {activeAlerts.slice(0, 5).map(alert => <AlertBadge key={alert.id} alert={alert} />)}
          </View>
        )}
        {activeAlerts.length === 0 && (
          <Card style={styles.emptyCard}><Text style={styles.emptyText}>All clear — no active alerts</Text></Card>
        )}
      </ScrollView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  section: { marginBottom: 20 },
  sectionTitle: { color: '#e2e8f0', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  emptyCard: { padding: 24, alignItems: 'center' },
  emptyText: { color: '#10b981', fontSize: 14, fontWeight: '600' },
});
