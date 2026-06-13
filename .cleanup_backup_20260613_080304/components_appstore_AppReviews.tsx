import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

interface Review {
  id: string;
  user: string;
  rating: number;
  comment: string;
}

interface Props {
  appId: string;
}

export function AppReviews({ appId }: Props) {
  const reviews: Review[] = [];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reviews</Text>
      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.review}>
            <Text style={styles.user}>{item.user}</Text>
            <Text style={styles.rating}>{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}</Text>
            <Text style={styles.comment}>{item.comment}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No reviews yet</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  review: { backgroundColor: '#1a1a1a', padding: 16, borderRadius: 12, marginBottom: 8 },
  user: { color: '#fff', fontWeight: '600' },
  rating: { color: '#ffaa00', marginVertical: 4 },
  comment: { color: '#aaa', fontSize: 14 },
  empty: { color: '#666', textAlign: 'center', marginTop: 24 },
});

export default AppReviews;
