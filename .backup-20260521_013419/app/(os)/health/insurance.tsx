// app/(os)/health/insurance.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { HealthInsurance } from '@/lib/health/types';
import { Ionicons } from '@expo/vector-icons';

export default function InsuranceScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [policies, setPolicies] = useState<HealthInsurance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('health_insurance')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPolicies(data as HealthInsurance[] || []);
    } catch (err) {
      console.error('Failed to load insurance:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderPolicy = ({ item }: { item: HealthInsurance }) => (
    <View style={styles.policyCard}>
      <View style={styles.policyHeader}>
        <View style={styles.providerIcon}>
          <Ionicons name="shield-checkmark" size={28} color="#10B981" />
        </View>
        <View style={styles.policyInfo}>
          <Text style={styles.providerName}>{item.provider_name}</Text>
          <Text style={styles.policyNumber}>Policy: {item.policy_number}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.is_active ? '#D1FAE5' : '#FEE2E2' }]}>
          <Text style={[styles.statusText, { color: item.is_active ? '#10B981' : '#EF4444' }]}>
            {item.is_active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>
      <View style={styles.policyDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Cover Type</Text>
          <Text style={styles.detailValue}>{item.cover_type || 'Standard'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Premium</Text>
          <Text style={styles.detailValue}>KES {item.premium_amount.toLocaleString()}/yr</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Dependents</Text>
          <Text style={styles.detailValue}>{item.dependents}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Valid Until</Text>
          <Text style={styles.detailValue}>{item.valid_until ? new Date(item.valid_until).toLocaleDateString() : 'N/A'}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Insurance</Text>
        <TouchableOpacity onPress={() => router.push('/health/add-insurance' as any)}>
          <Ionicons name="add" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#3B82F6" style={styles.loader} />
      ) : (
        <FlatList
          data={policies}
          renderItem={renderPolicy}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="shield-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>No insurance policies</Text>
              <TouchableOpacity style={styles.addButton} onPress={() => router.push('/health/add-insurance' as any)}>
                <Text style={styles.addButtonText}>Add Policy</Text>
              </TouchableOpacity>
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
  policyCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  policyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  providerIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#D1FAE5', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  policyInfo: { flex: 1 },
  providerName: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  policyNumber: { fontSize: 12, color: '#64748B', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '700' },
  policyDetails: { borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  detailLabel: { fontSize: 13, color: '#64748B' },
  detailValue: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#64748B', marginTop: 12, marginBottom: 20 },
  addButton: { backgroundColor: '#3B82F6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  addButtonText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
});
