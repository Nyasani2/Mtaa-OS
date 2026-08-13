import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const matches = [
  { id: 1, name: 'Sarah', age: 26, distance: '2km' },
  { id: 2, name: 'James', age: 29, distance: '5km' },
  { id: 3, name: 'Amina', age: 24, distance: '1km' },
];

export function HookupShell() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hookup</Text>
        <TouchableOpacity style={styles.filterBtn}>
          <Ionicons name="options" size={20} color="white" />
        </TouchableOpacity>
      </View>
      <Text style={styles.sectionTitle}>Nearby Matches</Text>
      {matches.map((match: any) => (
        <TouchableOpacity key={match.id} style={styles.matchCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color="#6366F1" />
          </View>
          <View style={styles.matchInfo}>
            <Text style={styles.matchName}>{match.name}, {match.age}</Text>
            <Text style={styles.matchDistance}><Ionicons name="location" size={12} /> {match.distance}</Text>
          </View>
          <TouchableOpacity style={styles.likeBtn}>
            <Ionicons name="heart" size={20} color="#EC4899" />
          </TouchableOpacity>
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={styles.discoverBtn}>
        <Text style={styles.discoverText}>Discover More</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050816' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  title: { fontSize: 32, fontWeight: 'bold', color: 'white' },
  filterBtn: { backgroundColor: '#1E293B', padding: 10, borderRadius: 12 },
  sectionTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginHorizontal: 20, marginTop: 8, marginBottom: 12 },
  matchCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', marginHorizontal: 16, padding: 14, borderRadius: 16, marginBottom: 10 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center' },
  matchInfo: { flex: 1, marginLeft: 14 },
  matchName: { color: 'white', fontSize: 16, fontWeight: '600' },
  matchDistance: { color: '#94A3B8', fontSize: 13, marginTop: 2 },
  likeBtn: { backgroundColor: '#EC489920', padding: 10, borderRadius: 12 },
  discoverBtn: { backgroundColor: '#6366F1', marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 12, alignItems: 'center' },
  discoverText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
});
