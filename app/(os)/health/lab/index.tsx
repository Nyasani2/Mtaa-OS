// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator, RefreshControl, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Ionicons } from '@expo/vector-icons';

// --- CLINICAL REFERENCE RANGES ---
const REFERENCE_RANGES = {
  'WBC': { min: 4.5, max: 11.0, unit: 'x10³/µL' },
  'RBC': { min: 4.5, max: 5.9, unit: 'x10⁶/µL' },
  'Hemoglobin': { min: 13.5, max: 17.5, unit: 'g/dL' },
  'Hematocrit': { min: 38.8, max: 50.0, unit: '%' },
  'Platelets': { min: 150, max: 400, unit: 'x10³/µL' },
  'Glucose': { min: 70, max: 100, unit: 'mg/dL' },
  'Creatinine': { min: 0.7, max: 1.3, unit: 'mg/dL' },
  'BUN': { min: 7, max: 20, unit: 'mg/dL' },
  'Sodium': { min: 136, max: 145, unit: 'mEq/L' },
  'Potassium': { min: 3.5, max: 5.0, unit: 'mEq/L' },
  'Chloride': { min: 98, max: 106, unit: 'mEq/L' },
  'CO2': { min: 22, max: 29, unit: 'mEq/L' },
  'ALT': { min: 7, max: 56, unit: 'U/L' },
  'AST': { min: 10, max: 40, unit: 'U/L' },
  'Bilirubin': { min: 0.1, max: 1.2, unit: 'mg/dL' },
  'Albumin': { min: 3.5, max: 5.5, unit: 'g/dL' },
  'TSH': { min: 0.4, max: 4.0, unit: 'mIU/L' },
  'HbA1c': { min: 4.0, max: 5.6, unit: '%' },
};

const CRITICAL_VALUES = {
  'WBC': { low: 2.0, high: 30.0 },
  'Glucose': { low: 50, high: 400 },
  'Potassium': { low: 2.5, high: 6.5 },
  'Sodium': { low: 120, high: 160 },
  'Hemoglobin': { low: 7.0, high: 20.0 },
  'Platelets': { low: 50, high: 450 },
  'Creatinine': { low: 0.0, high: 4.0 },
};

export default function LaboratoryOS() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('worklist'); // worklist, accessioning, results, qc, stats
  const [department, setDepartment] = useState('all'); // all, chemistry, hematology, microbiology, bloodbank
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ pending: 0, stat: 0, critical: 0, completed: 0 });
  
  // Result Entry Modal
  const [resultModal, setResultModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [resultValue, setResultValue] = useState('');
  const [isCritical, setIsCritical] = useState(false);
  const [criticalNote, setCriticalNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadWorklist(); }, [department]);

  const loadWorklist = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('health_lab_orders')
        .select(`
          id,
          test_name,
          priority,
          status,
          requested_at,
          patient:health_patients(id, first_name, last_name, age, gender, dob),
          ordering_doctor:health_staff!ordered_by(full_name)
        `)
        .order('priority', { ascending: false })
        .order('requested_at', { ascending: true });

      if (department !== 'all') {
        // Filter by test category if needed
        query = query.ilike('test_name', `%${department}%`);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      // Calculate stats
      setStats({
        pending: data.filter(o => o.status === 'pending').length,
        stat: data.filter(o => o.priority === 'urgent' && o.status !== 'completed').length,
        critical: data.filter(o => o.status === 'critical_review').length,
        completed: data.filter(o => o.status === 'completed').length
      });

      setOrders(data || []);
    } catch (err) {
      console.error('Load error:', err);
      Alert.alert('Error', 'Failed to load worklist');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const openResultEntry = (order) => {
    setSelectedOrder(order);
    setResultValue('');
    setIsCritical(false);
    setCriticalNote('');
    setResultModal(true);
  };

  const checkCriticalValue = (testName, value) => {
    const numValue = parseFloat(value);
    const critical = CRITICAL_VALUES[testName];
    if (!critical) return false;
    return numValue <= critical.low || numValue >= critical.high;
  };

  const saveResult = async () => {
    if (!resultValue.trim()) {
      Alert.alert('Error', 'Please enter a result value');
      return;
    }

    setSaving(true);
    try {
      const testName = selectedOrder.test_name.split(' - ')[0].trim();
      const isCrit = isCritical || checkCriticalValue(testName, resultValue);
      
      // Save result
      const { error } = await supabase.from('health_lab_results').insert({
        order_id: selectedOrder.id,
        test_name: selectedOrder.test_name,
        result_value: resultValue,
        is_critical: isCrit,
        status: isCrit ? 'critical_review' : 'verified',
        verified_by: user.id,
        verified_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      });

      if (error) throw error;

      // Update order status
      await supabase
        .from('health_lab_orders')
        .update({ 
          status: isCrit ? 'critical_review' : 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', selectedOrder.id);

      if (isCrit) {
        // In a real system, this would trigger an automatic phone call/page
        Alert.alert(
          '⚠️ CRITICAL VALUE',
          `This result requires immediate physician notification.\n\nValue: ${resultValue}\n${criticalNote || ''}`,
          [{ text: 'OK' }]
        );
      }

      setResultModal(false);
      loadWorklist();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'urgent': return '#ef4444';
      case 'asap': return '#f59e0b';
      default: return '#3b82f6';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return '#10b981';
      case 'in_progress': return '#3b82f6';
      case 'critical_review': return '#ef4444';
      default: return '#64748b';
    }
  };

  const getDeltaCheck = async (patientId, testName) => {
    const { data } = await supabase
      .from('health_lab_results')
      .select('result_value, created_at')
      .eq('patient_id', patientId)
      .ilike('test_name', `%${testName}%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    return data;
  };

  // --- RENDER COMPONENTS ---
  const renderWorklistItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.orderCard, item.priority === 'urgent' && styles.statCard]} 
      onPress={() => openResultEntry(item)}
    >
      <View style={styles.orderHeader}>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
          <Text style={styles.priorityText}>{item.priority.toUpperCase()}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      <Text style={styles.patientName}>{item.patient?.first_name} {item.patient?.last_name}</Text>
      <Text style={styles.patientMeta}>
        {item.patient?.age || '?'}y • {item.patient?.gender || '?'} • MRN: {item.patient?.id.slice(0,8)}
      </Text>

      <View style={styles.testInfo}>
        <Ionicons name="flask" size={16} color="#94a3b8" />
        <Text style={styles.testName}>{item.test_name}</Text>
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.orderTime}>
          {new Date(item.requested_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </Text>
        <Text style={styles.doctorName}>Dr. {item.ordering_doctor?.full_name || 'Unknown'}</Text>
      </View>

      {item.priority === 'urgent' && (
        <View style={styles.statBanner}>
          <Ionicons name="warning" size={14} color="#fff" />
          <Text style={styles.statText}>STAT - Process Immediately</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderStats = () => (
    <ScrollView style={styles.content}>
      <View style={styles.statsGrid}>
        <View style={[styles.statBox, { borderColor: '#3b82f6' }]}>
          <Text style={styles.statNumber}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statBox, { borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
          <Text style={[styles.statNumber, { color: '#ef4444' }]}>{stats.stat}</Text>
          <Text style={styles.statLabel}>STAT Orders</Text>
        </View>
        <View style={[styles.statBox, { borderColor: '#f59e0b' }]}>
          <Text style={[styles.statNumber, { color: '#f59e0b' }]}>{stats.critical}</Text>
          <Text style={styles.statLabel}>Critical Review</Text>
        </View>
        <View style={[styles.statBox, { borderColor: '#10b981' }]}>
          <Text style={[styles.statNumber, { color: '#10b981' }]}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Department Queue</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.deptScroll}>
          {['all', 'chemistry', 'hematology', 'microbiology', 'bloodbank'].map(dept => (
            <TouchableOpacity
              key={dept}
              style={[styles.deptPill, department === dept && styles.activeDeptPill]}
              onPress={() => setDepartment(dept)}
            >
              <Text style={[styles.deptText, department === dept && styles.activeDeptText]}>
                {dept === 'all' ? 'All Departments' : dept.charAt(0).toUpperCase() + dept.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.quickStats}>
        <TouchableOpacity style={styles.quickStatCard} onPress={() => router.push('/health/lab/qc')}>
          <Ionicons name="analytics" size={32} color="#8b5cf6" />
          <Text style={styles.quickStatTitle}>QC Charts</Text>
          <Text style={styles.quickStatDesc}>Levey-Jennings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickStatCard} onPress={() => router.push('/health/lab/instrument')}>
          <Ionicons name="hardware-chip" size={32} color="#06b6d4" />
          <Text style={styles.quickStatTitle}>Instruments</Text>
          <Text style={styles.quickStatDesc}>Connectivity</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickStatCard} onPress={() => router.push('/health/lab/bloodbank')}>
          <Ionicons name="blood" size={32} color="#ef4444" />
          <Text style={styles.quickStatTitle}>Blood Bank</Text>
          <Text style={styles.quickStatDesc}>Crossmatch</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Laboratory OS</Text>
        <View style={styles.userBadge}>
          <Ionicons name="person-circle" size={24} color="#3b82f6" />
          <Text style={styles.userName}>Lab Tech</Text>
        </View>
      </View>

      {/* Navigation */}
      <View style={styles.navTabs}>
        {[
          { id: 'worklist', label: 'Worklist', icon: 'list' },
          { id: 'accessioning', label: 'Accession', icon: 'barcode' },
          { id: 'results', label: 'Results', icon: 'document' },
          { id: 'qc', label: 'QC', icon: 'pulse' },
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
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>
      ) : (
        <>
          {activeTab === 'worklist' && renderStats()}
          {activeTab !== 'worklist' && (
            <View style={styles.center}>
              <Ionicons name="construct" size={48} color="#475569" />
              <Text style={styles.emptyText}>Module under construction</Text>
            </View>
          )}
        </>
      )}

      {/* Result Entry Modal */}
      <Modal visible={resultModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Enter Result</Text>
              <Text style={styles.modalPatient}>
                {selectedOrder?.patient?.first_name} {selectedOrder?.patient?.last_name}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setResultModal(false)}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.orderInfo}>
              <Text style={styles.infoLabel}>Test:</Text>
              <Text style={styles.infoValue}>{selectedOrder?.test_name}</Text>
            </View>

            <View style={styles.referenceBox}>
              <Text style={styles.refTitle}>Reference Range</Text>
              {(() => {
                const testName = selectedOrder?.test_name?.split(' - ')[0]?.trim();
                const ref = REFERENCE_RANGES[testName];
                return ref ? (
                  <Text style={styles.refValue}>{ref.min} - {ref.max} {ref.unit}</Text>
                ) : (
                  <Text style={styles.refValue}>See manual</Text>
                );
              })()}
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Result Value *</Text>
              <TextInput
                style={styles.resultInput}
                placeholder="Enter value..."
                placeholderTextColor="#64748b"
                value={resultValue}
                onChangeText={setResultValue}
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={[styles.criticalToggle, isCritical && styles.criticalToggleActive]}
              onPress={() => setIsCritical(!isCritical)}
            >
              <Ionicons 
                name={isCritical ? 'checkbox' : 'square-outline'} 
                size={24} 
                color={isCritical ? '#ef4444' : '#64748b'} 
              />
              <Text style={[styles.criticalText, isCritical && styles.criticalTextActive]}>
                Critical Value - Requires Physician Notification
              </Text>
            </TouchableOpacity>

            {isCritical && (
              <View style={styles.criticalSection}>
                <Text style={styles.inputLabel}>Notification Details</Text>
                <TextInput
                  style={[styles.resultInput, { minHeight: 80, textAlignVertical: 'top' }]}
                  placeholder="Who was notified? Time? Acceptance?"
                  placeholderTextColor="#64748b"
                  value={criticalNote}
                  onChangeText={setCriticalNote}
                  multiline
                />
              </View>
            )}

            <TouchableOpacity style={styles.saveBtn} onPress={saveResult} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Verify & Release Result</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  userBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userName: { color: '#94a3b8', fontSize: 14 },
  navTabs: { flexDirection: 'row', backgroundColor: '#0f172a', borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  navTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, gap: 6 },
  activeNavTab: { borderBottomWidth: 2, borderBottomColor: '#3b82f6', backgroundColor: '#1e293b' },
  navText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  activeNavText: { color: '#fff' },
  content: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#64748b', fontSize: 16, marginTop: 16 },
  
  // Stats
  statsGrid: { flexDirection: 'row', padding: 16, gap: 12 },
  statBox: { flex: 1, backgroundColor: '#1e293b', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  statNumber: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  statLabel: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  
  // Section
  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  deptScroll: { maxHeight: 50 },
  deptPill: { backgroundColor: '#1e293b', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 8 },
  activeDeptPill: { backgroundColor: '#3b82f6' },
  deptText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  activeDeptText: { color: '#fff' },
  
  // Quick Stats
  quickStats: { flexDirection: 'row', padding: 16, gap: 12 },
  quickStatCard: { flex: 1, backgroundColor: '#1e293b', borderRadius: 12, padding: 16, alignItems: 'center' },
  quickStatTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginTop: 8 },
  quickStatDesc: { color: '#64748b', fontSize: 11, marginTop: 4 },
  
  // Order Cards
  orderCard: { backgroundColor: '#1e293b', marginHorizontal: 16, marginBottom: 12, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#334155' },
  statCard: { borderColor: '#ef4444', borderWidth: 2 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  priorityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  priorityText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  patientName: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  patientMeta: { color: '#94a3b8', fontSize: 12, marginBottom: 12 },
  testInfo: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', padding: 10, borderRadius: 8, marginBottom: 12 },
  testName: { color: '#e2e8f0', fontSize: 14, marginLeft: 8, fontWeight: '600' },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  orderTime: { color: '#3b82f6', fontSize: 13, fontWeight: 'bold', fontFamily: 'monospace' },
  doctorName: { color: '#64748b', fontSize: 12 },
  statBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ef4444', padding: 8, borderRadius: 6, marginTop: 12, justifyContent: 'center', gap: 6 },
  statText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  
  // Modal
  modalContainer: { flex: 1, backgroundColor: '#020617' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#0f172a', borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  modalPatient: { color: '#3b82f6', fontSize: 16, marginTop: 4 },
  modalContent: { padding: 20 },
  orderInfo: { flexDirection: 'row', marginBottom: 16, backgroundColor: '#1e293b', padding: 12, borderRadius: 8 },
  infoLabel: { color: '#94a3b8', fontSize: 13, marginRight: 8 },
  infoValue: { color: '#fff', fontSize: 13, fontWeight: '600', flex: 1 },
  referenceBox: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: '#10b981', borderWidth: 1, borderStyle: 'dashed', borderRadius: 8, padding: 12, marginBottom: 20 },
  refTitle: { color: '#10b981', fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  refValue: { color: '#10b981', fontSize: 16, fontFamily: 'monospace' },
  inputSection: { marginBottom: 20 },
  inputLabel: { color: '#94a3b8', fontSize: 13, fontWeight: '600', marginBottom: 8 },
  resultInput: { backgroundColor: '#1e293b', color: '#fff', fontSize: 24, fontWeight: 'bold', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#334155', fontFamily: 'monospace' },
  criticalToggle: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', padding: 16, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  criticalToggleActive: { borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  criticalText: { color: '#64748b', fontSize: 14, marginLeft: 12, flex: 1 },
  criticalTextActive: { color: '#ef4444', fontWeight: '600' },
  criticalSection: { marginBottom: 20 },
  saveBtn: { backgroundColor: '#3b82f6', padding: 18, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
