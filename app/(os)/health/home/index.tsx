import { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { useHealthProfile } from '@/lib/health/hooks/useHealthProfile';
import { useHealthAppointments } from '@/lib/health/hooks/useHealthAppointments';
import { useHealthMedications } from '@/lib/health/hooks/useHealthMedications';

export default function HealthHomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const mtaaId = user?.id || '';
  const { profile, children, loading: profileLoading } = useHealthProfile(mtaaId);
  const { upcoming, loading: apptLoading } = useHealthAppointments(mtaaId);
  const { activeMedications, todaysSchedule, loading: medLoading } = useHealthMedications(mtaaId);

  const nextAppointment = upcoming[0];
  const medCount = activeMedications.length;
  const childCount = children.length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {profile?.fullName?.split(' ')[0] || 'User'}</Text>
          <Text style={styles.subtitle}>Health Vault</Text>
        </View>
        <TouchableOpacity style={styles.lockBtn} onPress={() => router.push('/(os)/health/share')}>
          <Text style={styles.lockText}>📤 Share</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.sosCard} onPress={() => router.push('/(os)/health/emergency')}>
        <Text style={styles.sosText}>🚨 EMERGENCY SOS</Text>
        <Text style={styles.sosSub}>Tap for immediate help</Text>
      </TouchableOpacity>

      <View style={styles.quickRow}>
        <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(os)/health/timeline')}>
          <Text style={styles.quickIcon}>📋</Text>
          <Text style={styles.quickLabel}>Records</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(os)/health/appointments')}>
          <Text style={styles.quickIcon}>📅</Text>
          <Text style={styles.quickLabel}>Appointments</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(os)/health/medications')}>
          <Text style={styles.quickIcon}>💊</Text>
          <Text style={styles.quickLabel}>Meds</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(os)/health/children')}>
          <Text style={styles.quickIcon}>👶</Text>
          <Text style={styles.quickLabel}>Children</Text>
        </TouchableOpacity>
      </View>

      {nextAppointment && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📅 Next Appointment</Text>
          <Text style={styles.cardText}>{nextAppointment.doctorName}</Text>
          <Text style={styles.cardSub}>{nextAppointment.hospitalName}</Text>
          <Text style={styles.cardSub}>{nextAppointment.appointmentDate} at {nextAppointment.appointmentTime}</Text>
          <TouchableOpacity style={styles.cardAction} onPress={() => router.push('/(os)/health/appointments')}>
            <Text style={styles.cardActionText}>View All</Text>
          </TouchableOpacity>
        </View>
      )}

      {medCount > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💊 Active Medications</Text>
          <Text style={styles.cardText}>{medCount} active prescription{medCount !== 1 ? 's' : ''}</Text>
          {todaysSchedule.slice(0, 3).map((s, i) => (
            <View key={i} style={styles.scheduleRow}>
              <Text style={styles.scheduleMed}>{s.medication.name}</Text>
              <Text style={[styles.scheduleStatus, s.status === 'taken' ? styles.taken : s.status === 'pending' ? styles.pending : styles.missed]}>
                {s.status === 'taken' ? '✅' : s.status === 'pending' ? '⏳' : '❌'} {s.scheduledTime}
              </Text>
            </View>
          ))}
          <TouchableOpacity style={styles.cardAction} onPress={() => router.push('/(os)/health/medications')}>
            <Text style={styles.cardActionText}>Manage</Text>
          </TouchableOpacity>
        </View>
      )}

      {childCount > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>👶 Family</Text>
          <View style={styles.childRow}>
            {children.map(c => (
              <View key={c.id} style={styles.childChip}>
                <Text style={styles.childName}>{c.fullName}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.cardAction} onPress={() => router.push('/(os)/health/children')}>
            <Text style={styles.cardActionText}>Manage Children</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🩸 Emergency Card</Text>
        <Text style={styles.cardSub}>Blood: {profile?.bloodGroup || 'Not set'}</Text>
        <Text style={styles.cardSub}>Allergies: {profile?.allergies?.length ? profile.allergies.join(', ') : 'None recorded'}</Text>
        <TouchableOpacity style={styles.cardAction} onPress={() => router.push('/(os)/health/emergency-card')}>
          <Text style={styles.cardActionText}>Edit Emergency Info</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomPad} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 13, color: '#888' },
  lockBtn: { backgroundColor: '#1a1a1a', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  lockText: { color: '#007AFF', fontSize: 13, fontWeight: '600' },
  sosCard: { backgroundColor: '#FF3B30', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16 },
  sosText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  sosSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4 },
  quickRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  quickBtn: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, alignItems: 'center', width: '23%' },
  quickIcon: { fontSize: 22, marginBottom: 4 },
  quickLabel: { color: '#ccc', fontSize: 11, textAlign: 'center' },
  card: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 8 },
  cardText: { fontSize: 16, color: '#fff', fontWeight: '500' },
  cardSub: { fontSize: 13, color: '#888', marginTop: 2 },
  cardAction: { marginTop: 10, alignSelf: 'flex-start' },
  cardActionText: { color: '#007AFF', fontSize: 13, fontWeight: '600' },
  scheduleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#2a2a2a' },
  scheduleMed: { color: '#fff', fontSize: 13 },
  scheduleStatus: { fontSize: 12 },
  taken: { color: '#34C759' },
  pending: { color: '#FF9500' },
  missed: { color: '#FF3B30' },
  childRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  childChip: { backgroundColor: '#2a2a2a', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  childName: { color: '#fff', fontSize: 13 },
  bottomPad: { height: 40 },
});
