import { View, ScrollView, StyleSheet } from 'react-native';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SafeAreaWrapper } from '@/components/ui/SafeAreaWrapper';
import { Card } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { useTransitGuarantees } from '@/lib/domains/civic/border/hooks/useTransitGuarantees';
import { Text } from 'react-native';

export default function CorridorsList() {
  const { data: guarantees, isLoading } = useTransitGuarantees();
  return (
    <SafeAreaWrapper>
      <ScreenHeader title="Trade Corridors" subtitle="Transit guarantee tracking" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {isLoading && <LoadingState message="Loading corridors..." />}
        {!isLoading && guarantees?.length === 0 && <EmptyState message="No active corridors" />}
        {guarantees?.map(guarantee => (
          <Card key={guarantee.id} style={styles.guaranteeCard}>
            <View style={styles.header}>
              <Text style={styles.ref}>Ref: {guarantee.guarantee_ref}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(guarantee.status) }]}>
                <Text style={styles.statusText}>{guarantee.status}</Text>
              </View>
            </View>
            <Text style={styles.detail}>Corridor: {guarantee.corridor_name}</Text>
            <Text style={styles.detail}>Operator: {guarantee.operator_name}</Text>
            <Text style={styles.detail}>Value: {guarantee.guarantee_value} {guarantee.currency}</Text>
            <View style={styles.routeBox}>
              <Text style={styles.routeText}>📍 {guarantee.origin_border} → {guarantee.destination_border}</Text>
            </View>
            <Text style={styles.date}>Valid until: {new Date(guarantee.expiry_date).toLocaleDateString()}</Text>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaWrapper>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'active': return '#10b981';
    case 'expired': return '#ef4444';
    case 'pending': return '#f59e0b';
    case 'suspended': return '#8b5cf6';
    default: return '#64748b';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  guaranteeCard: { padding: 16, marginBottom: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  ref: { color: '#e2e8f0', fontSize: 14, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  detail: { color: '#94a3b8', fontSize: 13, marginBottom: 2 },
  routeBox: { backgroundColor: '#1e293b', padding: 10, borderRadius: 6, marginTop: 8, marginBottom: 8 },
  routeText: { color: '#3b82f6', fontSize: 13, fontWeight: '600' },
  date: { color: '#64748b', fontSize: 11 },
});
