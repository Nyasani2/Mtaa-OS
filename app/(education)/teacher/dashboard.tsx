// @ts-nocheck
import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TeacherDashboardScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, Mr. Kamau</Text>
        <Text style={styles.subtitle}>Here's your teaching overview for today.</Text>
      </View>
      
      <View style={styles.statsRow}>
        <StatCard label="My Classes" value="4" icon="people" color="#3b82f6" />
        <StatCard label="Pending Grading" value="12" icon="clipboard" color="#f59e0b" />
        <StatCard label="Attendance" value="95%" icon="checkmark-circle" color="#10b981" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Schedule</Text>
        <TouchableOpacity style={styles.classCard} onPress={() => router.push('/(education)/classes')}>
          <View style={styles.timeBadge}><Text style={styles.timeText}>09:00</Text></View>
          <View style={styles.classInfo}>
            <Text style={styles.className}>Mathematics - Form 3A</Text>
            <Text style={styles.classRoom}>Room 204 • 45 mins</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.classCard} onPress={() => router.push('/(education)/classes')}>
          <View style={styles.timeBadge}><Text style={styles.timeText}>11:00</Text></View>
          <View style={styles.classInfo}>
            <Text style={styles.className}>Physics - Form 4B</Text>
            <Text style={styles.classRoom}>Lab 3 • 45 mins</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function StatCard({ label, value, icon, color }: any) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  greeting: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
  statsRow: { flexDirection: 'row', padding: 16, gap: 12 },
  statCard: { flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 12, borderLeftWidth: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  statValue: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginTop: 8 },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  classCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  timeBadge: { backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginRight: 12 },
  timeText: { color: '#3b82f6', fontWeight: '700', fontSize: 14 },
  classInfo: { flex: 1 },
  className: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  classRoom: { fontSize: 13, color: '#64748b', marginTop: 2 },
});
