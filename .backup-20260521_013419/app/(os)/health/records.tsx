// app/(os)/health/records.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useHealthPatient } from '@/lib/health/hooks/useHealthPatient';
import { HealthRecord } from '@/lib/health/types';
import { Ionicons } from '@expo/vector-icons';

export default function RecordsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { records, isLoading, refresh } = useHealthPatient(user?.id);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'lab' | 'prescription' | 'visit'>('all');

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const filteredRecords = records.filter(r => {
    if (filter === 'all') return true;
    return r.record_type.toLowerCase().includes(filter);
  });

  const getRecordIcon = (type: string) => {
    const icons: Record<string, string> = {
      lab: 'flask',
      prescription: 'medical',
      visit: 'calendar',
      diagnosis: 'document-text',
      referral: 'arrow-forward',
    };
    return icons[type.toLowerCase()] || 'document-text';
  };

  const getRecordColor = (type: string) => {
    const colors: Record<string, string> = {
      lab: '#8B5CF6',
      prescription: '#10B981',
      visit: '#3B82F6',
      diagnosis: '#F59E0B',
      referral: '#06B6D4',
    };
    return colors[type.toLowerCase()] || '#64748B';
  };

  const renderRecord = ({ item }: { item: HealthRecord }) => (
    <TouchableOpacity style={styles.recordCard} onPress={() => router.push(`/health/record/${item.id}` as any)}>
      <View style={[styles.recordIcon, { backgroundColor: getRecordColor(item.record_type) + '15' }]}>
        <Ionicons name={getRecordIcon(item.record_type) as any} size={24} color={getRecordColor(item.record_type)} />
      </View>
      <View style={styles.recordInfo}>
        <Text style={styles.recordTitle}>{item.title}</Text>
        <Text style={styles.recordType}>{item.record_type}</Text>
        <Text style={styles.recordDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
        {item.is_confidential && (
          <View style={styles.confidentialBadge}>
            <Ionicons name="lock-closed" size={12} color="#EF4444" />
            <Text style={styles.confidentialText}>Confidential</Text>
          </View>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
    </TouchableOpacity>
  );

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'lab', label: 'Lab' },
    { key: 'prescription', label: 'Rx' },
    { key: 'visit', label: 'Visits' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medical Records</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.filterRow}>
        {filters.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key as any)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredRecords}
        renderItem={renderRecord}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>No records found</Text>
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
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginVertical: 12 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0' },
  filterChipActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  filterText: { fontSize: 12, fontWeight: '500', color: '#64748B' },
  filterTextActive: { color: '#FFF' },
  list: { padding: 16, gap: 12 },
  recordCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  recordIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  recordInfo: { flex: 1 },
  recordTitle: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  recordType: { fontSize: 12, color: '#64748B', textTransform: 'capitalize', marginTop: 2 },
  recordDate: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
  confidentialBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' },
  confidentialText: { fontSize: 10, fontWeight: '600', color: '#EF4444' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#64748B', marginTop: 12 },
});
