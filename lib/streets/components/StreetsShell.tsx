import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const services = [
  { icon: 'navigate', label: 'Navigation', color: '#4F46E5' },
  { icon: 'restaurant', label: 'Food', color: '#F59E0B' },
  { icon: 'medical', label: 'Health', color: '#DC2626' },
  { icon: 'cash', label: 'ATM', color: '#059669' },
  { icon: 'gas-station', label: 'Fuel', color: '#D97706' },
  { icon: 'car', label: 'Parking', color: '#7C3AED' },
];

export function StreetsShell() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Streets</Text>
      </View>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#94A3B8" />
        <TextInput style={styles.searchInput} placeholder="Search places..." placeholderTextColor="#64748B" />
      </View>
      <View style={styles.mapPlaceholder}>
        <Ionicons name="map" size={48} color="#334155" />
        <Text style={styles.mapText}>Map View</Text>
      </View>
      <Text style={styles.sectionTitle}>Nearby Services</Text>
      <View style={styles.grid}>
        {services.map((s, i) => (
          <TouchableOpacity key={i} style={[styles.serviceCard, { backgroundColor: s.color + '15' }]}>
            <Ionicons name={s.icon as any} size={24} color={s.color} />
            <Text style={styles.serviceLabel}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050816' },
  header: { padding: 20, paddingTop: 60 },
  title: { fontSize: 32, fontWeight: 'bold', color: 'white' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', marginHorizontal: 16, padding: 12, borderRadius: 12 },
  searchInput: { flex: 1, color: 'white', marginLeft: 10, fontSize: 14 },
  mapPlaceholder: { height: 200, backgroundColor: '#1E293B', margin: 16, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  mapText: { color: '#64748B', marginTop: 8 },
  sectionTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginHorizontal: 16, marginTop: 8, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 },
  serviceCard: { width: '30%', aspectRatio: 1, margin: '1.5%', borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  serviceLabel: { color: 'white', fontSize: 12, marginTop: 6 },
});
