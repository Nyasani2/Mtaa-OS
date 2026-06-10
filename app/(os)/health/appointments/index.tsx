import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Calendar, Clock, ChevronRight, Plus, X, MapPin,
  Stethoscope, CheckCircle2, XCircle, AlertTriangle
} from 'lucide-react-native';
import { useAppointments } from '@/lib/health/hooks/useAppointments';
import { usePatient } from '@/lib/health/hooks/usePatient';
import { useAuthStore } from '@/lib/auth/state/auth.store';
import { Colors } from '@/constants/Colors';

export default function AppointmentsScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { patient } = usePatient(profile?.id);
  const { appointments, loading, refreshAppointments, cancelAppointment } = useAppointments(patient?.id);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'upcoming' | 'past' | 'cancelled'>('all');

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshAppointments();
    setRefreshing(false);
  }, [refreshAppointments]);

  const filteredAppointments = appointments?.filter((appt: any) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'upcoming') return ['scheduled', 'checked_in', 'in_progress'].includes(appt.status);
    if (activeFilter === 'past') return appt.status === 'completed';
    if (activeFilter === 'cancelled') return appt.status === 'cancelled';
    return true;
  }) || [];

  const handleCancel = (apptId: string) => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel Appt',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelAppointment(apptId);
              Alert.alert('Cancelled', 'Your appointment has been cancelled.');
            } catch (err) {
              Alert.alert('Error', 'Failed to cancel appointment.');
            }
          }
        }
      ]
    );
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'scheduled': return { icon: Clock, color: '#2196F3', bg: '#E3F2FD', label: 'Scheduled' };
      case 'checked_in': return { icon: CheckCircle2, color: '#4CAF50', bg: '#E8F5E9', label: 'Checked In' };
      case 'in_progress': return { icon: Stethoscope, color: '#FF9800', bg: '#FFF3E0', label: 'In Progress' };
      case 'completed': return { icon: CheckCircle2, color: '#4CAF50', bg: '#E8F5E9', label: 'Completed' };
      case 'cancelled': return { icon: XCircle, color: '#F44336', bg: '#FFEBEE', label: 'Cancelled' };
      case 'no_show': return { icon: AlertTriangle, color: '#FF9800', bg: '#FFF3E0', label: 'No Show' };
      default: return { icon: Clock, color: '#999', bg: '#f5f5f5', label: status };
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Appointments</Text>
          <Text style={styles.subtitle}>
            {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/(os)/health/appointments/book')}
        >
          <Plus size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        <View style={styles.filterRow}>
          {(['all', 'upcoming', 'past', 'cancelled'] as const).map(filter => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {loading && !refreshing ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} />
        ) : filteredAppointments.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={48} color="#ccc" />
            <Text style={styles.emptyTitle}>No appointments</Text>
            <Text style={styles.emptySubtitle}>
              {activeFilter === 'all' ? 'Book your first appointment to get started' : `No ${activeFilter} appointments`}
            </Text>
            <TouchableOpacity
              style={styles.bookButton}
              onPress={() => router.push('/(os)/health/appointments/book')}
            >
              <Text style={styles.bookButtonText}>Book Appointment</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredAppointments.map((appt: any) => {
            const status = getStatusConfig(appt.status);
            const StatusIcon = status.icon;
            const apptDate = new Date(appt.scheduled_at);
            const isPast = apptDate < new Date();

            return (
              <View key={appt.id} style={styles.appointmentCard}>
                <View style={styles.cardHeader}>
                  <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                    <StatusIcon size={14} color={status.color} />
                    <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                  </View>
                  {appt.status === 'scheduled' && !isPast && (
                    <TouchableOpacity onPress={() => handleCancel(appt.id)}>
                      <X size={18} color="#F44336" />
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  onPress={() => router.push({
                    pathname: '/(os)/health/appointments/detail',
                    params: { id: appt.id }
                  } as any)}
                >
                  <View style={styles.cardBody}>
                    <View style={styles.dateBlock}>
                      <Text style={styles.dateMonth}>{apptDate.toLocaleString('default', { month: 'short' })}</Text>
                      <Text style={styles.dateDay}>{apptDate.getDate()}</Text>
                      <Text style={styles.dateYear}>{apptDate.getFullYear()}</Text>
                    </View>

                    <View style={styles.cardDetails}>
                      <Text style={styles.apptType}>{appt.appointment_type?.replace('_', ' ')}</Text>
                      <View style={styles.detailRow}>
                        <Stethoscope size={13} color="#666" />
                        <Text style={styles.detailText}>
                          Dr. {appt.doctor?.profile?.full_name || 'Unknown'}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Clock size={13} color="#666" />
                        <Text style={styles.detailText}>
                          {apptDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {appt.duration_minutes}min
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <MapPin size={13} color="#666" />
                        <Text style={styles.detailText} numberOfLines={1}>
                          {appt.facility?.name || 'Unknown facility'}
                        </Text>
                      </View>
                      {appt.chief_complaint && (
                        <View style={styles.complaintBox}>
                          <Text style={styles.complaintText} numberOfLines={2}>
                            "{appt.chief_complaint}"
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>

                {appt.status === 'scheduled' && !isPast && (
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => router.push({
                        pathname: '/(os)/health/appointments/detail',
                        params: { id: appt.id }
                      } as any)}
                    >
                      <Text style={styles.actionBtnText}>View Details</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.actionBtnPrimary]}
                      onPress={() => handleCancel(appt.id)}
                    >
                      <Text style={styles.actionBtnTextPrimary}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12
  },
  title: { fontSize: 24, fontWeight: '700', color: '#1a1a1a' },
  subtitle: { fontSize: 13, color: '#666', marginTop: 2 },
  addButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 3
  },
  filterScroll: { maxHeight: 50, marginBottom: 8 },
  filterRow: {
    flexDirection: 'row', paddingHorizontal: 16, gap: 8
  },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 16, backgroundColor: '#E8E8E8'
  },
  filterChipActive: { backgroundColor: Colors.primary },
  filterText: { fontSize: 12, color: '#666', fontWeight: '500' },
  filterTextActive: { color: '#fff' },
  emptyState: {
    alignItems: 'center', marginTop: 60, paddingHorizontal: 32
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginTop: 16 },
  emptySubtitle: { fontSize: 13, color: '#888', marginTop: 6, textAlign: 'center' },
  bookButton: {
    marginTop: 20, backgroundColor: Colors.primary,
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10
  },
  bookButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  appointmentCard: {
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12,
    borderRadius: 16, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10
  },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8
  },
  statusText: { fontSize: 11, fontWeight: '600' },
  cardBody: { flexDirection: 'row', gap: 14 },
  dateBlock: {
    width: 60, alignItems: 'center',
    backgroundColor: '#f8f9fa', borderRadius: 10, paddingVertical: 8
  },
  dateMonth: { fontSize: 11, color: '#666', textTransform: 'uppercase' },
  dateDay: { fontSize: 22, fontWeight: '700', color: Colors.primary },
  dateYear: { fontSize: 10, color: '#999' },
  cardDetails: { flex: 1, gap: 4 },
  apptType: {
    fontSize: 15, fontWeight: '600', color: '#1a1a1a',
    textTransform: 'capitalize'
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  detailText: { fontSize: 12, color: '#555', flex: 1 },
  complaintBox: {
    backgroundColor: '#FFF8E1', borderRadius: 6,
    padding: 8, marginTop: 4
  },
  complaintText: { fontSize: 12, color: '#5D4037', fontStyle: 'italic' },
  cardActions: {
    flexDirection: 'row', gap: 8, marginTop: 12,
    borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 10
  },
  actionBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 8,
    backgroundColor: '#f5f5f5', alignItems: 'center'
  },
  actionBtnPrimary: { backgroundColor: '#FFEBEE' },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: '#333' },
  actionBtnTextPrimary: { fontSize: 12, fontWeight: '600', color: '#F44336' },
  bottomPadding: { height: 32 }
});
