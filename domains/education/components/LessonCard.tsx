import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const STATUS_COLORS: Record<string, string> = {
  scheduled: '#2196f3',
  live: '#4caf50',
  completed: '#9e9e9e',
  cancelled: '#f44336'
};

interface Props {
  lesson: any;
}

export default function LessonCard({ lesson }: Props) {
  const status = lesson?.status || 'scheduled';
  const color = STATUS_COLORS[status] || '#2196f3';

  return (
    <View style={[styles.card, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <Text style={styles.title}>{lesson?.title || 'Untitled'}</Text>
      <Text style={[styles.badge, { backgroundColor: color }]}>{status}</Text>
      <Text>{lesson?.scheduled_at || 'No date'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', padding: 12, marginBottom: 8, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  title: { fontWeight: '600', fontSize: 16 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, color: '#fff', fontSize: 10, alignSelf: 'flex-start', marginTop: 4 }
});
