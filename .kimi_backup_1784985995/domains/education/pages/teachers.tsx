import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

const MOCK_TEACHERS = [
  { id: '1', name: 'John Doe', subject: 'Mathematics', school: 'Central High' },
  { id: '2', name: 'Jane Smith', subject: 'English', school: 'Greenfield Academy' },
];

export default function TeachersPage() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Teachers</Text>
      <FlatList
        data={MOCK_TEACHERS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text>{item.subject}</Text>
            <Text>{item.school}</Text>
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
  name: { fontWeight: '600', fontSize: 16 }
});
