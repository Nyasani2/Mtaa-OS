import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { CourtNav } from '../../../../lib/civic/courts/components/CourtNav';
import { useCourts } from '../../../../lib/civic/courts/hooks/useCourts';

const courtModules = [
  { id: 'cases', label: 'Cases', icon: 'gavel', route: '/(os)/civic/courts/cases', color: '#1E40AF' },
  { id: 'hearings', label: 'Hearings', icon: 'mic', route: '/(os)/civic/courts/hearings', color: '#059669' },
  { id: 'judgments', label: 'Judgments', icon: 'check-circle', route: '/(os)/civic/courts/judgments', color: '#7C3AED' },
  { id: 'bails', label: 'Bails', icon: 'unlock', route: '/(os)/civic/courts/bails', color: '#D97706' },
  { id: 'fines', label: 'Fines', icon: 'dollar-sign', route: '/(os)/civic/courts/fines', color: '#DC2626' },
  { id: 'appeals', label: 'Appeals', icon: 'repeat', route: '/(os)/civic/courts/appeals', color: '#0891B2' },
  { id: 'jury', label: 'Jury', icon: 'users', route: '/(os)/civic/courts/jury', color: '#BE185D' },
  { id: 'payroll', label: 'Payroll', icon: 'money-bill-wave', route: '/(os)/civic/courts/payroll', color: '#4338CA' },
];

export default function CourtsIndex() {
  const router = useRouter();
  const { stats } = useCourts();

  return (
    <View style={styles.container}>
      <CourtNav />

      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Courts</Text>
          <Text style={styles.subtitle}>Judicial Case Management</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#EFF6FF' }]}>
            <Text style={[styles.statNumber, { color: '#1E40AF' }]}>{stats?.activeCases || 0}</Text>
            <Text style={styles.statLabel}>Active Cases</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#ECFDF5' }]}>
            <Text style={[styles.statNumber, { color: '#059669' }]}>{stats?.pendingHearings || 0}</Text>
            <Text style={styles.statLabel}>Pending Hearings</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#F5F3FF' }]}>
            <Text style={[styles.statNumber, { color: '#7C3AED' }]}>{stats?.judgmentsThisMonth || 0}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
        </View>

        <View style={styles.modulesGrid}>
          {courtModules.map((mod) => (
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
