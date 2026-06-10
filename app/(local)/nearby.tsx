import React from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';

const services = [
  { id: 'navigation', name: 'Navigation', icon: '🧭', color: '#1a237e' },
  { id: 'food', name: 'Food', icon: '🍴', color: '#3e2723' },
  { id: 'health', name: 'Health', icon: '🏥', color: '#4a148c' },
  { id: 'atm', name: 'ATM', icon: '🏧', color: '#004d40' },
  { id: 'fuel', name: 'Fuel', icon: '⛽', color: '#e65100' },
  { id: 'parking', name: 'Parking', icon: '🅿️', color: '#0d47a1' },
];

export default function NearbyScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Nearby</Text>

      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search places..."
          placeholderTextColor="#888"
        />
      </View>

      <View style={styles.mapCard}>
        <Pressable onPress={() => router.push('/map')} style={styles.mapPlaceholder}>
          <Text style={styles.mapIcon}>🗺️</Text>
          <Text style={styles.mapLabel}>Map View</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Nearby Services</Text>

      <ScrollView contentContainerStyle={styles.grid}>
        {services.map((service) => (
          <Pressable
            key={service.id}
            style={[styles.serviceCard, { backgroundColor: service.color + '20' }]}
            onPress={() => router.push(`/nearby/${service.id}`)}
          >
            <Text style={styles.serviceIcon}>{service.icon}</Text>
            <Text style={styles.serviceName}>{service.name}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0e1a', padding: 16 },
  header: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 16 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1f2e',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, color: '#fff', fontSize: 15 },
  mapCard: {
    backgroundColor: '#1a1f2e',
    borderRadius: 16,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  mapPlaceholder: { alignItems: 'center' },
  mapIcon: { fontSize: 40, marginBottom: 8 },
  mapLabel: { color: '#888', fontSize: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 12 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 40,
  },
  serviceCard: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceIcon: { fontSize: 28, marginBottom: 6 },
  serviceName: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
