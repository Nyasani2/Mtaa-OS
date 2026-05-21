import { View, ScrollView, StyleSheet } from 'react-native';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SafeAreaWrapper } from '@/components/ui/SafeAreaWrapper';
import { Card } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { useBorderPosts } from '@/lib/domains/civic/border/hooks/useBorderPosts';
import { Text } from 'react-native';

export default function CheckpointsList() {
  const { data: posts, isLoading } = useBorderPosts();
  return (
    <SafeAreaWrapper>
      <ScreenHeader title="Checkpoints" subtitle="Border post status" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {isLoading && <LoadingState message="Loading checkpoints..." />}
        {!isLoading && posts?.length === 0 && <EmptyState message="No checkpoints configured" />}
        {posts?.map(post => (
          <Card key={post.id} style={styles.checkpointCard}>
            <View style={styles.header}>
              <Text style={styles.name}>{post.name}</Text>
              <View style={[styles.statusDot, { backgroundColor: post.is_active ? '#10b981' : '#ef4444' }]} />
            </View>
            <Text style={styles.detail}>📍 {post.location}</Text>
            <Text style={styles.detail}>Type: {post.post_type}</Text>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{post.officers_on_duty || 0}</Text>
                <Text style={styles.statLabel}>Officers</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{post.crossings_today || 0}</Text>
                <Text style={styles.statLabel}>Today</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{post.pending_inspections || 0}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
            </View>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  checkpointCard: { padding: 16, marginBottom: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  name: { color: '#e2e8f0', fontSize: 15, fontWeight: '700' },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  detail: { color: '#94a3b8', fontSize: 13, marginBottom: 4 },
  statsRow: { flexDirection: 'row', gap: 16, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#1e293b' },
  statBox: { alignItems: 'center', flex: 1 },
  statValue: { color: '#e2e8f0', fontSize: 18, fontWeight: '700' },
  statLabel: { color: '#64748b', fontSize: 11, marginTop: 2 },
});
