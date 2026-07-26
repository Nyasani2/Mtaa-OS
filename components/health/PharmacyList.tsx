import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface PharmacyItem {
  id: string;
  name: string;
  type: 'chemist' | 'pharmacy' | 'herbal' | 'hospital' | 'clinic';
  address?: string;
  phone?: string;
  is_open?: boolean;
  distance_km?: number;
  latitude?: number;
  longitude?: number;
  rating?: number;
  hours?: string;
}

interface PharmacyListProps {
  pharmacies: PharmacyItem[];
  onPress?: (pharmacy: PharmacyItem) => void;
  filter?: 'all' | 'chemist' | 'pharmacy' | 'herbal' | 'hospital';
}

const TYPE_COLORS: Record<string, string> = {
  chemist: '#10b981',
  pharmacy: '#0ea5e9',
  herbal: '#f59e0b',
  hospital: '#ef4444',
  clinic: '#8b5cf6',
};

const TYPE_LABELS: Record<string, string> = {
  chemist: 'Chemist',
  pharmacy: 'Pharmacy',
  herbal: 'Herbal',
  hospital: 'Hospital',
  clinic: 'Clinic',
};

export default function PharmacyList({ pharmacies, onPress, filter = 'all' }: PharmacyListProps) {
  const filtered = filter === 'all' ? pharmacies : pharmacies.filter((p) => p.type === filter);

  const renderItem = ({ item }: { item: PharmacyItem }) => (
    <TouchableOpacity style={s.card} onPress={() => onPress?.(item)}>
      <View style={s.row}>
        <View style={[s.iconWrap, { backgroundColor: TYPE_COLORS[item.type] + '15' }]}>
          <Ionicons
            name={
              item.type === 'chemist' ? 'flask-outline' :
              item.type === 'herbal' ? 'leaf-outline' :
              item.type === 'hospital' ? 'medical-outline' :
              'medkit-outline'
            }
            size={22}
            color={TYPE_COLORS[item.type]}
          />
        </View>
        <View style={s.body}>
          <Text style={s.name}>{item.name}</Text>
          <View style={s.badgeRow}>
            <View style={[s.badge, { backgroundColor: TYPE_COLORS[item.type] + '20' }]}>
              <Text style={[s.badgeText, { color: TYPE_COLORS[item.type] }]}>
                {TYPE_LABELS[item.type] || item.type}
              </Text>
            </View>
            {item.is_open !== undefined && (
              <View style={[s.badge, { backgroundColor: item.is_open ? '#d1fae5' : '#fee2e2' }]}>
                <Text style={[s.badgeText, { color: item.is_open ? '#065f46' : '#991b1b' }]}>
                  {item.is_open ? 'Open' : 'Closed'}
                </Text>
              </View>
            )}
          </View>
          {item.address ? <Text style={s.addr}>{item.address}</Text> : null}
          {item.hours ? <Text style={s.hours}>🕒 {item.hours}</Text> : null}
        </View>
        <View style={s.right}>
          {item.distance_km !== undefined && (
            <Text style={s.dist}>{item.distance_km.toFixed(1)} km</Text>
          )}
          {item.rating !== undefined && (
            <View style={s.ratingRow}>
              <Ionicons name="star" size={12} color="#f59e0b" />
              <Text style={s.rating}>{item.rating.toFixed(1)}</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
        </View>
      </View>
      {item.phone ? (
        <View style={s.phoneRow}>
          <Ionicons name="call-outline" size={14} color="#0ea5e9" />
          <Text style={s.phone}>{item.phone}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={filtered}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={filtered.length === 0 ? s.emptyContainer : s.list}
      ListEmptyComponent={
        <View style={s.empty}>
          <Ionicons name="medkit-outline" size={48} color="#cbd5e1" />
          <Text style={s.emptyTitle}>No {filter === 'all' ? 'pharmacies' : filter + 's'} found</Text>
          <Text style={s.emptySub}>Try adjusting your search or location.</Text>
        </View>
      }
    />
  );
}

const s = StyleSheet.create({
  list: { padding: 12, paddingBottom: 24 },
  emptyContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  body: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  addr: { fontSize: 12, color: '#64748b', marginTop: 4 },
  hours: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  right: { alignItems: 'flex-end', marginLeft: 8 },
  dist: { fontSize: 12, fontWeight: '700', color: '#10b981' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 4 },
  rating: { fontSize: 12, fontWeight: '700', color: '#f59e0b' },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  phone: { fontSize: 13, color: '#0ea5e9', fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#64748b', marginTop: 12 },
  emptySub: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
});
