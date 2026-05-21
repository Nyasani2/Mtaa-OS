import { View, ScrollView, StyleSheet } from 'react-native';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SafeAreaWrapper } from '@/components/ui/SafeAreaWrapper';
import { Card } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { useContainers } from '@/lib/domains/civic/border/hooks/useContainers';
import { Text } from 'react-native';

export default function ContainersList() {
  const { data: containers, isLoading } = useContainers();
  return (
    <SafeAreaWrapper>
      <ScreenHeader title="Container Tracking" subtitle="Live container status" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {isLoading && <LoadingState message="Loading containers..." />}
        {!isLoading && containers?.length === 0 && <EmptyState message="No containers tracked" />}
        {containers?.map(container => (
          <Card key={container.id} style={styles.containerCard}>
            <View style={styles.header}>
              <Text style={styles.containerId}>{container.container_id}</Text>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(container.status) }]} />
            </View>
            <Text style={styles.detail}>Type: {container.container_type}</Text>
            <Text style={styles.detail}>Location: {container.current_location}</Text>
            <Text style={styles.detail}>Manifest: {container.manifest_number}</Text>
            <View style={styles.timeline}>
              {container.events?.map((event: any, idx: number) => (
                <View key={idx} style={styles.timelineItem}>
                  <View style={styles.timelineDot} />
                  <Text style={styles.timelineText}>{event.description}</Text>
                  <Text style={styles.timelineDate}>{new Date(event.timestamp).toLocaleDateString()}</Text>
                </View>
              ))}
            </View>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaWrapper>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'in_transit': return '#3b82f6';
    case 'at_border': return '#f59e0b';
    case 'cleared': return '#10b981';
    case 'held': return '#ef4444';
    default: return '#64748b';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  containerCard: { padding: 16, marginBottom: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  containerId: { color: '#e2e8f0', fontSize: 15, fontWeight: '700' },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  detail: { color: '#94a3b8', fontSize: 13, marginBottom: 2 },
  timeline: { marginTop: 12, paddingLeft: 8 },
  timelineItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  timelineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#3b82f6' },
  timelineText: { color: '#e2e8f0', fontSize: 12, flex: 1 },
  timelineDate: { color: '#64748b', fontSize: 11 },
});
