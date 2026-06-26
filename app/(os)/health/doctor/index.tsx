import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Users, Calendar, Clock, ChevronRight, Search, Filter,
  Stethoscope, FileText, MessageSquare, AlertCircle,
  CheckCircle2, XCircle, Timer
} from 'lucide-react-native';
import { useHealthStore } from '@/lib/health/state/health.store';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Colors } from '@/constants/Colors';

interface PatientQueueItem {
  id: string;
  patient: {
    id: string;
    profile: { full_name: string; phone: string; avatar_url?: string };
    patient_number: string;
  };
  appointment_type: string;
  status: string;
  scheduled_at: string;
  chief_complaint?: string;
  checked_in_at?: string;
}

export default function DoctorWorkspaceScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'queue' | 'schedule' | 'patients'>('queue');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [queue, setQueue] = useState<PatientQueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    setLoading(true);
    setTimeout(() => {
      setQueue([
        {
          id: '1', patient: {
            id: 'p1', profile: { full_name: 'John Kamau', phone: '+254712345678', patient_number: 'PT-001' },
            patient_number: 'PT-001'
          },
          appointment_type: 'consultation', status: 'checked_in',
          scheduled_at: new Date().toISOString(), chief_complaint: 'Fever and headache for 3 days'
        },
        {
          id: '2', patient: {
            id: 'p2', profile: { full_name: 'Mary Wanjiku', phone: '+254723456789', patient_number: 'PT-002' },
            patient_number: 'PT-002'
          },
          appointment_type: 'follow_up', status: 'scheduled',
          scheduled_at: new Date(Date.now() + 3600000).toISOString(), chief_complaint: 'Diabetes follow-up'
        },
        {
          id: '3', patient: {
            id: 'p3', profile: { full_name: 'Peter Ochieng', phone: '+254734567890', patient_number: 'PT-003' },
            patient_number: 'PT-003'
          },
          appointment_type: 'emergency', status: 'in_progress',
          scheduled_at: new Date().toISOString(), chief_complaint: 'Chest pain'
        },
      ]);
      setLoading(false);
    }, 800);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadQueue();
    setRefreshing(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'checked_in': return <CheckCircle2 size={16} color="#4CAF50" />;
      case 'in_progress': return <Timer size={16} color="#FF9800" />;
      case 'scheduled': return <Clock size={16} color="#2196F3" />;
      default: return <AlertCircle size={16} color="#999" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'checked_in': return '#4CAF50';
      case 'in_progress': return '#FF9800';
      case 'scheduled': return '#2196F3';
      default: return '#999';
    }
  };

  const filteredQueue = queue.filter(q =>
    q.patient.profile.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.patient.patient_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    waiting: queue.filter(q => q.status === 'checked_in').length,
    inProgress: queue.filter(q => q.status === 'in_progress').length,
    completed: queue.filter(q => q.status === 'completed').length,
    totalToday: queue.length
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Doctor Workspace</Text>
          <Text style={styles.subGreeting}>Dr. {profile?.full_name || 'Workspace'}</Text>
        </View>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/(os)/health/doctor/schedule')}>
          <Calendar size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.waiting}</Text>
          <Text style={styles.statLabel}>Waiting</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.inProgress}</Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Done</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalToday}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      <View style={styles.tabBar}>
        {(['queue', 'schedule', 'patients'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.searchBar}>
        <Search size={18} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search patients..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity>
          <Filter size={18} color="#999" />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'queue' && (
          <>
            {loading ? (
              <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} />
            ) : filteredQueue.length === 0 ? (
              <View style={styles.emptyState}>
                <Users size={40} color="#ccc" />
                <Text style={styles.emptyText}>No patients in queue</Text>
              </View>
            ) : (
              filteredQueue.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.queueCard}
                  onPress={() => router.push({
                    pathname: '/(os)/health/doctor/patient-detail',
                    params: { patientId: item.patient.id, appointmentId: item.id }
                  } as any)}
                >
                  <View style={styles.queueHeader}>
                    <View style={styles.patientInfo}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                          {item.patient.profile.full_name.split(' ').map((n: string) => n[0]).join('')}
                        </Text>
                      </View>
                      <View style={styles.patientDetails}>
                        <Text style={styles.patientName}>{item.patient.profile.full_name}</Text>
                        <Text style={styles.patientId}>{item.patient.patient_number}</Text>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
                      {getStatusIcon(item.status)}
                      <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {item.status.replace('_', ' ')}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.queueBody}>
                    <View style={styles.infoRow}>
                      <Stethoscope size={14} color="#666" />
                      <Text style={styles.infoText}>{item.appointment_type.replace('_', ' ')}</Text>
                    </View>
                    {item.chief_complaint && (
                      <View style={styles.infoRow}>
                        <AlertCircle size={14} color="#666" />
                        <Text style={styles.infoText} numberOfLines={1}>{item.chief_complaint}</Text>
                      </View>
                    )}
                    <View style={styles.infoRow}>
                      <Clock size={14} color="#666" />
                      <Text style={styles.infoText}>
                        {new Date(item.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.queueActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => router.push({
                        pathname: '/(os)/health/doctor/clinical-notes',
                        params: { patientId: item.patient.id, appointmentId: item.id }
                      } as any)}
                    >
                      <FileText size={16} color={Colors.primary} />
                      <Text style={styles.actionText}>Notes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => router.push({
                        pathname: '/(os)/health/doctor/orders',
                        params: { patientId: item.patient.id }
                      } as any)}
                    >
                      <Stethoscope size={16} color={Colors.primary} />
                      <Text style={styles.actionText}>Orders</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                      <MessageSquare size={16} color={Colors.primary} />
                      <Text style={styles.actionText}>Message</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </>
        )}

        {activeTab === 'schedule' && (
          <View style={styles.emptyState}>
            <Calendar size={40} color="#ccc" />
            <Text style={styles.emptyText}>Schedule view coming soon</Text>
          </View>
        )}

        {activeTab === 'patients' && (
          <View style={styles.emptyState}>
            <Users size={40} color="#ccc" />
            <Text style={styles.emptyText}>Patient search coming soon</Text>
          </View>
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
  greeting: { fontSize: 22, fontWeight: '700', color: '#1a1a1a' },
  subGreeting: { fontSize: 13, color: '#666', marginTop: 2 },
  iconButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 3, elevation: 2
  },
  statsRow: {
    flexDirection: 'row', paddingHorizontal: 12,
    gap: 8, marginBottom: 12
  },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12,
    padding: 12, alignItems: 'center'
  },
  statValue: { fontSize: 20, fontWeight: '700', color: Colors.primary },
  statLabel: { fontSize: 11, color: '#666', marginTop: 2 },
  tabBar: {
    flexDirection: 'row', paddingHorizontal: 16,
    marginBottom: 12, gap: 8
  },
  tab: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#E8E8E8'
  },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 13, color: '#666', fontWeight: '500' },
  tabTextActive: { color: '#fff' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', marginHorizontal: 16,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
    marginBottom: 12, gap: 8
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1a1a1a' },
  queueCard: {
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 10,
    borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1
  },
  queueHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 10
  },
  patientInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center', alignItems: 'center'
  },
  avatarText: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  patientDetails: {},
  patientName: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  patientId: { fontSize: 12, color: '#888', marginTop: 1 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8
  },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  queueBody: { marginBottom: 10, gap: 6 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { fontSize: 12, color: '#555', flex: 1 },
  queueActions: {
    flexDirection: 'row', borderTopWidth: 1,
    borderTopColor: '#f0f0f0', paddingTop: 10, gap: 16
  },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 12, color: Colors.primary, fontWeight: '500' },
  emptyState: { alignItems: 'center', marginTop: 60, paddingHorizontal: 32 },
  emptyText: { fontSize: 14, color: '#999', marginTop: 12 },
  bottomPadding: { height: 32 }
});
