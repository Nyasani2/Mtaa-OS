import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useAttendance } from '../hooks/useAttendance';
import { formatDate } from '@/lib/utils';

interface Props {
  courtHouseId: string;
  date?: string;
}

export default function AttendanceList({ courtHouseId, date }: Props) {
  const { records, loading } = useAttendance(courtHouseId, date);

  if (loading) return <Text>Loading...</Text>;

  return (
    <FlatList
      data={records}
      keyExtractor={(item: any) => item.id}
      renderItem={({ item }: { item: any }) => (
        <View style={styles.row}>
          <Text>{item.staff_id}</Text>
          <Text>{formatDate(item.shift_date)}</Text>
          <Text>{item.hours_worked}h</Text>
          <Text style={[styles.badge, { backgroundColor: item.status === 'present' ? '#4caf50' : '#f44336' }]}>
            {item.status}
          </Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, color: '#fff', fontSize: 10 }
});
