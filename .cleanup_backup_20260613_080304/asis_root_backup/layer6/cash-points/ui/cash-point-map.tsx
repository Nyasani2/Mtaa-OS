/**
 * ASIS Layer 6 — Cash Point Map UI
 * Modern, clean, lightweight, touch-friendly, map-first UX
 * Avoid cluttered dashboards, enterprise banking visuals
 */

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { CashPoint, OperationalState } from '../types';
import { DiscoveryResult } from '../geo-discovery';

interface CashPointMapProps {
  userLocation: { lat: number; lng: number };
  cashPoints: DiscoveryResult[];
  selectedId?: string;
  onSelect: (cashPoint: CashPoint) => void;
  onNavigate: (cashPoint: CashPoint) => void;
}

const { width } = Dimensions.get('window');

export const CashPointMap: React.FC<CashPointMapProps> = ({
  userLocation,
  cashPoints,
  selectedId,
  onSelect,
  onNavigate,
}) => {
  const [filter, setFilter] = useState<'all' | 'open' | 'verified'>('all');

  const filtered = cashPoints.filter(result => {
    if (filter === 'open') return result.isOpenNow;
    if (filter === 'verified') return result.cashPoint.verified;
    return true;
  });

  const getStatusColor = (status: OperationalState) => {
    switch (status) {
      case 'online': return '#059669';
      case 'low_liquidity': return '#F59E0B';
      case 'offline': return '#9CA3AF';
      default: return '#6B7280';
    }
  };

  return (
    <View style={styles.container}>
      {/* Filter Bar */}
      <View style={styles.filterBar}>
        {(['all', 'open', 'verified'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'All' : f === 'open' ? 'Open Now' : 'Verified'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Map Placeholder */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapText}>🗺️ Map View</Text>
          <Text style={styles.mapSubtext}>{filtered.length} cash points nearby</Text>
          <Text style={styles.mapHint}>Your location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</Text>
        </View>

        {/* Cash Point Pins */}
        {filtered.slice(0, 5).map((result, index) => (
          <TouchableOpacity
            key={result.cashPoint.id}
            style={[
              styles.mapPin,
              { top: 80 + index * 60, left: 30 + (index % 3) * 100 },
              selectedId === result.cashPoint.id && styles.mapPinSelected,
            ]}
            onPress={() => onSelect(result.cashPoint)}
          >
            <View style={[styles.pinDot, { backgroundColor: getStatusColor(result.cashPoint.status) }]} />
            <Text style={styles.pinDistance}>{result.distanceKm.toFixed(1)}km</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bottom Sheet — Cash Point List */}
      <ScrollView style={styles.bottomSheet} showsVerticalScrollIndicator={false}>
        {filtered.map(result => (
          <TouchableOpacity
            key={result.cashPoint.id}
            style={[
              styles.listItem,
              selectedId === result.cashPoint.id && styles.listItemSelected,
            ]}
            onPress={() => onSelect(result.cashPoint)}
          >
            <View style={styles.itemHeader}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(result.cashPoint.status) }]} />
              <Text style={styles.itemName}>{result.cashPoint.name}</Text>
              <Text style={styles.itemDistance}>{result.distanceKm.toFixed(1)} km</Text>
            </View>
            <Text style={styles.itemAddress}>{result.cashPoint.location.address}</Text>
            <View style={styles.itemMeta}>
              <Text style={styles.itemMetaText}>
                {result.isOpenNow ? '🟢 Open' : '🔴 Closed'} · ⭐ {result.cashPoint.rating}
              </Text>
              <Text style={styles.itemMetaText}>
                💰 {result.cashPoint.fees.withdrawal || 0} fee · 🚶 {result.estimatedWalkMinutes} min
              </Text>
            </View>
            {selectedId === result.cashPoint.id && (
              <TouchableOpacity style={styles.navigateButton} onPress={() => onNavigate(result.cashPoint)}>
                <Text style={styles.navigateText}>Navigate Here</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  filterBar: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  filterChipActive: { backgroundColor: '#059669' },
  filterText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  filterTextActive: { color: '#FFFFFF' },
  mapContainer: {
    height: 280,
    backgroundColor: '#E5E7EB',
    position: 'relative',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapText: { fontSize: 18, fontWeight: '600', color: '#6B7280' },
  mapSubtext: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
  mapHint: { fontSize: 11, color: '#D1D5DB', marginTop: 8 },
  mapPin: {
    position: 'absolute',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    elevation: 2,
  },
  mapPinSelected: { borderWidth: 2, borderColor: '#059669' },
  pinDot: { width: 10, height: 10, borderRadius: 5, marginBottom: 2 },
  pinDistance: { fontSize: 10, fontWeight: '600', color: '#374151' },
  bottomSheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    paddingTop: 16,
  },
  listItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  listItemSelected: { backgroundColor: '#ECFDF5' },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  itemName: { flex: 1, fontSize: 15, fontWeight: '600', color: '#111827' },
  itemDistance: { fontSize: 13, color: '#059669', fontWeight: '500' },
  itemAddress: { fontSize: 13, color: '#6B7280', marginBottom: 6 },
  itemMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  itemMetaText: { fontSize: 12, color: '#9CA3AF' },
  navigateButton: {
    backgroundColor: '#059669',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  navigateText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
});
