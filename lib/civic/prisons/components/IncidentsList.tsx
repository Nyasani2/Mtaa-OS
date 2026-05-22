import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useIncidents } from '../hooks/useIncidents';
import { formatDate } from '@/lib/utils';

interface Props {
  facilityId: string;
}

export default function IncidentsList({ facilityId }: Props) {
  const { incidents, loading } = useIncidents(facilityId);

  if (loading) return <Text>Loading incidents...</Text>;

  return (
    <FlatList
      data={incidents}
      keyExtractor={(item: any) => item.id}
      renderItem={({ item }: { item: any }) => (
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.type}>{item.incident_type}</Text>
            <Text style={[styles.badge, { backgroundColor: item.status === 'resolved' ? '#4caf50' : '#ff9800' }]}>
              {item.status}
            </Text>
          </View>
          <Text>{item.description}</Text>
          <Text>Location: {item.location}</Text>
          <Text>Date: {formatDate(item.created_at)}</Text>
          {item.inmate && <Text>Inmate: {item.inmate.first_name} {item.inmate.last_name}</Text>}
          {item.reporter && <Text>Reported by: {item.reporter.first_name} {item.reporter.last_name}</Text>}
          {item.witnesses && <Text>Witnesses: {item.witnesses.join(', ')}</Text>}
          {item.resolution_notes && <Text>Resolution: {item.resolution_notes}</Text>}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', padding: 12, marginBottom: 8, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  type: { fontWeight: '600', fontSize: 16 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, color: '#fff', fontSize: 10 }
});
