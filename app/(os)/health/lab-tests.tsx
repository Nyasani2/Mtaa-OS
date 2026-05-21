// app/(os)/health/lab-tests.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useHealthPatient } from '@/lib/health/hooks/useHealthPatient';
import { HealthLabTest } from '@/lib/health/types';
import { Ionicons } from '@expo/vector-icons';

export default function LabTestsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { labTests, isLoading, refresh } = useHealthPatient(user?.id);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#F59E0B',
      in_progress: '#3B82F6',
      completed: '#10B981',
      abnormal: '#EF4444',
    };
    return colors[status] || '#64748B';
  };

  const renderTest = ({ item }: { item: HealthLabTest }) => (
    <TouchableOpacity style={styles.testCard} onPress={() => router.push(`/health/lab-test/${item.id}` as any)}>
      <View style={styles.testHeader}>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.result_status) }]} />
        <Text style={[styles.statusText, { color: getStatusColor(item.result_status) }]}>
          {item.result_status.replace('_', ' ').toUpperCase()}
        </Text>
        <Text style={styles.testDate}>{new Date(item.ordered_date).toLocaleDateString()}</Text>
      </View>
      <Text style={styles.testName}>{item.test_name}</Text>
      {item.test_category && <Text style={styles.testCategory}>{item.test_category}</Text>}
      {item.test_code && <Text style={styles.testCode}>Code: {item.test_code}</Text>}
      {item.result_date && (
        <View style={styles.resultRow}>
          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
          <Text style={styles.resultDate}>Result: {new Date(item.result_date).toLocaleDateString()}</Text>
        </View>
      )}
      {item.cost > 0 && (
        <Text style={styles.cost}>KES {item.cost.toLocaleString()}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lab Results</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={labTests}
        renderItem={renderTest}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="flask-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>No lab tests yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B' },
  list: { padding: 16, gap: 12 },
  testCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  testHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusText: { fontSize: 11, fontWeight: '700', flex: 1 },
  testDate: { fontSize: 12, color: '#94A3B8' },
  testName: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  testCategory: { fontSize: 13, color: '#64748B', marginTop: 2 },
  testCode: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  resultDate: { fontSize: 12, color: '#10B981' },
  cost: { fontSize: 14, fontWeight: '700', color: '#3B82F6', marginTop: 8 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#64748B', marginTop: 12 },
});
