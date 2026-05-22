import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

const MOCK_SCHOOLS = [
  { id: '1', name: 'Central High', location: 'Nairobi', type: 'Public', students: 1200 },
  { id: '2', name: 'Greenfield Academy', location: 'Mombasa', type: 'Private', students: 450 },
];

export default function SchoolsPage() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Schools</Text>
      <FlatList
        data={MOCK_SCHOOLS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text>{item.location} • {item.type}</Text>
            <Text>{item.students} students</Text>
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
