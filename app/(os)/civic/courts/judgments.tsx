import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { CourtNav } from '../../../../../lib/civic/courts/components/CourtNav';
import { JudgmentsList } from '../../../../../lib/civic/courts/components/JudgmentsList';
import { useJudgments } from '../../../../../lib/civic/courts/hooks/useJudgments';

export default function CourtJudgments() {
  const { judgments, isLoading } = useJudgments();

  return (
    <View style={styles.container}>
      <CourtNav />

      <View style={styles.header}>
        <Text style={styles.title}>Judgments</Text>
      </View>

      <ScrollView style={styles.content}>
        <JudgmentsList judgments={judgments || []} isLoading={isLoading} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
  content: { padding: 16 },
});
