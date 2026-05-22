import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useVisits } from '../hooks/useVisits';
import { formatDate } from '@/lib/utils';

interface Props {
  facilityId?: string;
  inmateId?: string;
}

export default function VisitsList({ facilityId, inmateId }: Props) {
  const { visits, loading } = useVisits(facilityId, inmateId);

  if (loading) return <Text>Loading visits...</Text>;

  return (
    <FlatList
      data={visits}
      keyExtractor={(item: any) => item.id}
      renderItem={({ item }: { item: any }) => (
        <View style={styles.card}>
          <Text style={styles.name}>{item.visitor_name}</Text>
          <Text>Inmate: {item.inmate?.first_name} {item.inmate?.last_name}</Text>
          <Text>{formatDate(item.scheduled_at || '')} — {item.duration_minutes}min</Text>
          <Text>Type: {item.visit_type}</Text>
          <Text>Relationship: {item.visitor_relationship}</Text>
          {item.check_in && <Text>Checked in: {formatDate(item.check_in)}</Text>}
          {item.check_out && <Text>Checked out: {formatDate(item.check_out)}</Text>}
          {item.items_seized && <Text>Items seized: {item.items_seized.join(', ')}</Text>}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', padding: 12, marginBottom: 8, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  name: { fontWeight: '600', fontSize: 16, marginBottom: 4 }
});
