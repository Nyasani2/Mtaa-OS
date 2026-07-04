import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { useAppointments } from '@/lib/health/hooks/useAppointments';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Clock, MapPin, Video, Phone, ChevronLeft } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';

export default function AppointmentsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const mtaaId = user?.id || '';
  const { appointments, upcoming, loading, error, cancel, refresh } = useAppointments(mtaaId);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  const display = tab === 'upcoming' ? upcoming : appointments.filter(
    a => ['completed', 'cancelled', 'no_show'].includes(a.status)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return { bg: '#E3F2FD', text: '#1565C0' };
      case 'confirmed': return { bg: '#E8F5E9', text: '#2E7D32' };
      case 'completed': return { bg: '#F5F5F5', text: '#616161' };
      case 'cancelled': return { bg: '#FFEBEE', text: '#C62828' };
      case 'no_show': return { bg: '#FFF3E0', text: '#EF6C00' };
      default: return { bg: '#F5F5F5', text: '#616161' };
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appointments</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => {}}>
          <Text style={styles.addText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'upcoming' && styles.tabActive]}
          onPress={() => setTab('upcoming')}
        >
          <Text style={[styles.tabText, tab === 'upcoming' && styles.tabTextActive]}>
            Upcoming ({upcoming.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'past' && styles.tabActive]}
          onPress={() => setTab('past')}
        >
          <Text style={[styles.tabText, tab === 'past' && styles.tabTextActive]}>
            Past
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} />
        }
      >
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading appointments...</Text>
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={refresh}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : display.length === 0 ? (
          <View style={styles.centered}>
            <Calendar size={48} color="#ccc" />
            <Text style={styles.emptyTitle}>No {tab} appointments</Text>
            <Text style={styles.emptySub}>
              {tab === 'upcoming'
                ? 'You have no upcoming appointments scheduled.'
                : 'No past appointments found.'}
            </Text>
          </View>
        ) : (
          display.map(a => {
            const status = getStatusColor(a.status);
            return (
              <View key={a.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.doctorRow}>
                    <Text style={styles.doctorName}>{a.doctorName}</Text>
                    <View style={[styles.badge, { backgroundColor: status.bg }]}>
                      <Text style={[styles.badgeText, { color: status.text }]}>
                        {a.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.specialty}>{a.specialty}</Text>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.infoRow}>
                    <MapPin size={14} color="#888" />
                    <Text style={styles.infoText}>{a.hospitalName}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Calendar size={14} color="#888" />
                    <Text style={styles.infoText}>{a.appointmentDate}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Clock size={14} color="#888" />
                    <Text style={styles.infoText}>{a.appointmentTime}</Text>
                  </View>
                  {a.type === 'telemedicine' && (
                    <View style={styles.infoRow}>
                      <Video size={14} color="#10b981" />
                      <Text style={[styles.infoText, { color: '#10b981' }]}>Telemedicine</Text>
                    </View>
                  )}
                  <Text style={styles.reason}>{a.reason}</Text>
                </View>

                {a.status === 'scheduled' && (
                  <View style={styles.actions}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => {}}>
                      <Text style={styles.actionText}>Reschedule</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.cancelBtn]}
                      onPress={() => cancel(a.id, 'Cancelled by patient')}
                    >
                      <Text style={[styles.actionText, styles.cancelText]}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {a.status === 'confirmed' && (
                  <TouchableOpacity style={styles.joinBtn} onPress={() => {}}>
                    <Text style={styles.joinText}>
                      {a.type === 'telemedicine' ? 'Join Video Call' : 'Check In'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  addBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  addText: { fontSize: 28, fontWeight: '300', color: Colors.primary },
  tabs: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabText: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  tabTextActive: { color: Colors.primary, fontWeight: '600' },
  content: { padding: 16 },
  centered: { alignItems: 'center', marginTop: 80 },
  loadingText: { fontSize: 14, color: '#6b7280', marginTop: 12 },
  errorText: { fontSize: 14, color: '#C62828', marginBottom: 16 },
  retryBtn: {
    backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#374151', marginTop: 16 },
  emptySub: { fontSize: 13, color: '#9ca3af', marginTop: 4, textAlign: 'center', paddingHorizontal: 40 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  cardHeader: { marginBottom: 12 },
  doctorRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  doctorName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  specialty: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  cardBody: { gap: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 13, color: '#4b5563' },
  reason: { fontSize: 12, color: '#9ca3af', marginTop: 4, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  actionBtn: {
    flex: 1, backgroundColor: '#F3F4F6', paddingVertical: 10,
    borderRadius: 10, alignItems: 'center',
  },
  actionText: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
  cancelBtn: { backgroundColor: '#FEF2F2' },
  cancelText: { color: '#DC2626' },
  joinBtn: {
    backgroundColor: '#10b981', paddingVertical: 12, borderRadius: 10,
    alignItems: 'center', marginTop: 14,
  },
  joinText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
