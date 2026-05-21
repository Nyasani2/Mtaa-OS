// app/(os)/health/vaccinations.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { HealthVaccinationRecord } from '@/lib/health/types';
import { Ionicons } from '@expo/vector-icons';

export default function VaccinationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [records, setRecords] = useState<HealthVaccinationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      const { data: patient } = await supabase.from('health_patients').select('id').eq('user_id', user.id).single();
      if (patient) {
        const { data, error } = await supabase.from('health_vaccination_records').select('*').eq('patient_id', patient.id).order('administered_date', { ascending: false });
        if (error) throw error;
        setRecords(data as HealthVaccinationRecord[] || []);
      }
    } catch (err) {
      console.error('Failed to load vaccinations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderRecord = ({ item }: { item: HealthVaccinationRecord }) => {
    const isComplete = item.dose_number >= item.total_doses;
    return (
      <View style={styles.recordCard}>
        <View style={styles.recordHeader}>
          <View style={[styles.vaccineIcon, { backgroundColor: isComplete ? '#D1FAE5' : '#DBEAFE' }]}>
            <Ionicons name="fitness" size={24} color={isComplete ? '#10B981' : '#3B82F6'} />
          </View>
          <View style={styles.recordInfo}>
            <Text style={styles.vaccineName}>{item.vaccine_name}</Text>
            <Text style={styles.doseInfo}>Dose {item.dose_number} of {item.total_doses}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: isComplete ? '#D1FAE5' : '#FEF3C7' }]}>
            <Text style={[styles.statusText, { color: isComplete ? '#10B981' : '#F59E0B' }]}>
              {isComplete ? 'Complete' : 'Pending'}
            </Text>
          </View>
        </View>
        <View style={styles.recordDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar" size={14} color="#64748B" />
            <Text style={styles.detailText}>{new Date(item.administered_date).toLocaleDateString()}</Text>
          </View>
          {item.next_dose_date && (
            <View style={styles.detailRow}>
              <Ionicons name="time" size={14} color="#F59E0B" />
              <Text style={[styles.detailText, { color: '#F59E0B' }]}>Next: {new Date(item.next_dose_date).toLocaleDateString()}</Text>
            </View>
          )}
          {item.batch_number && (
            <Text style={styles.batchText}>Batch: {item.batch_number}</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vaccinations</Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#3B82F6" style={styles.loader} />
      ) : (
        <FlatList
          data={records}
          renderItem={renderRecord}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="fitness-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>No vaccination records</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B' },
  loader: { flex: 1, justifyContent: 'center' },
  list: { padding: 16, gap: 12 },
  recordCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  recordHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  vaccineIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  recordInfo: { flex: 1 },
  vaccineName: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  doseInfo: { fontSize: 13, color: '#64748B', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '700' },
  recordDetails: { borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12, gap: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 13, color: '#64748B' },
  batchText: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#64748B', marginTop: 12 },
});
