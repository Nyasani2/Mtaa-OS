import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useParole } from '../hooks/useParole';

interface Props {
  inmateId?: string;
}

export default function ParoleReviewsList({ inmateId }: Props) {
  const { reviews, loading } = useParole(inmateId);

  if (loading) return <Text>Loading reviews...</Text>;

  return (
    <FlatList
      data={reviews}
      keyExtractor={(item: any) => item.id}
      renderItem={({ item }: { item: any }) => (
        <View style={styles.card}>
          <Text style={styles.name}>{item.inmate?.first_name} {item.inmate?.last_name}</Text>
          <Text>Review Date: {item.review_date}</Text>
          <Text>Behavior: {item.behavior_score}/10</Text>
          <Text>Work: {item.work_performance}/10</Text>
          <Text>Recommendation: {item.recommendation}</Text>
          {item.conditions && <Text>Conditions: {item.conditions.join(', ')}</Text>}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', padding: 12, marginBottom: 8, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  name: { fontWeight: '600', fontSize: 16, marginBottom: 8 }
});
