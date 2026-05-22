import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useJury } from '../hooks/useJury';

interface Props {
  caseId?: string;
}

export default function JuryAssignmentsList({ caseId }: Props) {
  const { assignments, loading } = useJury(caseId);

  if (loading) return <Text>Loading assignments...</Text>;

  return (
    <FlatList
      data={assignments}
      keyExtractor={(item: any) => item.id}
      renderItem={({ item }: { item: any }) => (
        <View style={styles.row}>
          <Text>{item.juror?.first_name} {item.juror?.last_name}</Text>
          <Text>{item.is_foreperson ? 'Foreperson' : 'Juror'}</Text>
          <Text>${(item.stipend_amount || 0).toFixed(2)}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center' }
});
