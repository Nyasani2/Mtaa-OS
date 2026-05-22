import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useJudgments } from '../hooks/useJudgments';
import { formatDate } from '@/lib/utils';

interface Props {
  caseId?: string;
}

export default function JudgmentsList({ caseId }: Props) {
  const { judgments, loading } = useJudgments(caseId);

  if (loading) return <Text>Loading judgments...</Text>;

  return (
    <FlatList
      data={judgments}
      keyExtractor={(item: any) => item.id}
      renderItem={({ item }: { item: any }) => (
        <View style={styles.card}>
          <Text style={styles.type}>{item.judgment_type}</Text>
          <Text>Delivered: {formatDate(item.delivered_date || '')}</Text>
          <Text>{item.summary}</Text>
          {item.sentence_type && <Text>Sentence: {item.sentence_type} ({item.sentence_duration_months} months)</Text>}
          {item.fine_amount ? <Text>Fine: ${item.fine_amount.toFixed(2)}</Text> : null}
          {item.judge && <Text>Judge: {item.judge.first_name} {item.judge.last_name}</Text>}
          <Text>Appealable: {item.is_appealable ? 'Yes' : 'No'}</Text>
          {item.appeal_deadline && <Text>Deadline: {formatDate(item.appeal_deadline)}</Text>}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', padding: 12, marginBottom: 8, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  type: { fontWeight: '600', fontSize: 16, marginBottom: 4 }
});
