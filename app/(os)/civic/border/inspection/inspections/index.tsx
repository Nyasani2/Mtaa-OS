import { View, ScrollView, StyleSheet } from 'react-native';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SafeAreaWrapper } from '@/components/ui/SafeAreaWrapper';
import { Card } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { useInspections } from '@/lib/domains/civic/border/hooks/useInspections';
import { Text } from 'react-native';

export default function InspectionsList() {
  const { data: inspections, isLoading } = useInspections();
  return (
    <SafeAreaWrapper>
      <ScreenHeader title="Inspections" subtitle="Physical inspection records" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {isLoading && <LoadingState message="Loading inspections..." />}
        {!isLoading && inspections?.length === 0 && <EmptyState message="No inspections recorded" />}
        {inspections?.map(inspection => (
          <Card key={inspection.id} style={styles.inspectionCard}>
            <View style={styles.header}>
              <Text style={styles.id}>#{inspection.inspection_id}</Text>
              <View style={[styles.resultBadge, { backgroundColor: getResultColor(inspection.result) }]}>
                <Text style={styles.resultText}>{inspection.result}</Text>
              </View>
            </View>
            <Text style={styles.detail}>Type: {inspection.inspection_type}</Text>
            <Text style={styles.detail}>Officer: {inspection.officer_name}</Text>
            <Text style={styles.detail}>Container: {inspection.container_id || 'N/A'}</Text>
            {inspection.findings && (
              <View style={styles.findingsBox}>
                <Text style={styles.findingsTitle}>Findings:</Text>
                <Text style={styles.findingsText}>{inspection.findings}</Text>
              </View>
            )}
            <Text style={styles.date}>{new Date(inspection.created_at).toLocaleString()}</Text>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaWrapper>
  );
}

function getResultColor(result: string) {
  switch (result) {
    case 'cleared': return '#10b981';
    case 'flagged': return '#ef4444';
    case 'pending': return '#f59e0b';
    default: return '#64748b';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  inspectionCard: { padding: 16, marginBottom: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  id: { color: '#e2e8f0', fontSize: 14, fontWeight: '700' },
  resultBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  resultText: { color: '#fff', fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  detail: { color: '#94a3b8', fontSize: 13, marginBottom: 2 },
  findingsBox: { backgroundColor: '#1e293b', padding: 10, borderRadius: 6, marginTop: 8, marginBottom: 8 },
  findingsTitle: { color: '#f59e0b', fontSize: 12, fontWeight: '700', marginBottom: 4 },
  findingsText: { color: '#e2e8f0', fontSize: 12 },
  date: { color: '#64748b', fontSize: 11, marginTop: 4 },
});
