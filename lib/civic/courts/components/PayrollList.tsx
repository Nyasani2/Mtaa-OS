import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { usePayroll } from '../hooks/usePayroll';

interface Props {
  courtHouseId?: string;
  period?: string;
}

export default function PayrollList({ courtHouseId, period }: Props) {
  const { payrolls, loading } = usePayroll(courtHouseId, period);

  if (loading) return <Text>Loading payroll...</Text>;

  return (
    <FlatList
      data={payrolls}
      keyExtractor={(item: any) => item.id}
      renderItem={({ item }: { item: any }) => (
        <View style={styles.row}>
          <Text>{item.staff_id}</Text>
          <Text>${(item.base_salary || 0).toFixed(2)}</Text>
          <Text>{(item.overtime_hours || 0).toFixed(1)}h</Text>
          <Text>${(item.deductions || 0).toFixed(2)}</Text>
          <Text style={styles.net}>${(item.net_pay || 0).toFixed(2)}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center' },
  net: { fontWeight: '600', color: '#2e7d32' }
});
