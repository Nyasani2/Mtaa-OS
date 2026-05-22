import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

const MOCK_POSTS = [
  { id: '1', title: 'New Curriculum', content: 'Updated math curriculum for 2024', author: 'Admin', date: '2024-01-15' },
  { id: '2', title: 'Exam Schedule', content: 'Final exams start next week', author: 'Principal', date: '2024-01-14' },
];

export default function FeedPage() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Education Feed</Text>
      <FlatList
        data={MOCK_POSTS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text>{item.content}</Text>
            <Text style={styles.meta}>By {item.author} on {item.date}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  card: { backgroundColor: '#fff', padding: 12, marginBottom: 8, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  cardTitle: { fontWeight: '600', fontSize: 16 },
  meta: { fontSize: 12, color: '#666', marginTop: 4 }
});
