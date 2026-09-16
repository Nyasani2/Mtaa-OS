import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function StaffDashboard() {
  const router = useRouter();
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Staff Workspace</Text>
        <Text style={styles.subtitle}>Manage your patients and daily tasks</Text>
      </View>
      <View style={styles.grid}>
        <TouchableOpacity style={styles.card} onPress={() => router.push('/(os)/health/doctor/queue')}>
          <Ionicons name="people" size={32} color="#0d9488" />
          <Text style={styles.cardTitle}>Patient Queue</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => router.push('/(os)/health/appointments')}>
          <Ionicons name="calendar" size={32} color="#0d9488" />
          <Text style={styles.cardTitle}>My Schedule</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => router.push('/(os)/health/records')}>
          <Ionicons name="document-text" size={32} color="#0d9488" />
          <Text style={styles.cardTitle}>Patient Records</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => router.push('/(os)/health/telemedicine')}>
          <Ionicons name="videocam" size={32} color="#0d9488" />
          <Text style={styles.cardTitle}>Virtual Consults</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 20 },
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1f2937' },
  subtitle: { fontSize: 16, color: '#6b7280', marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48%', backgroundColor: '#ffffff', padding: 20, borderRadius: 16, alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginTop: 12 }
});
