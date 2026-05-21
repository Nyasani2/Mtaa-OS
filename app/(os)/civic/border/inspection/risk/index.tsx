import { View, ScrollView, StyleSheet } from 'react-native';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SafeAreaWrapper } from '@/components/ui/SafeAreaWrapper';
import { Card } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { useRiskScores } from '@/lib/domains/civic/border/hooks/useRiskScores';
import { Text } from 'react-native';

export default function RiskScoring() {
  const { data: scores, isLoading } = useRiskScores();
  return (
    <SafeAreaWrapper>
      <ScreenHeader title="Risk Scoring" subtitle="AI-powered risk assessment" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {isLoading && <LoadingState message="Loading risk data..." />}
        {!isLoading && scores?.length === 0 && <EmptyState message="No risk assessments" />}
        {scores?.map(score => (
          <Card key={score.id} style={styles.scoreCard}>
            <View style={styles.header}>
              <Text style={styles.entity}>{score.entity_name}</Text>
              <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(score.risk_score) }]}>
                <Text style={styles.scoreText}>{score.risk_score}</Text>
              </View>
            </View>
            <Text style={styles.detail}>Type: {score.entity_type}</Text>
            <Text style={styles.detail}>Manifest: {score.manifest_number}</Text>
            <View style={styles.factorsBox}>
              <Text style={styles.factorsTitle}>Risk Factors:</Text>
              {score.factors?.map((factor: string, idx: number) => (
                <Text key={idx} style={styles.factor}>• {factor}</Text>
              ))}
            </View>
            <Text style={styles.date}>Assessed: {new Date(score.assessed_at).toLocaleDateString()}</Text>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaWrapper>
  );
}

function getScoreColor(score: number) {
  if (score >= 80) return '#ef4444';
  if (score >= 50) return '#f59e0b';
  return '#10b981';
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  scoreCard: { padding: 16, marginBottom: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  entity: { color: '#e2e8f0', fontSize: 15, fontWeight: '700', flex: 1 },
  scoreBadge: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  scoreText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  detail: { color: '#94a3b8', fontSize: 13, marginBottom: 2 },
  factorsBox: { backgroundColor: '#1e293b', padding: 10, borderRadius: 6, marginTop: 8, marginBottom: 8 },
  factorsTitle: { color: '#f59e0b', fontSize: 12, fontWeight: '700', marginBottom: 4 },
  factor: { color: '#e2e8f0', fontSize: 12, marginBottom: 2 },
  date: { color: '#64748b', fontSize: 11 },
});
