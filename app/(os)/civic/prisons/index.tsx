import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { PrisonNav } from '../../../../lib/civic/prisons/components/PrisonNav';
import { usePrisonStats } from '../../../../lib/civic/prisons/hooks/usePrisonStats';

const prisonModules = [
  { id: 'inmates', label: 'Inmates', icon: 'user', route: '/(os)/civic/prisons/inmates', color: '#1E40AF' },
  { id: 'cells', label: 'Cells', icon: 'th', route: '/(os)/civic/prisons/cells', color: '#059669' },
  { id: 'visits', label: 'Visits', icon: 'user-check', route: '/(os)/civic/prisons/visits', color: '#7C3AED' },
  { id: 'incidents', label: 'Incidents', icon: 'exclamation-triangle', route: '/(os)/civic/prisons/incidents', color: '#D97706' },
  { id: 'movements', label: 'Movements', icon: 'exchange-alt', route: '/(os)/civic/prisons/movements', color: '#DC2626' },
  { id: 'parole', label: 'Parole', icon: 'door-open', route: '/(os)/civic/prisons/parole', color: '#0891B2' },
  { id: 'wardens', label: 'Wardens', icon: 'user-shield', route: '/(os)/civic/prisons/wardens', color: '#BE185D' },
  { id: 'payroll', label: 'Payroll', icon: 'money-bill-wave', route: '/(os)/civic/prisons/payroll', color: '#4338CA' },
];

export default function PrisonsIndex() {
  const router = useRouter();
  const { stats } = usePrisonStats();

  return (
    <View style={styles.container}>
      <PrisonNav />

      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Prisons</Text>
          <Text style={styles.subtitle}>Correctional Facility Management</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#EFF6FF' }]}>
            <Text style={[styles.statNumber, { color: '#1E40AF' }]}>{stats?.totalInmates || 0}</Text>
            <Text style={styles.statLabel}>Total Inmates</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#ECFDF5' }]}>
            <Text style={[styles.statNumber, { color: '#059669' }]}>{stats?.availableCells || 0}</Text>
            <Text style={styles.statLabel}>Available Cells</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
            <Text style={[styles.statNumber, { color: '#D97706' }]}>{stats?.pendingVisits || 0}</Text>
            <Text style={styles.statLabel}>Pending Visits</Text>
          </View>
        </View>

        <View style={styles.modulesGrid}>
          {prisonModules.map((mod) => (
            <TouchableOpacity
              key={mod.id}
              style={[styles.moduleCard, { borderLeftColor: mod.color }]}
              onPress={() => router.push(mod.route as any)}
            >
              <View style={[styles.iconContainer, { backgroundColor: mod.color + '15' }]}>
                <FontAwesome5 name={mod.icon} size={22} color={mod.color} />
              </View>
              <Text style={styles.moduleLabel}>{mod.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16 },
  header: { marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '800', color: '#0F172A' },
  subtitle: { fontSize: 14, color: '#64748B', marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  statNumber: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#64748B', marginTop: 4 },
  modulesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  moduleCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  moduleLabel: { fontSize: 13, fontWeight: '600', color: '#334155' },
});
