import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { useHealthAppointments } from '@/lib/health/hooks/useHealthAppointments';

export default function AppointmentsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const mtaaId = user?.id || '';
  const { appointments, upcoming, loading, cancel, refresh } = useHealthAppointments(mtaaId);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  const display = tab === 'upcoming' ? upcoming : appointments.filter(a => ['completed', 'cancelled', 'no_show'].includes(a.status));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Appointments</Text>
        <TouchableOpacity onPress={() => {}}>
          <Text style={styles.add}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'upcoming' && styles.tabActive]} onPress={() => setTab('upcoming')}>
          <Text style={[styles.tabText, tab === 'upcoming' && styles.tabTextActive]}>Upcoming</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'past' && styles.tabActive]} onPress={() => setTab('past')}>
          <Text style={[styles.tabText, tab === 'past' && styles.tabTextActive]}>Past</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <Text style={styles.empty}>Loading...</Text>
        ) : display.length === 0 ? (
          <Text style={styles.empty}>No {tab} appointments</Text>
        ) : (
          display.map(a => (
            <View key={a.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.doctor}>{a.doctorName}</Text>
                <View style={[styles.badge, styles[`badge_${a.status}`]]}>
                  <Text style={styles.badgeText}>{a.status}</Text>
                </View>
              </View>
              <Text style={styles.hospital}>{a.hospitalName}</Text>
              <Text style={styles.specialty}>{a.specialty}</Text>
              <Text style={styles.datetime}>{a.appointmentDate} at {a.appointmentTime}</Text>
              <Text style={styles.reason}>{a.reason}</Text>
              {a.type === 'telemedicine' && <Text style={styles.tele}>📹 Telemedicine</Text>}
              {a.status === 'scheduled' && (
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => {}}>
                    <Text style={styles.actionText}>Reschedule</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, styles.cancelBtn]} onPress={() => cancel(a.id, 'Cancelled by patient')}>
                    <Text style={[styles.actionText, styles.cancelText]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}
              {a.status === 'confirmed' && (
                <TouchableOpacity style={styles.joinBtn} onPress={() => {}}>
                  <Text style={styles.joinText}>{a.type === 'telemedicine' ? 'Join Video Call' : 'Check In'}</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
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
  card: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  doctor: { color: '#fff', fontSize: 16, fontWeight: '600' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badge_scheduled: { backgroundColor: '#007AFF33' },
  badge_confirmed: { backgroundColor: '#34C75933' },
  badge_completed: { backgroundColor: '#8883' },
  badge_cancelled: { backgroundColor: '#FF3B3033' },
  badge_no_show: { backgroundColor: '#FF950033' },
  badgeText: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  hospital: { color: '#aaa', fontSize: 13 },
  specialty: { color: '#888', fontSize: 12, marginBottom: 4 },
  datetime: { color: '#007AFF', fontSize: 13, fontWeight: '500', marginBottom: 4 },
  reason: { color: '#888', fontSize: 12 },
  tele: { color: '#34C759', fontSize: 12, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { flex: 1, backgroundColor: '#2a2a2a', padding: 10, borderRadius: 8, alignItems: 'center' },
  actionText: { color: '#007AFF', fontSize: 13, fontWeight: '600' },
  cancelBtn: { backgroundColor: '#FF3B3022' },
  cancelText: { color: '#FF3B30' },
  joinBtn: { backgroundColor: '#34C759', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 12 },
  joinText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
