// lib/civic/police/components/CaseCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

interface CaseCardProps {
  caseId: string;
  title: string;
  status: string;
  date: string;
}

export function CaseCard({ caseId, title, status, date }: CaseCardProps) {
  const router = useRouter();

  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push(`/civic/police/cases/${caseId}` as any)}
    >
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.status}>Status: {status}</Text>
      <Text style={styles.date}>{date}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8, marginBottom: 8 },
  title: { fontSize: 16, fontWeight: '600' },
  status: { fontSize: 14, color: '#666', marginTop: 4 },
  date: { fontSize: 12, color: '#999', marginTop: 2 },
});
