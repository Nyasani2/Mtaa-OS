import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const photos = [
  { id: 1, label: 'Camera' },
  { id: 2, label: 'Screenshots' },
  { id: 3, label: 'Downloads' },
  { id: 4, label: 'MTAA' },
];

export function GalleryShell() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gallery</Text>
        <TouchableOpacity style={styles.addBtn}>
          <Ionicons name="camera" size={20} color="white" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={photos}
        numColumns={2}
        keyExtractor={p => p.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.albumCard}>
            <View style={styles.albumThumb}>
              <Ionicons name="images" size={32} color="#64748B" />
            </View>
            <Text style={styles.albumLabel}>{item.label}</Text>
            <Text style={styles.albumCount}>24 items</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ padding: 12 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050816' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  title: { fontSize: 32, fontWeight: 'bold', color: 'white' },
  addBtn: { backgroundColor: '#6366F1', padding: 10, borderRadius: 12 },
  albumCard: { flex: 1, margin: 6, backgroundColor: '#1E293B', borderRadius: 16, overflow: 'hidden' },
  albumThumb: { height: 120, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' },
  albumLabel: { color: 'white', fontSize: 14, fontWeight: '600', padding: 12, paddingBottom: 4 },
  albumCount: { color: '#64748B', fontSize: 12, paddingHorizontal: 12, paddingBottom: 12 },
});
