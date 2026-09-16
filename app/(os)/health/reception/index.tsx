// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator, RefreshControl, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Ionicons } from '@expo/vector-icons';

export default function ReceptionDeskPro() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('checkin'); // checkin, register, schedule, queue
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [todayStats, setTodayStats] = useState({ checkins: 0, appointments: 0, walkins: 0, admitted: 0 });
  
  // Modals
  const [patientModal, setPatientModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [visitTypeModal, setVisitTypeModal] = useState(false);
  const [newPatientModal, setNewPatientModal] = useState(false);
  
  // New Patient Form
  const [newPatient, setNewPatient] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    dob: '',
    gender: '',
    id_number: '',
    address: '',
    emergency_contact: '',
    emergency_phone: ''
  });

  useEffect(() => {
    loadTodayStats();
  }, []);

  const loadTodayStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [checkins, appts, walkins, admitted] = await Promise.all([
        supabase.from('health_appointments').select('id').eq('scheduled_date', today).in('status', ['checked_in', 'completed']),
        supabase.from('health_appointments').select('id').eq('scheduled_date', today),
        supabase.from('health_appointments').select('id').eq('scheduled_date', today).eq('appointment_type', 'walk_in'),
        supabase.from('health_patients').select('id').eq('admission_status', 'admitted')
      ]);

      setTodayStats({
        checkins: checkins?.length || 0,
        appointments: appts?.length || 0,
        walkins: walkins?.length || 0,
        admitted: admitted?.length || 0
      });
    } catch (err) {
      console.error('Stats error:', err);
    }
  };

  const searchPatients = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('health_patients')
        .select('*')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,phone.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setPatientModal(true);
  };

  const initiateVisit = (visitType) => {
    setVisitTypeModal(false);
    // Create appointment/visit
    router.push({
      pathname: '/health/reception/visit',
      params: { 
        patientId: selectedPatient.id, 
        visitType,
        patientName: `${selectedPatient.first_name} ${selectedPatient.last_name}`
      }
    });
  };

  const registerNewPatient = async () => {
    if (!newPatient.first_name || !newPatient.last_name || !newPatient.phone) {
      Alert.alert('Error', 'First name, last name, and phone are required');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('health_patients')
        .insert({
          ...newPatient,
          mrn: 'MRN-' + Date.now().toString().slice(-8),
          created_by: user.id,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      Alert.alert('Success', `Patient registered. MRN: ${data.mrn}`);
      setNewPatientModal(false);
      setNewPatient({
        first_name: '', last_name: '', phone: '', email: '', dob: '',
        gender: '', id_number: '', address: '', emergency_contact: '', emergency_phone: ''
      });
      setSearchQuery('');
      setSearchResults([]);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const quickActions = [
    { id: 'opd', label: 'OPD Visit', icon: 'stethoscope', color: '#3b82f6' },
    { id: 'emergency', label: 'Emergency', icon: 'flash', color: '#ef4444' },
    { id: 'followup', label: 'Follow-up', icon: 'refresh', color: '#10b981' },
    { id: 'specialist', label: 'Specialist', icon: 'medical', color: '#8b5cf6' },
    { id: 'lab', label: 'Lab Only', icon: 'flask', color: '#f59e0b' },
    { id: 'imaging', label: 'Imaging', icon: 'scan', color: '#06b6d4' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Reception Desk</Text>
          <Text style={styles.headerSubtitle}>Patient Registration & Check-in</Text>
        </View>
        <View style={styles.dateBadge}>
          <Ionicons name="calendar" size={16} color="#fff" />
          <Text style={styles.dateText}>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
        </View>
      </View>

      {/* Stats Dashboard */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
            <Ionicons name="checkmark-circle" size={24} color="#3b82f6" />
          </View>
          <Text style={styles.statNumber}>{todayStats.checkins}</Text>
          <Text style={styles.statLabel}>Checked In</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
            <Ionicons name="calendar" size={24} color="#f59e0b" />
          </View>
          <Text style={styles.statNumber}>{todayStats.appointments}</Text>
          <Text style={styles.statLabel}>Appointments</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
            <Ionicons name="walk" size={24} color="#ef4444" />
          </View>
          <Text style={styles.statNumber}>{todayStats.walkins}</Text>
          <Text style={styles.statLabel}>Walk-ins</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
            <Ionicons name="bed" size={24} color="#10b981" />
          </View>
          <Text style={styles.statNumber}>{todayStats.admitted}</Text>
          <Text style={styles.statLabel}>Admitted</Text>
        </View>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.navTabs}>
        {[
          { id: 'checkin', label: 'Check-in', icon: 'person-add' },
          { id: 'register', label: 'New Patient', icon: 'add-circle' },
          { id: 'schedule', label: 'Schedule', icon: 'calendar' },
          { id: 'queue', label: 'Queue', icon: 'people' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.navTab, activeTab === tab.id && styles.activeNavTab]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons name={tab.icon} size={18} color={activeTab === tab.id ? '#fff' : '#94a3b8'} />
            <Text style={[styles.navText, activeTab === tab.id && styles.activeNavText]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {activeTab === 'checkin' && (
        <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={false} onRefresh={loadTodayStats} />}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#64748b" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, phone, or MRN..."
              placeholderTextColor="#64748b"
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                searchPatients(text);
              }}
            />
            {searching && <ActivityIndicator size="small" color="#3b82f6" />}
          </View>

          {/* Quick Register Button */}
          <TouchableOpacity style={styles.quickRegisterBtn} onPress={() => setNewPatientModal(true)}>
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.quickRegisterText}>Quick Register New Patient</Text>
          </TouchableOpacity>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <View style={styles.resultsContainer}>
              <Text style={styles.sectionTitle}>Search Results</Text>
              {searchResults.map(patient => (
                <TouchableOpacity 
                  key={patient.id} 
                  style={styles.patientResult}
                  onPress={() => handlePatientSelect(patient)}
                >
                  <View style={styles.patientAvatar}>
                    <Text style={styles.avatarText}>
                      {patient.first_name?.[0]}{patient.last_name?.[0]}
                    </Text>
                  </View>
                  <View style={styles.patientInfo}>
                    <Text style={styles.patientName}>{patient.first_name} {patient.last_name}</Text>
                    <Text style={styles.patientMeta}>
                      {patient.age || '?'}y • {patient.gender || 'N/A'} • {patient.phone || 'No phone'}
                    </Text>
                    <Text style={styles.mrnText}>MRN: {patient.mrn || 'N/A'}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#64748b" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Recent Activity */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's Activity</Text>
            <View style={styles.emptyState}>
              <Ionicons name="time" size={48} color="#475569" />
              <Text style={styles.emptyText}>No recent check-ins</Text>
              <Text style={styles.emptySub}>Patients will appear here after check-in</Text>
            </View>
          </View>
        </ScrollView>
      )}

      {activeTab === 'register' && (
        <ScrollView style={styles.content}>
          <View style={styles.registerForm}>
            <Text style={styles.formTitle}>New Patient Registration</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter first name"
                placeholderTextColor="#64748b"
                value={newPatient.first_name}
                onChangeText={(t) => setNewPatient({...newPatient, first_name: t})}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Last Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter last name"
                placeholderTextColor="#64748b"
                value={newPatient.last_name}
                onChangeText={(t) => setNewPatient({...newPatient, last_name: t})}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Phone *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Phone number"
                  placeholderTextColor="#64748b"
                  keyboardType="phone-pad"
                  value={newPatient.phone}
                  onChangeText={(t) => setNewPatient({...newPatient, phone: t})}
                />
              </View>
              <View style={[styles.formGroup, { flex: 1, marginLeft: 12 }]}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#64748b"
                  keyboardType="email-address"
                  value={newPatient.email}
                  onChangeText={(t) => setNewPatient({...newPatient, email: t})}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Date of Birth</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#64748b"
                  value={newPatient.dob}
                  onChangeText={(t) => setNewPatient({...newPatient, dob: t})}
                />
              </View>
              <View style={[styles.formGroup, { flex: 1, marginLeft: 12 }]}>
                <Text style={styles.label}>Gender</Text>
                <View style={styles.genderSelector}>
                  {['Male', 'Female', 'Other'].map(g => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.genderBtn, newPatient.gender === g && styles.genderBtnActive]}
                      onPress={() => setNewPatient({...newPatient, gender: g.toLowerCase()})}
                    >
                      <Text style={[styles.genderText, newPatient.gender === g && styles.genderTextActive]}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>ID Number</Text>
              <TextInput
                style={styles.input}
                placeholder="National ID / Passport"
                placeholderTextColor="#64748b"
                value={newPatient.id_number}
                onChangeText={(t) => setNewPatient({...newPatient, id_number: t})}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
                placeholder="Physical address"
                placeholderTextColor="#64748b"
                multiline
                value={newPatient.address}
                onChangeText={(t) => setNewPatient({...newPatient, address: t})}
              />
            </View>

            <View style={styles.emergencySection}>
              <Text style={styles.emergencyTitle}>Emergency Contact</Text>
              <TextInput
                style={styles.input}
                placeholder="Contact name"
                placeholderTextColor="#64748b"
                value={newPatient.emergency_contact}
                onChangeText={(t) => setNewPatient({...newPatient, emergency_contact: t})}
              />
              <TextInput
                style={[styles.input, { marginTop: 8 }]}
                placeholder="Emergency phone"
                placeholderTextColor="#64748b"
                keyboardType="phone-pad"
                value={newPatient.emergency_phone}
                onChangeText={(t) => setNewPatient({...newPatient, emergency_phone: t})}
              />
            </View>

            <TouchableOpacity style={styles.registerBtn} onPress={registerNewPatient}>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
              <Text style={styles.registerBtnText}>Complete Registration</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {activeTab === 'schedule' && (
        <View style={styles.center}>
          <Ionicons name="calendar-outline" size={64} color="#475569" />
          <Text style={styles.emptyText}>Appointment Schedule</Text>
          <Text style={styles.emptySub}>Integration with scheduling module</Text>
        </View>
      )}

      {activeTab === 'queue' && (
        <View style={styles.center}>
          <Ionicons name="people-outline" size={64} color="#475569" />
          <Text style={styles.emptyText}>Waiting Room Queue</Text>
          <Text style={styles.emptySub}>Live queue management</Text>
        </View>
      )}

      {/* Patient Action Modal */}
      <Modal visible={patientModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Patient Actions</Text>
              <Text style={styles.modalPatient}>
                {selectedPatient?.first_name} {selectedPatient?.last_name}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setPatientModal(false)}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalSectionTitle}>Select Visit Type</Text>
            <View style={styles.visitGrid}>
              {quickActions.map(action => (
                <TouchableOpacity
                  key={action.id}
                  style={[styles.visitCard, { borderColor: action.color }]}
                  onPress={() => initiateVisit(action.id)}
                >
                  <View style={[styles.visitIcon, { backgroundColor: action.color + '20' }]}>
                    <Ionicons name={action.icon} size={28} color={action.color} />
                  </View>
                  <Text style={styles.visitLabel}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.patientDetails}>
              <Text style={styles.modalSectionTitle}>Patient Information</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>MRN:</Text>
                <Text style={styles.detailValue}>{selectedPatient?.mrn || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phone:</Text>
                <Text style={styles.detailValue}>{selectedPatient?.phone || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Last Visit:</Text>
                <Text style={styles.detailValue}>{selectedPatient?.last_visit ? new Date(selectedPatient.last_visit).toLocaleDateString() : 'New Patient'}</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* New Patient Modal (Quick) */}
      <Modal visible={newPatientModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Quick Registration</Text>
            <TouchableOpacity onPress={() => setNewPatientModal(false)}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.quickRegText}>Enter minimum details to create patient record</Text>
            
            <TextInput
              style={styles.input}
              placeholder="First Name *"
              placeholderTextColor="#64748b"
              value={newPatient.first_name}
              onChangeText={(t) => setNewPatient({...newPatient, first_name: t})}
            />
            <TextInput
              style={[styles.input, { marginTop: 12 }]}
              placeholder="Last Name *"
              placeholderTextColor="#64748b"
              value={newPatient.last_name}
              onChangeText={(t) => setNewPatient({...newPatient, last_name: t})}
            />
            <TextInput
              style={[styles.input, { marginTop: 12 }]}
              placeholder="Phone Number *"
              placeholderTextColor="#64748b"
              keyboardType="phone-pad"
              value={newPatient.phone}
              onChangeText={(t) => setNewPatient({...newPatient, phone: t})}
            />

            <TouchableOpacity style={styles.registerBtn} onPress={registerNewPatient}>
              <Text style={styles.registerBtnText}>Create Patient Record</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#334155' },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  headerSubtitle: { color: '#94a3b8', fontSize: 13, marginTop: 4 },
  dateBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3b82f6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  dateText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  
  statsGrid: { flexDirection: 'row', padding: 16, gap: 12 },
  statCard: { flex: 1, backgroundColor: '#1e293b', borderRadius: 12, padding: 16, alignItems: 'center' },
  statIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statNumber: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  statLabel: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  
  navTabs: { flexDirection: 'row', backgroundColor: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#334155' },
  navTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, gap: 6 },
  activeNavTab: { borderBottomWidth: 2, borderBottomColor: '#3b82f6', backgroundColor: '#0f172a' },
  navText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  activeNavText: { color: '#fff' },
  
  content: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#64748b', fontSize: 16, fontWeight: '600', marginTop: 16 },
  emptySub: { color: '#475569', fontSize: 14, marginTop: 4 },
  
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', margin: 16, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#334155', gap: 12 },
  searchInput: { flex: 1, color: '#fff', fontSize: 16 },
  
  quickRegisterBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#10b981', marginHorizontal: 16, padding: 14, borderRadius: 12, marginBottom: 16, gap: 8 },
  quickRegisterText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  
  resultsContainer: { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  patientResult: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#334155' },
  patientAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  patientInfo: { flex: 1 },
  patientName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  patientMeta: { color: '#94a3b8', fontSize: 12 },
  mrnText: { color: '#64748b', fontSize: 11, marginTop: 2, fontFamily: 'monospace' },
  
  section: { paddingHorizontal: 16, marginBottom: 16 },
  emptyState: { alignItems: 'center', padding: 40, backgroundColor: '#1e293b', borderRadius: 12 },
  
  registerForm: { padding: 20 },
  formTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  formGroup: { marginBottom: 16 },
  label: { color: '#94a3b8', fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: { backgroundColor: '#1e293b', color: '#fff', fontSize: 16, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  row: { flexDirection: 'row' },
  genderSelector: { flexDirection: 'row', gap: 8 },
  genderBtn: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#334155', alignItems: 'center' },
  genderBtnActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  genderText: { color: '#94a3b8', fontSize: 14 },
  genderTextActive: { color: '#fff', fontWeight: '600' },
  emergencySection: { backgroundColor: '#1e293b', padding: 16, borderRadius: 8, marginBottom: 16 },
  emergencyTitle: { color: '#f59e0b', fontSize: 14, fontWeight: 'bold', marginBottom: 12 },
  registerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#10b981', padding: 16, borderRadius: 12, gap: 8, marginTop: 8 },
  registerBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  modalContainer: { flex: 1, backgroundColor: '#0f172a' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#334155' },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  modalPatient: { color: '#3b82f6', fontSize: 16, marginTop: 4 },
  modalContent: { padding: 20 },
  modalSectionTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  visitGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  visitCard: { width: '31%', backgroundColor: '#1e293b', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  visitIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  visitLabel: { color: '#fff', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  patientDetails: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16 },
  detailRow: { flexDirection: 'row', marginBottom: 8 },
  detailLabel: { color: '#94a3b8', fontSize: 13, width: 100 },
  detailValue: { color: '#fff', fontSize: 13, flex: 1 },
  quickRegText: { color: '#94a3b8', fontSize: 14, marginBottom: 20 },
});
