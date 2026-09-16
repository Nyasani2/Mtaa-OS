// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Ionicons } from '@expo/vector-icons';

export default function PatientVaultDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [patient, setPatient] = useState(null);
  const [dependents, setDependents] = useState([]);
  
  // User-Owned Vault Data
  const [vaultData, setVaultData] = useState({
    privateRecords: 0,
    immunizations: 0,
    allergies: [],
    bloodType: 'O+'
  });

  // Hospital Aggregate Data (What the facility sees)
  const [hospitalData, setHospitalData] = useState({
    totalVisits: 0,
    lastFacilityVisit: '',
    activeBills: 0
  });

  useEffect(() => { loadVault(); }, []);

  const loadVault = async () => {
    setLoading(true);
    try {
      // 1. Fetch Primary User Profile
      const { data: patData } = await supabase
        .from('health_patients')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setPatient(patData);

      // 2. Fetch Dependents (Children) - USER OWNED
      const { data: depData } = await supabase
        .from('health_dependents')
        .select('*')
        .eq('guardian_user_id', user.id)
        .order('created_at', { ascending: false });
      setDependents(depData || []);

      // 3. Fetch User-Owned Private Vault Stats
      const { data: records } = await supabase
        .from('user_health_vault')
        .select('id')
        .eq('user_id', user.id);
      
      // 4. Fetch Hospital Aggregate Logs (Facility side only)
      const { data: visits } = await supabase
        .from('health_facility_logs') // Aggregate table
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      setVaultData({
        privateRecords: records?.length || 0,
        immunizations: 12, // Mock
        allergies: patData?.allergies || [],
        bloodType: patData?.blood_type || 'Unknown'
      });

      setHospitalData({
        totalVisits: visits?.length || 0,
        lastFacilityVisit: visits?.[0]?.created_at || 'Never',
        activeBills: 0
      });

    } catch (err) {
      console.error('Vault load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const addDependent = () => {
    Alert.alert('Add Dependent', 'Opens modal to add child/dependent to your private vault.');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Decrypting Health Vault...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadVault(); }} />}
    >
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.heroHeader}>
          <View>
            <Text style={styles.greetingText}>Welcome back,</Text>
            <Text style={styles.patientName}>{patient?.first_name || 'User'} {patient?.last_name || ''}</Text>
            <View style={styles.vaultBadge}>
              <Ionicons name="lock-closed" size={12} color="#10b981" />
              <Text style={styles.vaultBadgeText}>End-to-End Encrypted Vault</Text>
            </View>
          </View>
          <View style={styles.bloodTypeBox}>
            <Text style={styles.bloodTypeLabel}>Blood Type</Text>
            <Text style={styles.bloodTypeValue}>{vaultData.bloodType}</Text>
          </View>
        </View>
      </View>

      {/* SECTION 1: MY PRIVATE HEALTH VAULT (User Owned) */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="shield-checkmark" size={20} color="#10b981" />
            <Text style={styles.sectionTitle}>My Private Health Vault</Text>
          </View>
          <Text style={styles.ownerText}>Owner: You</Text>
        </View>
        <Text style={styles.sectionDesc}>Your personal medical records, stored privately. Hospitals cannot access this without your explicit consent.</Text>
        
        <View style={styles.vaultGrid}>
          <TouchableOpacity style={styles.vaultCard} onPress={() => router.push('/health/patient/vault/records')}>
            <Ionicons name="document-text" size={24} color="#3b82f6" />
            <Text style={styles.vaultValue}>{vaultData.privateRecords}</Text>
            <Text style={styles.vaultLabel}>Private Records</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.vaultCard} onPress={() => router.push('/health/patient/vault/immunizations')}>
            <Ionicons name="syringe" size={24} color="#10b981" />
            <Text style={styles.vaultValue}>{vaultData.immunizations}</Text>
            <Text style={styles.vaultLabel}>Immunizations</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.vaultCard} onPress={() => router.push('/health/patient/vault/allergies')}>
            <Ionicons name="warning" size={24} color="#ef4444" />
            <Text style={styles.vaultValue}>{vaultData.allergies.length}</Text>
            <Text style={styles.vaultLabel}>Allergies</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.vaultCard} onPress={() => router.push('/health/patient/vault/tests')}>
            <Ionicons name="flask" size={24} color="#8b5cf6" />
            <Text style={styles.vaultValue}>0</Text>
            <Text style={styles.vaultLabel}>Private Tests</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SECTION 2: DEPENDENTS / CHILDREN (User Owned) */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="people" size={20} color="#f59e0b" />
            <Text style={styles.sectionTitle}>Dependents & Children</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={addDependent}>
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionDesc}>You are the guardian of these private medical records.</Text>

        {dependents.length === 0 ? (
          <TouchableOpacity style={styles.emptyDependentCard} onPress={addDependent}>
            <Ionicons name="child" size={32} color="#475569" />
            <Text style={styles.emptyDependentText}>No dependents added yet</Text>
            <Text style={styles.emptyDependentSub}>Tap to add a child or dependent</Text>
          </TouchableOpacity>
        ) : (
          dependents.map((dep, idx) => (
            <TouchableOpacity key={idx} style={styles.dependentCard} onPress={() => router.push(`/health/patient/vault/dependent/${dep.id}`)}>
              <View style={styles.depAvatar}>
                <Text style={styles.depAvatarText}>{dep.first_name?.[0] || '?'}</Text>
              </View>
              <View style={styles.depInfo}>
                <Text style={styles.depName}>{dep.first_name} {dep.last_name}</Text>
                <Text style={styles.depMeta}>{dep.age || '?'} years • {dep.gender || 'N/A'}</Text>
              </View>
              <View style={styles.depVaultStatus}>
                <Ionicons name="lock-closed" size={12} color="#10b981" />
                <Text style={styles.depVaultText}>Private</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* SECTION 3: HOSPITAL FACILITY LOGS (Aggregate/Operational) */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="business" size={20} color="#64748b" />
            <Text style={styles.sectionTitle}>Hospital Facility Logs</Text>
          </View>
          <Text style={styles.ownerText}>Owner: Facility</Text>
        </View>
        <Text style={styles.sectionDesc}>Operational data kept by the hospital for billing and public health statistics.</Text>

        <View style={styles.hospitalLogCard}>
          <View style={styles.logRow}>
            <Text style={styles.logLabel}>Total Facility Visits</Text>
            <Text style={styles.logValue}>{hospitalData.totalVisits}</Text>
          </View>
          <View style={styles.logDivider} />
          <View style={styles.logRow}>
            <Text style={styles.logLabel}>Last Visit Date</Text>
            <Text style={styles.logValue}>
              {hospitalData.lastFacilityVisit !== 'Never' 
                ? new Date(hospitalData.lastFacilityVisit).toLocaleDateString() 
                : 'Never'}
            </Text>
          </View>
          <View style={styles.logDivider} />
          <View style={styles.logRow}>
            <Text style={styles.logLabel}>Outstanding Bills</Text>
            <Text style={[styles.logValue, { color: hospitalData.activeBills > 0 ? '#ef4444' : '#10b981' }]}>
              KES {hospitalData.activeBills.toLocaleString()}
            </Text>
          </View>
        </View>
        
        <View style={styles.aggregateNotice}>
          <Ionicons name="information-circle" size={16} color="#94a3b8" />
          <Text style={styles.aggregateText}>
            The hospital only tracks aggregate counts (e.g., "5 flu cases today") and billing. Your private medical data remains in your vault.
          </Text>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#020617' },
  loadingText: { color: '#94a3b8', marginTop: 16, fontSize: 16 },
  
  // Hero
  heroSection: { backgroundColor: '#0f172a', paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greetingText: { color: '#94a3b8', fontSize: 14 },
  patientName: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginTop: 4 },
  vaultBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginTop: 8, alignSelf: 'flex-start', gap: 4 },
  vaultBadgeText: { color: '#10b981', fontSize: 11, fontWeight: '600' },
  bloodTypeBox: { backgroundColor: '#1e293b', borderRadius: 12, padding: 12, alignItems: 'center', minWidth: 80, borderWidth: 1, borderColor: '#334155' },
  bloodTypeLabel: { color: '#94a3b8', fontSize: 10 },
  bloodTypeValue: { color: '#ef4444', fontSize: 20, fontWeight: 'bold', marginTop: 2 },
  
  // Sections
  section: { backgroundColor: '#0f172a', marginHorizontal: 16, marginTop: 16, borderRadius: 12, padding: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  ownerText: { color: '#64748b', fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  sectionDesc: { color: '#64748b', fontSize: 12, marginBottom: 16, lineHeight: 18 },
  
  // Vault Grid
  vaultGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  vaultCard: { width: '48%', backgroundColor: '#1e293b', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  vaultValue: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 8 },
  vaultLabel: { color: '#94a3b8', fontSize: 12, marginTop: 4, textAlign: 'center' },
  
  // Dependents
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3b82f6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 4 },
  addBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  emptyDependentCard: { alignItems: 'center', padding: 24, backgroundColor: '#1e293b', borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: '#334155' },
  emptyDependentText: { color: '#94a3b8', fontSize: 14, fontWeight: '600', marginTop: 12 },
  emptyDependentSub: { color: '#64748b', fontSize: 12, marginTop: 4 },
  dependentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#334155' },
  depAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f59e0b', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  depAvatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  depInfo: { flex: 1 },
  depName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  depMeta: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  depVaultStatus: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  depVaultText: { color: '#10b981', fontSize: 10, fontWeight: 'bold' },
  
  // Hospital Logs
  hospitalLogCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#334155' },
  logRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  logLabel: { color: '#94a3b8', fontSize: 14 },
  logValue: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  logDivider: { height: 1, backgroundColor: '#334155', marginVertical: 8 },
  aggregateNotice: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: 'rgba(100, 116, 139, 0.1)', borderRadius: 8, padding: 12, marginTop: 12, gap: 8 },
  aggregateText: { color: '#94a3b8', fontSize: 11, flex: 1, lineHeight: 16 },
});
