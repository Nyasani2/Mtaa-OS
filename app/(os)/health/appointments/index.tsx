// @ts-nocheck
import React, { useState, useCallback } from 'react';
import { Alert, View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, ChevronRight, AlertCircle, CheckCircle2, RefreshCw, Filter } from 'lucide-react-native';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Colors } from '@/constants/Colors';
import { useAppointments } from '@/lib/health/hooks/useAppointments';

export default function AppointmentsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  
  const { data: appointments, isLoading, error, refresh, cancelAppointment, bookAppointment } = useAppointments(user?.id);

  const filtered = appointments?.filter((a: any) => {
    const isPast = new Date(a.scheduled_date) < new Date();
    return activeTab === 'upcoming' ? !isPast : isPast;
  }) || [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleCancel = useCallback(async (id: string) => {
    Alert.alert('Cancel Appointment', 'Are you sure?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes', style: 'destructive', onPress: async () => {
        const res = await cancelAppointment(id);
        if (!res.success) Alert.alert('Error', res.error);
      }}
    ]);
  }, [cancelAppointment]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return '#3b82f6';
      case 'completed': return '#10b981';
      case 'cancelled': return '#ef4444';
      case 'no_show': return '#f59e0b';
      case 'in_progress': return '#8b5cf6';
      default: return '#64748b';
    }
  };

  if (isLoading && !refreshing) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Appointments</Text>
          <Text style={styles.subtitle}>{filtered.length} {activeTab} appointments</Text>
        </View>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/health/find-care' as any)}>
          <Filter size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]} onPress={() => setActiveTab('upcoming')}>
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>Upcoming</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'past' && styles.tabActive]} onPress={() => setActiveTab('past')}>
          <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>Past</Text>
        </TouchableOpacity>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} showsVerticalScrollIndicator={false}>
        {error ? (
          <View style={styles.errorState}>
            <AlertCircle size={40} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={refresh}><Text style={styles.retryText}>Retry</Text></TouchableOpacity>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={40} color="#ccc" />
            <Text style={styles.emptyText}>No {activeTab} appointments</Text>
            {activeTab === 'upcoming' && (
              <TouchableOpacity style={styles.bookBtn} onPress={() => router.push('/health/find-care' as any)}>
                <Text style={styles.bookBtnText}>Book Appointment</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filtered.map((appt: any) => (
            <TouchableOpacity key={appt.id} style={styles.card} onPress={() => router.push({ pathname: '/(os)/health/appointments/detail', params: { id: appt.id } } as any)}>
              <View style={styles.cardHeader}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appt.status) + '15' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(appt.status) }]}>{appt.status.replace('_', ' ')}</Text>
                </View>
                {appt.status === 'scheduled' && (
                  <TouchableOpacity onPress={(e) => { e.stopPropagation(); handleCancel(appt.id); }}>
                    <AlertCircle size={20} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.doctorName}>{appt.doctor_name || 'Unknown Doctor'}</Text>
              <Text style={styles.facilityName}>{appt.hospital_name || 'Unknown Facility'}</Text>
              <View style={styles.cardFooter}>
                <View style={styles.footerItem}>
                  <Calendar size={12} color="#888" />
                  <Text style={styles.footerText}>{new Date(appt.scheduled_date).toLocaleDateString()}</Text>
                </View>
                <View style={styles.footerItem}>
                  <Text style={styles.footerText}>{appt.scheduled_time || 'TBD'}</Text>
                </View>
                <ChevronRight size={16} color="#ccc" />
              </View>
            </TouchableOpacity>
          ))
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '700', color: '#1a1a1a' },
  subtitle: { fontSize: 13, color: '#666', marginTop: 2 },
  iconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  tabBar: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12, gap: 8 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#E8E8E8', alignItems: 'center' },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 13, color: '#666', fontWeight: '500' },
  tabTextActive: { color: '#fff' },
  card: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 14 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  doctorName: { fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginBottom: 2 },
  facilityName: { fontSize: 13, color: '#666', marginBottom: 8 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 12, color: '#888' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorState: { alignItems: 'center', padding: 40 },
  errorText: { color: '#ef4444', marginTop: 12, textAlign: 'center' },
  retryBtn: { marginTop: 16, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 14, color: '#999', marginTop: 12 },
  bookBtn: { marginTop: 16, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  bookBtnText: { color: '#fff', fontWeight: '600' },
  bottomPadding: { height: 32 }
});
