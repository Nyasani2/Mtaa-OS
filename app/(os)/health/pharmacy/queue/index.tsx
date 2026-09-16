// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator, RefreshControl, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Ionicons } from '@expo/vector-icons';

// --- DRUG INTERACTION DATABASE (Simplified) ---
const DRUG_INTERACTIONS = {
  'warfarin': ['aspirin', 'ibuprofen', 'naproxen', 'acetaminophen'],
  'metformin': ['contrast dye', 'alcohol', 'cimetidine'],
  'lisinopril': ['potassium', 'spironolactone', 'nsaids'],
  'simvastatin': ['grapefruit', 'gemfibrozil', 'niacin'],
  'digoxin': ['amiodarone', 'verapamil', 'quinidine'],
};

const ALLERGY_CROSS_REACTIVITY = {
  'penicillin': ['amoxicillin', 'ampicillin', 'cephalosporins'],
  'sulfa': ['bactrim', 'sulfamethoxazole', 'trimethoprim'],
  'nsaids': ['ibuprofen', 'naproxen', 'aspirin', 'diclofenac'],
};

export default function PharmacyOS() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('queue'); // queue, verify, counseling, inventory
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, verified, dispensed
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ pending: 0, verified: 0, waiting: 0, controlled: 0 });
  
  // Verification Modal
  const [verifyModal, setVerifyModal] = useState(false);
  const [selectedRx, setSelectedRx] = useState(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [clinicalAlerts, setClinicalAlerts] = useState([]);
  const [verifying, setVerifying] = useState(false);
  
  // Inventory
  const [inventory, setInventory] = useState([]);

  useEffect(() => { loadPrescriptions(); }, [filterStatus]);

  const loadPrescriptions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('health_prescriptions')
        .select(`
          id,
          prescription_number,
          status,
          prescribed_at,
          patient:health_patients(id, first_name, last_name, age, gender, dob, allergies, phone),
          doctor:health_staff!prescribed_by(full_name),
          items:health_prescription_items(*)
        `)
        .order('prescribed_at', { ascending: false });

      if (filterStatus === 'pending') query = query.eq('status', 'active');
      if (filterStatus === 'verified') query = query.eq('status', 'verified');
      if (filterStatus === 'dispensed') query = query.eq('status', 'dispensed');

      const { data, error } = await query;
      
      if (error) throw error;

      // Calculate stats
      setStats({
        pending: data.filter(p => p.status === 'active').length,
        verified: data.filter(p => p.status === 'verified').length,
        waiting: data.filter(p => p.status === 'active' || p.status === 'verified').length,
        controlled: data.filter(p => 
          p.items?.some(item => 
            item.drug_name?.toLowerCase().includes('controlled') ||
            item.drug_name?.toLowerCase().includes('oxycodone') ||
            item.drug_name?.toLowerCase().includes('hydrocodone')
          )
        ).length
      });

      setPrescriptions(data || []);
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const checkClinicalAlerts = (prescription) => {
    const alerts = [];
    const patient = prescription.patient;
    const items = prescription.items || [];

    // Check allergies
    if (patient?.allergies) {
      items.forEach(item => {
        const drugName = item.drug_name.toLowerCase();
        patient.allergies.forEach(allergy => {
          const allergyLower = allergy.toLowerCase();
          if (drugName.includes(allergyLower) || 
              (ALLERGY_CROSS_REACTIVITY[allergyLower] && 
               ALLERGY_CROSS_REACTIVITY[allergyLower].some(cross => drugName.includes(cross)))) {
            alerts.push({
              type: 'critical',
              icon: 'alert-circle',
              title: 'ALLERGY ALERT',
              message: `Patient allergic to ${allergy}. Cross-reactivity possible with ${item.drug_name}.`
            });
          }
        });
      });
    }

    // Check drug interactions
    const drugNames = items.map(i => i.drug_name.toLowerCase());
    drugNames.forEach(drug1 => {
      const interactions = DRUG_INTERACTIONS[drug1];
      if (interactions) {
        interactions.forEach(interaction => {
          if (drugNames.some(d => d.includes(interaction))) {
            alerts.push({
              type: 'warning',
              icon: 'warning',
              title: 'DRUG INTERACTION',
              message: `${drug1} may interact with ${interaction}`
            });
          }
        });
      }
    });

    // Check for duplicate therapy
    const drugClasses = {
      'nsaids': ['ibuprofen', 'naproxen', 'diclofenac', 'meloxicam'],
      'ace_inhibitors': ['lisinopril', 'enalapril', 'ramipril', 'benazepril'],
      'statins': ['atorvastatin', 'simvastatin', 'rosuvastatin', 'pravastatin'],
    };

    Object.entries(drugClasses).forEach(([className, drugs]) => {
      const matches = drugNames.filter(name => drugs.some(d => name.includes(d)));
      if (matches.length > 1) {
        alerts.push({
          type: 'warning',
          icon: 'information-circle',
          title: 'DUPLICATE THERAPY',
          message: `Multiple ${className.replace('_', ' ')} detected: ${matches.join(', ')}`
        });
      }
    });

    return alerts;
  };

  const openVerification = (rx) => {
    setSelectedRx(rx);
    const alerts = checkClinicalAlerts(rx);
    setClinicalAlerts(alerts);
    setVerificationNotes('');
    setVerifyModal(true);
  };

  const verifyPrescription = async () => {
    setVerifying(true);
    try {
      await supabase
        .from('health_prescriptions')
        .update({
          status: 'verified',
          verified_by: user.id,
          verified_at: new Date().toISOString(),
          pharmacist_notes: verificationNotes
        })
        .eq('id', selectedRx.id);

      Alert.alert('Success', 'Prescription verified and ready for dispensing');
      setVerifyModal(false);
      loadPrescriptions();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setVerifying(false);
    }
  };

  const dispensePrescription = async (rx) => {
    Alert.alert(
      'Confirm Dispensing',
      `Dispense prescription #${rx.prescription_number} to ${rx.patient.first_name} ${rx.patient.last_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await supabase
                .from('health_prescriptions')
                .update({
                  status: 'dispensed',
                  dispensed_by: user.id,
                  dispensed_at: new Date().toISOString()
                })
                .eq('id', rx.id);

              Alert.alert('Success', 'Prescription dispensed');
              loadPrescriptions();
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          }
        }
      ]
    );
  };

  const getPriorityColor = (rx) => {
    const hasControlled = rx.items?.some(i => 
      i.drug_name?.toLowerCase().includes('oxycodone') ||
      i.drug_name?.toLowerCase().includes('hydrocodone') ||
      i.drug_name?.toLowerCase().includes('controlled')
    );
    
    if (hasControlled) return '#ef4444';
    if (rx.status === 'verified') return '#10b981';
    return '#3b82f6';
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return '#f59e0b';
      case 'verified': return '#10b981';
      case 'dispensed': return '#64748b';
      default: return '#94a3b8';
    }
  };

  const renderRxCard = ({ item }) => (
    <TouchableOpacity 
      style={[styles.rxCard, item.status === 'verified' && styles.verifiedCard]}
      onPress={() => item.status === 'active' ? openVerification(item) : null}
    >
      <View style={styles.rxHeader}>
        <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(item) }]} />
        <View style={styles.rxInfo}>
          <Text style={styles.rxNumber}>Rx #{item.prescription_number || item.id.slice(0,8)}</Text>
          <Text style={styles.rxDate}>{new Date(item.prescribed_at).toLocaleDateString()}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.patientSection}>
        <Ionicons name="person" size={18} color="#94a3b8" />
        <Text style={styles.patientName}>{item.patient?.first_name} {item.patient?.last_name}</Text>
        <Text style={styles.patientMeta}>{item.patient?.age}y • {item.patient?.phone || 'No phone'}</Text>
      </View>

      <View style={styles.medicationsList}>
        {item.items?.map((med, idx) => (
          <View key={idx} style={styles.medItem}>
            <Ionicons name="medkit" size={16} color="#3b82f6" />
            <View style={styles.medInfo}>
              <Text style={styles.medName}>{med.drug_name}</Text>
              <Text style={styles.medSig}>{med.dosage} - {med.frequency || 'Take as directed'}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.rxFooter}>
        <Text style={styles.doctorName}>Dr. {item.doctor?.full_name || 'Unknown'}</Text>
        {item.status === 'active' && (
          <TouchableOpacity style={styles.verifyBtn} onPress={() => openVerification(item)}>
            <Ionicons name="checkmark-circle" size={18} color="#10b981" />
            <Text style={styles.verifyBtnText}>Verify</Text>
          </TouchableOpacity>
        )}
        {item.status === 'verified' && (
          <TouchableOpacity style={styles.dispenseBtn} onPress={() => dispensePrescription(item)}>
            <Ionicons name="print" size={18} color="#fff" />
            <Text style={styles.dispenseBtnText}>Dispense</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pharmacy OS</Text>
        <View style={styles.userBadge}>
          <Ionicons name="medkit" size={24} color="#10b981" />
          <Text style={styles.userName}>Pharmacist</Text>
        </View>
      </View>

      {/* Stats Dashboard */}
      <View style={styles.statsGrid}>
        <View style={[styles.statBox, { borderColor: '#f59e0b' }]}>
          <Text style={[styles.statNumber, { color: '#f59e0b' }]}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending Review</Text>
        </View>
        <View style={[styles.statBox, { borderColor: '#10b981' }]}>
          <Text style={[styles.statNumber, { color: '#10b981' }]}>{stats.verified}</Text>
          <Text style={styles.statLabel}>Ready to Dispense</Text>
        </View>
        <View style={[styles.statBox, { borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
          <Text style={[styles.statNumber, { color: '#ef4444' }]}>{stats.controlled}</Text>
          <Text style={styles.statLabel}>Controlled</Text>
        </View>
        <View style={[styles.statBox, { borderColor: '#3b82f6' }]}>
          <Text style={[styles.statNumber, { color: '#3b82f6' }]}>{stats.waiting}</Text>
          <Text style={styles.statLabel}>Total Queue</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {[
          { id: 'all', label: 'All Prescriptions' },
          { id: 'pending', label: 'Pending Review' },
          { id: 'verified', label: 'Ready to Dispense' },
        ].map(filter => (
          <TouchableOpacity
            key={filter.id}
            style={[styles.filterPill, filterStatus === filter.id && styles.activeFilterPill]}
            onPress={() => setFilterStatus(filter.id)}
          >
            <Text style={[styles.filterText, filterStatus === filter.id && styles.activeFilterText]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Prescription Queue */}
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#10b981" /></View>
      ) : (
        <FlatList
          data={prescriptions}
          keyExtractor={(item) => item.id}
          renderItem={renderRxCard}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadPrescriptions(); }} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="medkit-outline" size={64} color="#475569" />
              <Text style={styles.emptyText}>No prescriptions in queue</Text>
              <Text style={styles.emptySub}>Prescriptions from doctors will appear here</Text>
            </View>
          }
        />
      )}

      {/* Verification Modal */}
      <Modal visible={verifyModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Prescription Verification</Text>
              <Text style={styles.modalPatient}>
                {selectedRx?.patient?.first_name} {selectedRx?.patient?.last_name}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setVerifyModal(false)}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Clinical Alerts */}
            {clinicalAlerts.length > 0 && (
              <View style={styles.alertsSection}>
                <Text style={styles.alertsTitle}>⚠️ Clinical Alerts</Text>
                {clinicalAlerts.map((alert, idx) => (
                  <View key={idx} style={[styles.alertBox, alert.type === 'critical' && styles.criticalAlert]}>
                    <Ionicons name={alert.icon} size={20} color={alert.type === 'critical' ? '#ef4444' : '#f59e0b'} />
                    <View style={styles.alertContent}>
                      <Text style={styles.alertTitle}>{alert.title}</Text>
                      <Text style={styles.alertMessage}>{alert.message}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Prescription Details */}
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Medications</Text>
              {selectedRx?.items?.map((item, idx) => (
                <View key={idx} style={styles.medDetail}>
                  <Text style={styles.medDetailName}>{item.drug_name}</Text>
                  <Text style={styles.medDetailSig}>Sig: {item.dosage} - {item.frequency}</Text>
                  <Text style={styles.medDetailQty}>Qty: {item.quantity || '30'} • Refills: {item.refills || '0'}</Text>
                </View>
              ))}
            </View>

            {/* Patient Info */}
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Patient Information</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>DOB:</Text>
                <Text style={styles.infoValue}>{selectedRx?.patient?.dob ? new Date(selectedRx.patient.dob).toLocaleDateString() : 'Unknown'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Allergies:</Text>
                <Text style={[styles.infoValue, selectedRx?.patient?.allergies?.length > 0 && styles.allergyText]}>
                  {selectedRx?.patient?.allergies?.join(', ') || 'NKDA'}
                </Text>
              </View>
            </View>

            {/* Verification Notes */}
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Pharmacist Notes</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Drug utilization review, counseling notes, substitutions..."
                placeholderTextColor="#64748b"
                value={verificationNotes}
                onChangeText={setVerificationNotes}
                multiline
                numberOfLines={4}
              />
            </View>

            <TouchableOpacity style={styles.verifyActionBtn} onPress={verifyPrescription} disabled={verifying}>
              {verifying ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Ionicons name="checkmark-circle" size={24} color="#fff" />
                  <Text style={styles.verifyActionText}>Verify Prescription</Text>
                </>
              )}
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
  
  statsGrid: { flexDirection: 'row', padding: 16, gap: 12 },
  statBox: { flex: 1, backgroundColor: '#1e293b', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  statNumber: { fontSize: 24, fontWeight: 'bold' },
  statLabel: { color: '#94a3b8', fontSize: 10, marginTop: 4 },
  
  filterScroll: { paddingHorizontal: 16, marginBottom: 16 },
  filterPill: { backgroundColor: '#1e293b', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 8 },
  activeFilterPill: { backgroundColor: '#10b981' },
  filterText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  activeFilterText: { color: '#fff' },
  
  listContent: { padding: 16, paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', marginTop: 100, padding: 20 },
  emptyText: { color: '#64748b', fontSize: 16, fontWeight: '600', marginTop: 16 },
  emptySub: { color: '#475569', fontSize: 14, marginTop: 4 },
  
  rxCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  verifiedCard: { borderColor: '#10b981', borderWidth: 2 },
  rxHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  priorityIndicator: { width: 4, height: 40, borderRadius: 2, marginRight: 12 },
  rxInfo: { flex: 1 },
  rxNumber: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  rxDate: { color: '#64748b', fontSize: 12 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  
  patientSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  patientName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  patientMeta: { color: '#94a3b8', fontSize: 12 },
  
  medicationsList: { backgroundColor: '#0f172a', borderRadius: 8, padding: 12, marginBottom: 12 },
  medItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, gap: 8 },
  medInfo: { flex: 1 },
  medName: { color: '#e2e8f0', fontSize: 14, fontWeight: '600' },
  medSig: { color: '#94a3b8', fontSize: 12 },
  
  rxFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  doctorName: { color: '#64748b', fontSize: 12 },
  verifyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6 },
  verifyBtnText: { color: '#10b981', fontSize: 14, fontWeight: '600' },
  dispenseBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#10b981', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  dispenseBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  
  modalContainer: { flex: 1, backgroundColor: '#020617' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#0f172a', borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  modalPatient: { color: '#10b981', fontSize: 16, marginTop: 4 },
  modalContent: { padding: 20 },
  
  alertsSection: { marginBottom: 20 },
  alertsTitle: { color: '#f59e0b', fontSize: 14, fontWeight: 'bold', marginBottom: 12 },
  alertBox: { flexDirection: 'row', backgroundColor: '#fef3c7', borderRadius: 8, padding: 12, marginBottom: 8, gap: 12 },
  criticalAlert: { backgroundColor: '#fee2e2' },
  alertContent: { flex: 1 },
  alertTitle: { color: '#92400e', fontSize: 12, fontWeight: 'bold' },
  alertMessage: { color: '#b45309', fontSize: 12, marginTop: 2 },
  
  detailSection: { marginBottom: 20 },
  sectionTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 12 },
  medDetail: { backgroundColor: '#1e293b', borderRadius: 8, padding: 12, marginBottom: 8 },
  medDetailName: { color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 4 },
  medDetailSig: { color: '#94a3b8', fontSize: 13 },
  medDetailQty: { color: '#64748b', fontSize: 12, marginTop: 2 },
  
  infoRow: { flexDirection: 'row', marginBottom: 8 },
  infoLabel: { color: '#94a3b8', fontSize: 13, width: 80 },
  infoValue: { color: '#fff', fontSize: 13, flex: 1 },
  allergyText: { color: '#ef4444', fontWeight: '600' },
  
  notesInput: { backgroundColor: '#1e293b', color: '#fff', fontSize: 14, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#334155', minHeight: 100, textAlignVertical: 'top' },
  
  verifyActionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#10b981', padding: 18, borderRadius: 12, marginTop: 20 },
  verifyActionText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
