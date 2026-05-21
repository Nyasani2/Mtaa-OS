// app/(os)/health/appointments.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useHealthPatient } from '@/lib/health/hooks/useHealthPatient';
import { HealthAppointment } from '@/lib/health/types';
import { Ionicons } from '@expo/vector-icons';

export default function AppointmentsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { appointments, isLoading, refresh } = useHealthPatient(user?.id);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => { setRefreshing(true); await refresh(); setRefreshing(false); };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: '#3B82F6', confirmed: '#10B981', checked_in: '#F59E0B',
      in_progress: '#8B5CF6', completed: '#10B981', cancelled: '#EF4444', no_show: '#6B7280',
    };
    return colors[status] || '#6B7280';
  };

  const renderAppointment = ({ item }: { item: HealthAppointment }) => (
    <TouchableOpacity style={styles.appointmentCard} onPress={() => router.push(`/health/appointment/${item.id}` as any)}>
      <View style={styles.appointmentHeader}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status.replace('_', ' ').toUpperCase()}</Text>
        </View>
        <Text style={styles.appointmentType}>{item.appointment_type}</Text>
      </View>
      <Text style={styles.reason}>{item.reason || 'No reason specified'}</Text>
      <View style={styles.appointmentFooter}>
        <View style={styles.dateTime}>
          <Ionicons name="calendar" size={14} color="#64748B" />
          <Text style={styles.dateTimeText}>{item.scheduled_date}</Text>
        </View>
        <View style={styles.dateTime}>
          <Ionicons name="time" size={14} color="#64748B" />
          <Text style={styles.dateTimeText}>{item.scheduled_time}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appointments</Text>
        <TouchableOpacity onPress={() => router.push('/health/book-appointment' as any)}>
          <Ionicons name="add" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={appointments}
        renderItem={renderAppointment}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>No appointments yet</Text>
            <TouchableOpacity style={styles.bookButton} onPress={() => router.push('/health/book-appointment' as any)}>
              <Text style={styles.bookButtonText}>Book Appointment</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B' },
  list: { padding: 16, gap: 12 },
  appointmentCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  appointmentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '600' },
  appointmentType: { fontSize: 12, color: '#64748B', textTransform: 'capitalize' },
  reason: { fontSize: 14, color: '#1E293B', marginBottom: 12 },
  appointmentFooter: { flexDirection: 'row', gap: 16 },
  dateTime: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateTimeText: { fontSize: 12, color: '#64748B' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#64748B', marginTop: 12, marginBottom: 20 },
  bookButton: { backgroundColor: '#3B82F6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  bookButtonText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
});
