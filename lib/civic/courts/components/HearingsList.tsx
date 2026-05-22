import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useHearings } from '../hooks/useHearings';
import { formatDate } from '@/lib/utils';

interface Props {
  courtHouseId?: string;
  caseId?: string;
}

export default function HearingsList({ courtHouseId, caseId }: Props) {
  const { hearings, loading } = useHearings(courtHouseId, caseId);

  if (loading) return <Text>Loading hearings...</Text>;

  return (
    <FlatList
      data={hearings}
      keyExtractor={(item: any) => item.id}
      renderItem={({ item }: { item: any }) => (
        <View style={styles.card}>
          <Text style={styles.type}>{item.hearing_type}</Text>
          <Text>Room: {item.court_room?.name || item.court_room_id}</Text>
          <Text>Date: {formatDate(item.scheduled_date || '')}</Text>
          {item.presiding_judge && <Text>Judge: {item.presiding_judge.first_name} {item.presiding_judge.last_name}</Text>}
          {item.adjournment_reason && <Text>Adjourned: {item.adjournment_reason}</Text>}
          <Text style={[styles.badge, { backgroundColor: item.status === 'completed' ? '#4caf50' : '#ff9800' }]}>
            {item.status}
          </Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', padding: 12, marginBottom: 8, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  type: { fontWeight: '600', fontSize: 16, marginBottom: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, color: '#fff', fontSize: 10, alignSelf: 'flex-start', marginTop: 4 }
});
