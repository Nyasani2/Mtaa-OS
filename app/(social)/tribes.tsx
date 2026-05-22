import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';

const MOCK_TRIBES = [
  { id: '1', name: 'Developers', members: 120 },
  { id: '2', name: 'Designers', members: 85 },
];

export default function TribesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tribes</Text>
      <FlatList
        data={MOCK_TRIBES}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => console.log('Open tribe', item.id)}>
            <Text style={styles.name}>{item.name}</Text>
            <Text>{item.members} members</Text>
          </TouchableOpacity>
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
