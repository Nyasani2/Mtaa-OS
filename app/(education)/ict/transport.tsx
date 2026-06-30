import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TransportScreen() {
  const router = useRouter();
  const [routes] = useState([
    { id: '1', name: 'Route A - Karen', stops: 12, students: 45, driver: 'James Mwangi', status: 'active', vehicle: 'KBZ 123X' },
    { id: '2', name: 'Route B - Westlands', stops: 8, students: 32, driver: 'Peter Kamau', status: 'active', vehicle: 'KCY 456Y' },
    { id: '3', name: 'Route C - Eastleigh', stops: 15, students: 58, driver: 'Ali Hassan', status: 'delayed', vehicle: 'KDA 789Z' },
    { id: '4', name: 'Route D - Kibera', stops: 10, students: 38, driver: 'Grace Wanjiku', status: 'active', vehicle: 'KBE 012A' },
  ]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Transport</Text>
        <TouchableOpacity><Ionicons name="add" size={24} color="#fff" /></TouchableOpacity>
      </View>
      <ScrollView style={styles.content}>
        {routes.map((route) => (
          <TouchableOpacity key={route.id} style={styles.routeCard}>
            <View style={styles.routeHeader}>
              <View style={[styles.statusDot, { backgroundColor: route.status === 'active' ? '#10b981' : '#f59e0b' }]} />
              <Text style={styles.routeName}>{route.name}</Text>
            </View>
            <View style={styles.routeDetails}>
              <View style={styles.detailItem}><Ionicons name="bus-outline" size={16} color="#94a3b8" /><Text style={styles.detailText}>{route.vehicle}</Text></View>
              <View style={styles.detailItem}><Ionicons name="person-outline" size={16} color="#94a3b8" /><Text style={styles.detailText}>{route.driver}</Text></View>
              <View style={styles.detailItem}><Ionicons name="location-outline" size={16} color="#94a3b8" /><Text style={styles.detailText}>{route.stops} stops</Text></View>
              <View style={styles.detailItem}><Ionicons name="people-outline" size={16} color="#94a3b8" /><Text style={styles.detailText}>{route.students} students</Text></View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1e3a5f', paddingTop: 50, paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  content: { padding: 16 },
  routeCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  routeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  routeName: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  routeDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 13, color: '#64748b' },
});
