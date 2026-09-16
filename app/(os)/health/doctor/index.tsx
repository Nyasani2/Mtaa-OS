// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator, RefreshControl, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Ionicons } from '@expo/vector-icons';

export default function DoctorWorkstationPro() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, schedule, inbox, patients
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data States
  const [dashboardData, setDashboardData] = useState({
    totalPatients: 0,
    criticalResults: 0,
    pendingTasks: 0,
    todayAppointments: 0
  });
  const [appointments, setAppointments] = useState([]);
  const [inboxItems, setInboxItems] = useState([]);
  const [myPatients, setMyPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadAllData();
  }, [activeTab]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Load Dashboard Stats
      const [apptsResult, criticalResults, tasks, patients] = await Promise.all([
        supabase.from('health_appointments').select('id').eq('scheduled_date', today),
        supabase.from('health_lab_results').select('id').eq('is_critical', true).eq('status', 'new'),
        supabase.from('health_tasks').select('id').eq('assigned_to', user.id).eq('status', 'pending'),
        supabase.from('health_patients').select('id').eq('primary_doctor_id', user.id)
      ]);

      setDashboardData({
        totalPatients: patients?.length || 0,
        criticalResults: criticalResults?.length || 0,
        pendingTasks: tasks?.length || 0,
        todayAppointments: apptsResult?.length || 0
      });

      // Load Appointments for Today
      if (activeTab === 'schedule' || activeTab === 'dashboard') {
        const { data: apptData } = await supabase
          .from('health_appointments')
          .select(`
            id,
            appointment_code,
            status,
            scheduled_time,
            reason,
            chief_complaint,
            patient:health_patients(id, first_name, last_name, age, gender, phone)
          `)
          .eq('scheduled_date', today)
          .order('scheduled_time', { ascending: true });
        setAppointments(apptData || []);
      }

      // Load Inbox (Critical Results & Messages)
      if (activeTab === 'inbox' || activeTab === 'dashboard') {
        const { data: inboxData } = await supabase
          .from('health_lab_results')
          .select(`
            id,
            test_name,
            result_value,
            is_critical,
            status,
            created_at,
            order:health_lab_orders!inner(patient_id, patient:health_patients(first_name, last_name))
          `)
          .eq('status', 'new')
          .order('is_critical', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(20);
        setInboxItems(inboxData || []);
      }

      // Load My Patients
      if (activeTab === 'patients') {
        const { data: patData } = await supabase
          .from('health_patients')
          .select('*')
          .eq('primary_doctor_id', user.id)
          .order('last_name', { ascending: true })
          .limit(50);
        setMyPatients(patData || []);
      }

    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getAcuityColor = (status) => {
    if (status === 'critical') return '#ef4444';
    if (status === 'urgent') return '#f59e0b';
    return '#10b981';
  };

  const getAppointmentStatusColor = (status) => {
    switch(status) {
      case 'completed': return '#10b981';
      case 'checked_in': return '#3b82f6';
      case 'waiting': return '#f59e0b';
      default: return '#64748b';
    }
  };

  // --- RENDER COMPONENTS ---
  const renderDashboard = () => (
    <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAllData(); }} />}>
      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
            <Ionicons name="calendar" size={24} color="#3b82f6" />
          </View>
          <Text style={styles.statNumber}>{dashboardData.todayAppointments}</Text>
          <Text style={styles.statLabel}>Today's Patients</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
            <Ionicons name="alert-circle" size={24} color="#ef4444" />
          </View>
          <Text style={styles.statNumber}>{dashboardData.criticalResults}</Text>
          <Text style={styles.statLabel}>Critical Results</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
            <Ionicons name="list" size={24} color="#f59e0b" />
          </View>
          <Text style={styles.statNumber}>{dashboardData.pendingTasks}</Text>
          <Text style={styles.statLabel}>Pending Tasks</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
            <Ionicons name="people" size={24} color="#10b981" />
          </View>
          <Text style={styles.statNumber}>{dashboardData.totalPatients}</Text>
          <Text style={styles.statLabel}>My Patients</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/health/doctor/new-appointment')}>
            <Ionicons name="add-circle" size={32} color="#3b82f6" />
            <Text style={styles.actionText}>New Appointment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/health/doctor/prescriptions')}>
            <Ionicons name="medkit" size={32} color="#10b981" />
            <Text style={styles.actionText}>Prescriptions</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/health/doctor/lab-orders')}>
            <Ionicons name="flask" size={32} color="#f59e0b" />
            <Text style={styles.actionText}>Lab Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/health/doctor/referrals')}>
            <Ionicons name="share-social" size={32} color="#8b5cf6" />
            <Text style={styles.actionText}>Referrals</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Today's Schedule Preview */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Schedule</Text>
          <TouchableOpacity onPress={() => setActiveTab('schedule')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        {appointments.slice(0, 5).map((appt, idx) => (
          <TouchableOpacity key={idx} style={styles.scheduleItem} onPress={() => router.push(`/health/doctor/patient/${appt.patient.id}`)}>
            <View style={styles.timeSlot}>
              <Text style={styles.timeText}>{appt.scheduled_time?.substring(0,5) || 'TBD'}</Text>
            </View>
            <View style={styles.scheduleInfo}>
              <Text style={styles.scheduleName}>{appt.patient?.first_name} {appt.patient?.last_name}</Text>
              <Text style={styles.scheduleReason}>{appt.chief_complaint || appt.reason || 'Consultation'}</Text>
            </View>
            <View style={[styles.statusDot, { backgroundColor: getAppointmentStatusColor(appt.status) }]} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Critical Results Preview */}
      {dashboardData.criticalResults > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>️ Critical Results</Text>
            <TouchableOpacity onPress={() => setActiveTab('inbox')}>
              <Text style={styles.seeAllText}>Review</Text>
            </TouchableOpacity>
          </View>
          {inboxItems.filter(item => item.is_critical).slice(0, 3).map((item, idx) => (
            <View key={idx} style={styles.criticalResultCard}>
              <Ionicons name="alert-circle" size={20} color="#ef4444" />
              <View style={styles.criticalResultInfo}>
                <Text style={styles.criticalResultName}>
                  {item.order?.patient?.first_name} {item.order?.patient?.last_name}
                </Text>
                <Text style={styles.criticalResultTest}>{item.test_name}</Text>
              </View>
              <Text style={styles.criticalResultValue}>{item.result_value}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderSchedule = () => (
    <View style={styles.listContainer}>
      <FlatList
        data={appointments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.appointmentCard} onPress={() => router.push(`/health/doctor/patient/${item.patient.id}`)}>
            <View style={styles.apptTimeBox}>
              <Text style={styles.apptTime}>{item.scheduled_time?.substring(0,5) || 'TBD'}</Text>
            </View>
            <View style={styles.apptContent}>
              <View style={styles.apptHeader}>
                <Text style={styles.apptName}>{item.patient?.first_name} {item.patient?.last_name}</Text>
                <View style={[styles.apptStatus, { backgroundColor: getAppointmentStatusColor(item.status) + '20' }]}>
                  <Text style={[styles.apptStatusText, { color: getAppointmentStatusColor(item.status) }]}>
                    {item.status?.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.apptMeta}>{item.patient?.age}y • {item.patient?.gender}</Text>
              <Text style={styles.apptReason}>{item.chief_complaint || item.reason || 'General Consultation'}</Text>
              <View style={styles.apptActions}>
                <TouchableOpacity style={styles.apptActionBtn} onPress={() => router.push(`/health/doctor/consultation/${item.id}`)}>
                  <Ionicons name="stethoscope" size={16} color="#3b82f6" />
                  <Text style={styles.apptActionText}>Start Consultation</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.apptActionBtn}>
                  <Ionicons name="document-text" size={16} color="#64748b" />
                  <Text style={styles.apptActionText}>View Chart</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#475569" />
            <Text style={styles.emptyText}>No appointments today</Text>
          </View>
        }
      />
    </View>
  );

  const renderInbox = () => (
    <View style={styles.listContainer}>
      <FlatList
        data={inboxItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.inboxItem, item.is_critical && styles.criticalInboxItem]}>
            <View style={styles.inboxIconBox}>
              <Ionicons 
                name={item.is_critical ? 'alert-circle' : 'document-text'} 
                size={24} 
                color={item.is_critical ? '#ef4444' : '#3b82f6'} 
              />
            </View>
            <View style={styles.inboxContent}>
              <View style={styles.inboxHeader}>
                <Text style={styles.inboxPatientName}>
                  {item.order?.patient?.first_name} {item.order?.patient?.last_name}
                </Text>
                {item.is_critical && <Text style={styles.criticalBadge}>CRITICAL</Text>}
              </View>
              <Text style={styles.inboxTestName}>{item.test_name}</Text>
              <Text style={styles.inboxResult}>Result: {item.result_value}</Text>
              <Text style={styles.inboxTime}>{new Date(item.created_at).toLocaleString()}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#64748b" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="mail-outline" size={48} color="#475569" />
            <Text style={styles.emptyText}>Inbox is clear</Text>
            <Text style={styles.emptySub}>No pending results or messages</Text>
          </View>
        }
      />
    </View>
  );

  const renderPatients = () => (
    <View style={styles.listContainer}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#64748b" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search patients..."
          placeholderTextColor="#64748b"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <FlatList
        data={myPatients.filter(p => 
          `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.phone?.includes(searchQuery)
        )}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.patientCard} onPress={() => router.push(`/health/doctor/patient/${item.id}`)}>
            <View style={styles.patientAvatar}>
              <Text style={styles.patientAvatarText}>{item.first_name[0]}{item.last_name[0]}</Text>
            </View>
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>{item.first_name} {item.last_name}</Text>
              <Text style={styles.patientMeta}>{item.age || '?'}y • {item.gender || '?'} • {item.phone || 'No phone'}</Text>
              {item.last_visit && (
                <Text style={styles.lastVisit}>Last visit: {new Date(item.last_visit).toLocaleDateString()}</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#64748b" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color="#475569" />
            <Text style={styles.emptyText}>No patients found</Text>
          </View>
        }
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Dr. Workstation</Text>
          <View style={styles.userBadge}>
            <Ionicons name="person-circle" size={24} color="#3b82f6" />
            <Text style={styles.userName}>Dr. {user?.user_metadata?.full_name?.split(' ').pop() || 'User'}</Text>
          </View>
        </View>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.navTabs}>
        {[
          { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
          { id: 'schedule', label: 'Schedule', icon: 'calendar' },
          { id: 'inbox', label: `Inbox${dashboardData.criticalResults > 0 ? ` (${dashboardData.criticalResults})` : ''}`, icon: 'mail' },
          { id: 'patients', label: 'Patients', icon: 'people' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.navTab, activeTab === tab.id && styles.activeNavTab]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons 
              name={tab.icon} 
              size={20} 
              color={activeTab === tab.id ? '#3b82f6' : '#64748b'} 
            />
            <Text style={[styles.navTabText, activeTab === tab.id && styles.activeNavTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>
      ) : (
        <>
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'schedule' && renderSchedule()}
          {activeTab === 'inbox' && renderInbox()}
          {activeTab === 'patients' && renderPatients()}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { backgroundColor: '#1e293b', paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#334155' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: '#f8fafc', fontSize: 24, fontWeight: 'bold' },
  userBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userName: { color: '#94a3b8', fontSize: 14 },
  navTabs: { flexDirection: 'row', backgroundColor: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#334155' },
  navTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, gap: 6 },
  activeNavTab: { borderBottomWidth: 2, borderBottomColor: '#3b82f6', backgroundColor: '#0f172a' },
  navTabText: { color: '#64748b', fontSize: 12, fontWeight: '600' },
  activeNavTabText: { color: '#3b82f6' },
  content: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Stats Grid
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12 },
  statCard: { width: '48%', backgroundColor: '#1e293b', borderRadius: 12, padding: 16, alignItems: 'center' },
  statIconBox: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statNumber: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  statLabel: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  
  // Sections
  section: { backgroundColor: '#1e293b', marginHorizontal: 16, marginTop: 16, borderRadius: 12, padding: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  seeAllText: { color: '#3b82f6', fontSize: 13, fontWeight: '600' },
  
  // Quick Actions
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionBtn: { width: '48%', backgroundColor: '#0f172a', borderRadius: 12, padding: 20, alignItems: 'center', gap: 8 },
  actionText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  
  // Schedule Items
  scheduleItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#334155' },
  timeSlot: { backgroundColor: '#0f172a', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginRight: 12 },
  timeText: { color: '#3b82f6', fontSize: 14, fontWeight: 'bold', fontFamily: 'monospace' },
  scheduleInfo: { flex: 1 },
  scheduleName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  scheduleReason: { color: '#94a3b8', fontSize: 12 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  
  // Critical Results
  criticalResultCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 8, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#ef4444' },
  criticalResultInfo: { flex: 1, marginLeft: 12 },
  criticalResultName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  criticalResultTest: { color: '#ef4444', fontSize: 12 },
  criticalResultValue: { color: '#ef4444', fontSize: 16, fontWeight: 'bold', fontFamily: 'monospace' },
  
  // Appointment Cards
  listContainer: { flex: 1, padding: 16 },
  appointmentCard: { flexDirection: 'row', backgroundColor: '#1e293b', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  apptTimeBox: { backgroundColor: '#0f172a', paddingHorizontal: 12, paddingVertical: 16, borderRadius: 8, marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  apptTime: { color: '#3b82f6', fontSize: 16, fontWeight: 'bold', fontFamily: 'monospace' },
  apptContent: { flex: 1 },
  apptHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  apptName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  apptStatus: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  apptStatusText: { fontSize: 10, fontWeight: 'bold' },
  apptMeta: { color: '#94a3b8', fontSize: 12, marginBottom: 4 },
  apptReason: { color: '#e2e8f0', fontSize: 13, marginBottom: 8 },
  apptActions: { flexDirection: 'row', gap: 8 },
  apptActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: '#0f172a' },
  apptActionText: { color: '#3b82f6', fontSize: 12, fontWeight: '600' },
  
  // Inbox
  inboxItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#334155' },
  criticalInboxItem: { borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.05)' },
  inboxIconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  inboxContent: { flex: 1 },
  inboxHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  inboxPatientName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  criticalBadge: { backgroundColor: '#ef4444', color: '#fff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 10, fontWeight: 'bold' },
  inboxTestName: { color: '#3b82f6', fontSize: 13, marginBottom: 2 },
  inboxResult: { color: '#94a3b8', fontSize: 12 },
  inboxTime: { color: '#64748b', fontSize: 11, marginTop: 4 },
  
  // Patient List
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, paddingHorizontal: 12, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  searchInput: { flex: 1, color: '#fff', fontSize: 16, paddingVertical: 12, marginLeft: 8 },
  patientCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#334155' },
  patientAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  patientAvatarText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  patientInfo: { flex: 1 },
  patientName: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 2 },
  patientMeta: { color: '#94a3b8', fontSize: 12 },
  lastVisit: { color: '#64748b', fontSize: 11, marginTop: 2 },
  
  // Empty State
  emptyState: { alignItems: 'center', marginTop: 100, padding: 20 },
  emptyText: { color: '#64748b', fontSize: 16, fontWeight: '600', marginTop: 16 },
  emptySub: { color: '#475569', fontSize: 14, marginTop: 4 },
});
