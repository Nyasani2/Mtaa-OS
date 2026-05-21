// app/(os)/health/index.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useHealthPatient } from '@/lib/health/hooks/useHealthPatient';
import { Ionicons } from '@expo/vector-icons';

export default function HealthHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { patient, appointments, isLoading } = useHealthPatient(user?.id);

  const menuItems = [
    { icon: 'calendar', label: 'Appointments', route: '/health/appointments', color: '#3B82F6' },
    { icon: 'document-text', label: 'Medical Records', route: '/health/records', color: '#10B981' },
    { icon: 'flask', label: 'Lab Results', route: '/health/lab-tests', color: '#8B5CF6' },
    { icon: 'medical', label: 'Find Hospital', route: '/health/hospitals', color: '#EF4444' },
    { icon: 'car', label: 'Ambulance', route: '/health/ambulance', color: '#F59E0B' },
    { icon: 'shield-checkmark', label: 'Insurance', route: '/health/insurance', color: '#06B6D4' },
    { icon: 'fitness', label: 'Vaccinations', route: '/health/vaccinations', color: '#84CC16' },
    { icon: 'cart', label: 'Pharmacy', route: '/health/pharmacy', color: '#EC4899' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MTAA Health</Text>
        <TouchableOpacity onPress={() => router.push('/health/profile')}>
          <View style={styles.profileBadge}>
            <Ionicons name="person-circle" size={40} color="#3B82F6" />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Your Health Overview</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{appointments.filter(a => a.status === 'scheduled').length}</Text>
              <Text style={styles.statLabel}>Upcoming</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{patient ? 'Active' : 'Not Registered'}</Text>
              <Text style={styles.statLabel}>Status</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Prescriptions</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.emergencyButton} onPress={() => router.push('/health/ambulance')}>
          <Ionicons name="warning" size={24} color="#FFF" />
          <Text style={styles.emergencyText}>Emergency Ambulance</Text>
        </TouchableOpacity>

        <View style={styles.menuGrid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuItem} onPress={() => router.push(item.route as any)}>
              <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon as any} size={28} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#1E293B' },
  profileBadge: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, padding: 16 },
  statsCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  statsTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B', marginBottom: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 20, fontWeight: '700', color: '#3B82F6' },
  statLabel: { fontSize: 12, color: '#64748B', marginTop: 4 },
  emergencyButton: { backgroundColor: '#EF4444', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16, gap: 8 },
  emergencyText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  menuItem: { width: '23%', backgroundColor: '#FFF', borderRadius: 12, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  menuIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  menuLabel: { fontSize: 11, fontWeight: '500', color: '#475569', textAlign: 'center' },
});
