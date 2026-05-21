import { View, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useState } from 'react';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SafeAreaWrapper } from '@/components/ui/SafeAreaWrapper';
import { Card } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCargoManifests } from '@/lib/domains/civic/border/hooks/useCargoManifests';
import { Text } from 'react-native';

export default function ManifestsList() {
  const [search, setSearch] = useState('');
  const { data: manifests, isLoading } = useCargoManifests();
  const filtered = manifests?.filter(m => 
    m.manifest_number?.toLowerCase().includes(search.toLowerCase()) ||
    m.shipper_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaWrapper>
      <ScreenHeader title="Cargo Manifests" subtitle="Import/Export declarations" />
      <View style={styles.searchContainer}>
        <TextInput style={styles.searchInput} placeholder="Search manifests..." placeholderTextColor="#64748b" value={search} onChangeText={setSearch} />
      </View>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {isLoading && <LoadingState message="Loading manifests..." />}
        {!isLoading && filtered?.length === 0 && <EmptyState message="No manifests found" />}
        {filtered?.map(manifest => (
          <TouchableOpacity key={manifest.id}>
            <Card style={styles.manifestCard}>
              <View style={styles.manifestHeader}>
                <Text style={styles.manifestNumber}>{manifest.manifest_number}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(manifest.status) }]}>
                  <Text style={styles.statusText}>{manifest.status}</Text>
                </View>
              </View>
              <Text style={styles.shipper}>Shipper: {manifest.shipper_name}</Text>
              <Text style={styles.meta}>Items: {manifest.item_count} | Value: {manifest.total_value} {manifest.currency}</Text>
              <Text style={styles.date}>Created: {new Date(manifest.created_at).toLocaleDateString()}</Text>
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaWrapper>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'cleared': return '#10b981';
    case 'pending': return '#f59e0b';
    case 'flagged': return '#ef4444';
    case 'inspection_required': return '#8b5cf6';
    default: return '#64748b';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  searchContainer: { paddingHorizontal: 16, paddingBottom: 12 },
  searchInput: { backgroundColor: '#1e293b', color: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: 14 },
  manifestCard: { padding: 16, marginBottom: 12 },
  manifestHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  manifestNumber: { color: '#e2e8f0', fontSize: 15, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  shipper: { color: '#94a3b8', fontSize: 13, marginBottom: 4 },
  meta: { color: '#64748b', fontSize: 12, marginBottom: 2 },
  date: { color: '#64748b', fontSize: 12 },
});
