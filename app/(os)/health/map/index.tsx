// @ts-nocheck
import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  ActivityIndicator, TextInput, Dimensions 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useHealthMap, MapEntityType } from '@/hooks/useHealthMap';
import { 
  MapPin, Ambulance, Pill, Leaf, Building2, Crosshair, 
  Search, Filter, Phone, Navigation, ChevronLeft, Star 
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

const TYPE_FILTERS: { key: MapEntityType | 'all'; label: string; icon: any; color: string }[] = [
  { key: 'all', label: 'All', icon: MapPin, color: '#2563EB' },
  { key: 'ambulance', label: 'Ambulance', icon: Ambulance, color: '#DC2626' },
  { key: 'pharmacy', label: 'Pharmacy', icon: Pill, color: '#7C3AED' },
  { key: 'herbal_clinic', label: 'Herbal', icon: Leaf, color: '#15803D' },
  { key: 'hospital', label: 'Hospital', icon: Building2, color: '#059669' },
];

const TYPE_STYLES: Record<MapEntityType, { color: string; bg: string; icon: any }> = {
  ambulance: { color: '#DC2626', bg: '#FEE2E2', icon: Ambulance },
  pharmacy: { color: '#7C3AED', bg: '#EDE9FE', icon: Pill },
  herbal_clinic: { color: '#15803D', bg: '#DCFCE7', icon: Leaf },
  hospital: { color: '#059669', bg: '#D1FAE5', icon: Building2 },
  clinic: { color: '#0891B2', bg: '#CFFAFE', icon: Building2 },
};

export default function HealthMapScreen() {
  const router = useRouter();
  const { entities, filteredEntities, loading, selectedType, setSelectedType, userLocation, refresh } = useHealthMap();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);

  const searched = filteredEntities.filter((e: any) => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.address && e.address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Health Map</Text>
        <TouchableOpacity onPress={refresh} style={styles.refreshBtn}>
          <Crosshair size={18} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Search size={18} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search facilities..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {TYPE_FILTERS.map((f) => {
          const isActive = selectedType === f.key;
          const FilterIcon = f.icon;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, isActive && { backgroundColor: f.color, borderColor: f.color }]}
              onPress={() => setSelectedType(f.key)}
            >
              <FilterIcon size={14} color={isActive ? '#fff' : f.color} />
              <Text style={[styles.filterText, isActive && { color: '#fff' }]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Map Placeholder / List Hybrid */}
      <View style={styles.mapPlaceholder}>
        <MapPin size={40} color="#CBD5E1" />
        <Text style={styles.mapPlaceholderText}>Interactive Map</Text>
        <Text style={styles.mapPlaceholderSub}>
          {userLocation ? `Lat: ${userLocation.lat.toFixed(4)}, Lng: ${userLocation.lng.toFixed(4)}` : 'Getting location...'}
        </Text>
        <Text style={styles.entityCount}>{searched.length} locations found</Text>
      </View>

      {/* Entity List */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#2563EB" />
          <Text style={styles.loadingText}>Loading locations...</Text>
        </View>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {searched.map((entity) => {
            const style = TYPE_STYLES[entity.type];
            const Icon = style.icon;
            const isSelected = selectedEntity === entity.id;

            return (
              <TouchableOpacity
                key={entity.id}
                style={[styles.entityCard, isSelected && styles.entityCardActive]}
                onPress={() => setSelectedEntity(isSelected ? null : entity.id)}
              >
                <View style={[styles.entityIcon, { backgroundColor: style.bg }]}>
                  <Icon size={20} color={style.color} />
                </View>
                <View style={styles.entityInfo}>
                  <Text style={styles.entityName}>{entity.name}</Text>
                  <View style={styles.entityMeta}>
                    <Text style={[styles.entityType, { color: style.color }]}>
                      {entity.type.replace('_', ' ').toUpperCase()}
                    </Text>
                    <Text style={styles.entityStatus}>• {entity.status}</Text>
                  </View>
                  {entity.address && (
                    <Text style={styles.entityAddress} numberOfLines={1}>{entity.address}</Text>
                  )}
                  {entity.rating && (
                    <View style={styles.ratingRow}>
                      <Star size={12} color="#F59E0B" fill="#F59E0B" />
                      <Text style={styles.ratingText}>{entity.rating.toFixed(1)}</Text>
                    </View>
                  )}
                </View>

                {isSelected && (
                  <View style={styles.actionButtons}>
                    {entity.phone && (
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#DBEAFE' }]}>
                        <Phone size={16} color="#2563EB" />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#D1FAE5' }]}>
                      <Navigation size={16} color="#059669" />
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

          {searched.length === 0 && (
            <View style={styles.emptyBox}>
              <MapPin size={32} color="#CBD5E1" />
              <Text style={styles.emptyText}>No locations found</Text>
              <Text style={styles.emptySub}>Try adjusting your filters</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingTop: 12, 
    paddingBottom: 8 
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#1F2937', textAlign: 'center' },
  refreshBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  searchBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    marginHorizontal: 16, 
    marginTop: 8,
    borderRadius: 12, 
    paddingHorizontal: 12, 
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#1F2937' },
  clearBtn: { fontSize: 14, color: '#9CA3AF', paddingHorizontal: 4 },
  filterScroll: { marginTop: 12 },
  filterContent: { paddingHorizontal: 16, gap: 8 },
  filterChip: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: '#E5E7EB', 
    backgroundColor: '#fff',
    marginRight: 8,
    gap: 6,
  },
  filterText: { fontSize: 12, fontWeight: '600', color: '#4B5563' },
  mapPlaceholder: { 
    height: 180, 
    backgroundColor: '#E2E8F0', 
    marginHorizontal: 16, 
    marginTop: 12, 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  mapPlaceholderText: { fontSize: 16, fontWeight: '600', color: '#94A3B8', marginTop: 8 },
  mapPlaceholderSub: { fontSize: 12, color: '#CBD5E1', marginTop: 4 },
  entityCount: { fontSize: 12, color: '#64748B', marginTop: 6, fontWeight: '500' },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 8, fontSize: 13, color: '#6B7280' },
  list: { flex: 1, marginTop: 12 },
  listContent: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  entityCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  entityCardActive: { borderWidth: 2, borderColor: '#2563EB' },
  entityIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  entityInfo: { flex: 1, marginLeft: 12 },
  entityName: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  entityMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  entityType: { fontSize: 10, fontWeight: '700' },
  entityStatus: { fontSize: 11, color: '#9CA3AF', marginLeft: 6, textTransform: 'capitalize' },
  entityAddress: { fontSize: 12, color: '#6B7280', marginTop: 3 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  ratingText: { fontSize: 12, color: '#F59E0B', fontWeight: '600', marginLeft: 4 },
  actionButtons: { flexDirection: 'row', gap: 8 },
  actionBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  emptyBox: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 15, fontWeight: '600', color: '#94A3B8', marginTop: 8 },
  emptySub: { fontSize: 13, color: '#CBD5E1', marginTop: 4 },
});
