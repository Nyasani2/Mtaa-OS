import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { useHealthMedications } from '@/lib/health/hooks/useHealthMedications';

export default function MedicationsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const mtaaId = user?.id || '';
  const { activeMedications, todaysSchedule, loading, log } = useHealthMedications(mtaaId);
  const [tab, setTab] = useState<'today' | 'all'>('today');

  async function markTaken(medId: string, scheduledTime: string) {
    await log({ medicationId: medId, patientId: mtaaId, takenAt: new Date().toISOString(), scheduledTime, status: 'taken' });
  }

  async function markSkipped(medId: string, scheduledTime: string) {
    await log({ medicationId: medId, patientId: mtaaId, takenAt: new Date().toISOString(), scheduledTime, status: 'skipped', notes: 'Skipped by user' });
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Medications</Text>
        <TouchableOpacity onPress={() => {}}>
          <Text style={styles.add}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'today' && styles.tabActive]} onPress={() => setTab('today')}>
          <Text style={[styles.tabText, tab === 'today' && styles.tabTextActive]}>Today</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'all' && styles.tabActive]} onPress={() => setTab('all')}>
          <Text style={[styles.tabText, tab === 'all' && styles.tabTextActive]}>All Active ({activeMedications.length})</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <Text style={styles.empty}>Loading...</Text>
        ) : tab === 'today' ? (
          todaysSchedule.length === 0 ? (
            <Text style={styles.empty}>No medications scheduled today</Text>
          ) : (
            todaysSchedule.map((s, i) => (
              <View key={i} style={styles.scheduleCard}>
                <View style={styles.scheduleHeader}>
                  <Text style={styles.scheduleMed}>{s.medication.name}</Text>
                  <Text style={[styles.scheduleStatus, s.status === 'taken' ? styles.taken : s.status === 'pending' ? styles.pending : styles.missed]}>
                    {s.status === 'taken' ? '✅ Taken' : s.status === 'pending' ? '⏳ Pending' : '❌ Missed'}
                  </Text>
                </View>
                <Text style={styles.scheduleTime}>{s.scheduledTime}</Text>
                <Text style={styles.scheduleDose}>{s.medication.dosage} — {s.medication.frequency}</Text>
                {s.status === 'pending' && (
                  <View style={styles.scheduleActions}>
                    <TouchableOpacity style={styles.takeBtn} onPress={() => markTaken(s.medication.id, s.scheduledTime)}>
                      <Text style={styles.takeText}>✓ Take</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.skipBtn} onPress={() => markSkipped(s.medication.id, s.scheduledTime)}>
                      <Text style={styles.skipText}>Skip</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )
        ) : (
          activeMedications.length === 0 ? (
            <Text style={styles.empty}>No active medications</Text>
          ) : (
            activeMedications.map(m => (
              <View key={m.id} style={styles.medCard}>
                <Text style={styles.medName}>{m.name}</Text>
                <Text style={styles.medDetail}>{m.dosage} — {m.frequency}</Text>
                <Text style={styles.medDetail}>Prescribed by: {m.prescribedBy}</Text>
                <Text style={styles.medDetail}>Duration: {m.duration}</Text>
                {m.instructions && <Text style={styles.medInstructions}>{m.instructions}</Text>}
                {m.refillDate && (
                  <Text style={styles.refill}>Refill by: {m.refillDate}</Text>
                )}
              </View>
            ))
          )
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50 },
  back: { color: '#fff', fontSize: 22 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  add: { color: '#007AFF', fontSize: 28, fontWeight: '300' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#2a2a2a' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#007AFF' },
  tabText: { color: '#888', fontSize: 14 },
  tabTextActive: { color: '#fff', fontWeight: '600' },
  content: { padding: 16 },
  empty: { color: '#666', textAlign: 'center', marginTop: 60, fontSize: 14 },
  scheduleCard: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, marginBottom: 12 },
  scheduleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  scheduleMed: { color: '#fff', fontSize: 16, fontWeight: '600' },
  scheduleStatus: { fontSize: 12, fontWeight: '600' },
  taken: { color: '#34C759' },
  pending: { color: '#FF9500' },
  missed: { color: '#FF3B30' },
  scheduleTime: { color: '#007AFF', fontSize: 14, fontWeight: '500' },
  scheduleDose: { color: '#888', fontSize: 12, marginTop: 2 },
  scheduleActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  takeBtn: { flex: 1, backgroundColor: '#34C759', padding: 10, borderRadius: 8, alignItems: 'center' },
  takeText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  skipBtn: { flex: 1, backgroundColor: '#2a2a2a', padding: 10, borderRadius: 8, alignItems: 'center' },
  skipText: { color: '#888', fontSize: 13 },
  medCard: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, marginBottom: 12 },
  medName: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  medDetail: { color: '#888', fontSize: 12, marginBottom: 2 },
  medInstructions: { color: '#aaa', fontSize: 12, marginTop: 6, fontStyle: 'italic' },
  refill: { color: '#FF9500', fontSize: 12, marginTop: 6 },
});
