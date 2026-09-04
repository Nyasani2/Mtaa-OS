// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Alert, useHealthMedications } from '@/lib/health/hooks/useHealthMedications';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function MedicationsScreen() {
  const { user } = useAuthStore();
  const { medications, loading, error, refresh, updateStatus } = useHealthMedications(user?.id);
  const [tab, setTab] = useState<'all' | 'active' | 'completed' | 'discontinued'>('all');

  useEffect(() => {
    refresh();
  }, []);

  const safeMedications = medications || [];
  const activeMedications = safeMedications.filter((m: any) => m.status === 'active');
  const filteredMedications = tab === 'all' ? safeMedications : safeMedications.filter((m: any) => m.status === tab);

  const handleStatusChange = (id: string, status: 'completed' | 'discontinued') => {
    Alert.alert('Update Status', `Mark this medication as ${status}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => updateStatus(id, status) },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Medications</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text>Loading medications...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Medications</Text>
        <TouchableOpacity onPress={() => router.push('/(os)/health/medications/add' as any)}>
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'all' && styles.tabActive]} onPress={() => setTab('all')}>
          <Text style={[styles.tabText, tab === 'all' && styles.tabTextActive]}>All ({safeMedications.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'active' && styles.tabActive]} onPress={() => setTab('active')}>
          <Text style={[styles.tabText, tab === 'active' && styles.tabTextActive]}>Active ({activeMedications.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'completed' && styles.tabActive]} onPress={() => setTab('completed')}>
          <Text style={[styles.tabText, tab === 'completed' && styles.tabTextActive]}>Completed</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'discontinued' && styles.tabActive]} onPress={() => setTab('discontinued')}>
          <Text style={[styles.tabText, tab === 'discontinued' && styles.tabTextActive]}>Discontinued</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {filteredMedications.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="medical-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No {tab === 'all' ? '' : tab} medications</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(os)/health/medications/add' as any)}>
              <Text style={styles.emptyBtnText}>Add Medication</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredMedications.map((med: any) => (
            <View key={med.id} style={styles.medCard}>
              <View style={styles.medHeader}>
                <View style={styles.medIcon}>
                  <Ionicons name="medical" size={20} color="#fff" />
                </View>
                <View style={styles.medInfo}>
                  <Text style={styles.medName}>{med.name}</Text>
                  <Text style={styles.medGeneric}>{med.genericName}</Text>
                </View>
                <View style={[styles.statusBadge, med.status === 'active' && styles.statusActive, med.status === 'completed' && styles.statusCompleted, med.status === 'discontinued' && styles.statusDiscontinued]}>
                  <Text style={styles.statusText}>{med.status}</Text>
                </View>
              </View>
              <View style={styles.medDetails}>
                <Text style={styles.medDetail}>💊 {med.dosage} · {med.frequency}</Text>
                <Text style={styles.medDetail}>👨‍⚕️ Prescribed by {med.prescribedBy}</Text>
                <Text style={styles.medDetail}>📅 {new Date(med.startDate).toLocaleDateString()}{med.endDate ? ` - ${new Date(med.endDate).toLocaleDateString()}` : ''}</Text>
              </View>
              {med.status === 'active' && (
                <View style={styles.medActions}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleStatusChange(med.id, 'completed')}>
                    <Text style={styles.actionBtnText}>Mark Complete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDanger]} onPress={() => handleStatusChange(med.id, 'discontinued')}>
                    <Text style={styles.actionBtnDangerText}>Discontinue</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabs: { flexDirection: 'row', padding: 12, backgroundColor: '#fff', gap: 6 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, backgroundColor: '#f0f0f0' },
  tabActive: { backgroundColor: '#007AFF' },
  tabText: { fontSize: 12, color: '#666' },
  tabTextActive: { color: '#fff', fontWeight: '600' },
  content: { flex: 1, padding: 16 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 12 },
  emptyBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#007AFF', borderRadius: 8 },
  emptyBtnText: { color: '#fff', fontWeight: '600' },
  medCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  medHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  medIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center' },
  medInfo: { flex: 1 },
  medName: { fontSize: 16, fontWeight: '600', color: '#333' },
  medGeneric: { fontSize: 13, color: '#666' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: '#f0f0f0' },
  statusActive: { backgroundColor: '#E8F5E9' },
  statusCompleted: { backgroundColor: '#E3F2FD' },
  statusDiscontinued: { backgroundColor: '#FFEBEE' },
  statusText: { fontSize: 12, fontWeight: '600', color: '#666', textTransform: 'capitalize' },
  medDetails: { gap: 4 },
  medDetail: { fontSize: 14, color: '#666' },
  medActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { flex: 1, paddingVertical: 10, backgroundColor: '#E8F5E9', borderRadius: 8, alignItems: 'center' },
  actionBtnText: { color: '#2E7D32', fontWeight: '600' },
  actionBtnDanger: { backgroundColor: '#FFEBEE' },
  actionBtnDangerText: { color: '#C62828', fontWeight: '600' },
});
