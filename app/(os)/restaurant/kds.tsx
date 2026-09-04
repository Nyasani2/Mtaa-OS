import { useState } from 'react';
// @ts-nocheck
// ============================================================================
// MTAA Restaurant Module — Kitchen Display System (KDS) Screen
// Web-safe: Uses polling instead of WebSocket for browser compatibility
// ============================================================================

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, RefreshControl, Dimensions, Vibration } from 'react-native';
import { useKds } from '@/lib/restaurant/hooks';

const { width } = Dimensions.get('window');

export default function RestaurantKDS() {
  const {
    tickets, stations, selectedStation, isLoading, error,
    loadTickets, updateTicketStatus, startItem, completeItem,
    bumpTicket, loadStations, loadMetrics, setSelectedStation
  } = useKds();

  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'cooking' | 'ready'>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Initial load
  useEffect(() => {
    loadStations();
    loadTickets();
    loadMetrics('today');
  }, []);

  // Polling fallback for realtime (works on web + native)
  useEffect(() => {
    const POLL_INTERVAL = 5000; // 5 seconds

    const poll = async () => {
      try {
        await loadTickets(selectedStation || undefined);
      } catch (e) {
        // Silently fail on poll — don't crash UI
      }
    };

    pollingRef.current = setInterval(poll, POLL_INTERVAL);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [selectedStation]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTickets(selectedStation || undefined);
    setRefreshing(false);
  }, [selectedStation]);

  const safeTickets = tickets || [];

  const filteredTickets = safeTickets.filter((t) => {
    if (filter === 'all') return true;
    return t.status === filter;
  });

  const getTicketAge = (createdAt: string) => {
    if (!createdAt) return 0;
    const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    return mins;
  };

  const getAgeColor = (mins: number) => {
    if (mins < 5) return '#10B981';
    if (mins < 10) return '#F59E0B';
    return '#EF4444';
  };

  const handleUpdateStatus = async (ticketId: string, status: string, reason?: string) => {
    try {
      await updateTicketStatus(ticketId, status, reason);
      if (soundEnabled) {
        Vibration.vibrate(100);
      }
    } catch (e: any) {
      // Silently handle — UI stays responsive
    }
  };

  const handleBump = async (ticketId: string) => {
    try {
      await bumpTicket(ticketId, 'server');
      if (soundEnabled) {
        Vibration.vibrate(200);
      }
    } catch (e: any) {
      // Silently handle
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kitchen Display</Text>
        <TouchableOpacity onPress={() => setSoundEnabled(!soundEnabled)}>
          <Text style={styles.headerIcon}>{soundEnabled ? '🔔' : '🔕'}</Text>
        </TouchableOpacity>
      </View>

      {/* Station Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stationBar}>
        <TouchableOpacity
          style={[styles.stationChip, !selectedStation && styles.stationChipActive]}
          onPress={() => { setSelectedStation(null); loadTickets(); }}
        >
          <Text style={[styles.stationChipText, !selectedStation && styles.stationChipTextActive]}>
            All Stations
          </Text>
        </TouchableOpacity>
        {(stations || []).map((station) => (
          <TouchableOpacity
            key={station.id}
            style={[styles.stationChip, selectedStation === station.id && styles.stationChipActive]}
            onPress={() => { setSelectedStation(station.id); loadTickets(station.id); }}
          >
            <Text style={[styles.stationChipText, selectedStation === station.id && styles.stationChipTextActive]}>
              {station.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Status Filter */}
      <View style={styles.filterBar}>
        {(['all', 'pending', 'cooking', 'ready'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== 'all' && ` (${safeTickets.filter((t: any) => t.status === f).length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tickets Grid */}
      <FlatList
        data={filteredTickets}
        keyExtractor={(item) => item.id}
        numColumns={width > 600 ? 2 : 1}
        contentContainerStyle={styles.ticketGrid}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => {
          const age = getTicketAge(item.created_at);
          const ageColor = getAgeColor(age);
          const isDelayed = item.priority === 'delayed' || age > 15;
          const safeItems = item.items || [];

          return (
            <View style={[
              styles.ticketCard,
              isDelayed && styles.ticketCardDelayed,
              item.status === 'ready' && styles.ticketCardReady,
            ]}>
              {/* Ticket Header */}
              <View style={styles.ticketHeader}>
                <View style={styles.ticketMeta}>
                  <Text style={styles.ticketNumber}>#{item.ticket_number}</Text>
                  <Text style={[styles.ticketAge, { color: ageColor }]}>
                    {age}m
                  </Text>
                </View>
                <View style={[styles.ticketTypeBadge, { backgroundColor: getTypeColor(item.order_type) }]}>
                  <Text style={styles.ticketTypeText}>{item.order_type}</Text>
                </View>
              </View>

              {/* Table/Customer Info */}
              <View style={styles.ticketInfo}>
                {item.table_number && (
                  <Text style={styles.ticketInfoText}>🪑 Table {item.table_number}</Text>
                )}
                {item.customer_name && (
                  <Text style={styles.ticketInfoText}>👤 {item.customer_name}</Text>
                )}
                {item.notes && (
                  <Text style={styles.ticketNotes}>📝 {item.notes}</Text>
                )}
              </View>

              {/* Items */}
              <View style={styles.itemsList}>
                {safeItems.map((ticketItem: any, idx: number) => (
                  <View key={idx} style={styles.itemRow}>
                    <View style={styles.itemStatus}>
                      {ticketItem.status === 'pending' && <View style={[styles.statusDot, { backgroundColor: '#9CA3AF' }]} />}
                      {ticketItem.status === 'cooking' && <View style={[styles.statusDot, { backgroundColor: '#F59E0B' }]} />}
                      {ticketItem.status === 'ready' && <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />}
                    </View>
                    <Text style={[
                      styles.itemText,
                      ticketItem.status === 'ready' && styles.itemTextReady,
                      ticketItem.status === 'served' && styles.itemTextServed,
                    ]}>
                      {ticketItem.quantity}x {ticketItem.name}
                    </Text>
                    {ticketItem.modifiers && (
                      <Text style={styles.itemModifiers}>{JSON.stringify(ticketItem.modifiers)}</Text>
                    )}
                    {ticketItem.notes && (
                      <Text style={styles.itemNotes}>📝 {ticketItem.notes}</Text>
                    )}
                  </View>
                ))}
              </View>

              {/* Actions */}
              <View style={styles.ticketActions}>
                {item.status === 'pending' && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#F59E0B' }]}
                    onPress={() => handleUpdateStatus(item.id, 'cooking')}
                  >
                    <Text style={styles.actionButtonText}>Start Cooking</Text>
                  </TouchableOpacity>
                )}
                {item.status === 'cooking' && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#10B981' }]}
                    onPress={() => handleUpdateStatus(item.id, 'ready')}
                  >
                    <Text style={styles.actionButtonText}>Mark Ready</Text>
                  </TouchableOpacity>
                )}
                {item.status === 'ready' && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#3B82F6' }]}
                    onPress={() => handleBump(item.id)}
                  >
                    <Text style={styles.actionButtonText}>Serve / Bump</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonSecondary]}
                  onPress={() => handleUpdateStatus(item.id, 'cancelled', 'Kitchen cancelled')}
                >
                  <Text style={styles.actionButtonTextSecondary}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {isLoading ? 'Loading tickets...' : 'No tickets in queue'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

function getTypeColor(type: string) {
  switch (type) {
    case 'dine_in': return '#3B82F6';
    case 'takeaway': return '#F59E0B';
    case 'delivery': return '#8B5CF6';
    default: return '#6B7280';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    backgroundColor: '#1F2937',
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF' },
  headerIcon: { fontSize: 24 },
  stationBar: { padding: 12, backgroundColor: '#1F2937' },
  stationChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#374151',
    marginRight: 8,
  },
  stationChipActive: { backgroundColor: '#3B82F6' },
  stationChipText: { fontSize: 13, color: '#D1D5DB' },
  stationChipTextActive: { color: '#FFFFFF', fontWeight: '600' },
  filterBar: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#1F2937',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#374151',
  },
  filterChipActive: { backgroundColor: '#10B981' },
  filterChipText: { fontSize: 13, color: '#D1D5DB' },
  filterChipTextActive: { color: '#FFFFFF', fontWeight: '600' },
  ticketGrid: { padding: 8, gap: 8 },
  ticketCard: {
    flex: 1,
    margin: 4,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
    minHeight: 200,
  },
  ticketCardDelayed: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  ticketCardReady: {
    borderColor: '#10B981',
    borderWidth: 2,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ticketNumber: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
  ticketAge: { fontSize: 14, fontWeight: '600' },
  ticketTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ticketTypeText: { fontSize: 11, color: '#FFFFFF', fontWeight: '600', textTransform: 'uppercase' },
  ticketInfo: { marginBottom: 8 },
  ticketInfoText: { fontSize: 13, color: '#D1D5DB', marginBottom: 2 },
  ticketNotes: { fontSize: 12, color: '#F59E0B', fontStyle: 'italic', marginTop: 4 },
  itemsList: { marginVertical: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  itemStatus: { marginRight: 8, marginTop: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  itemText: { fontSize: 14, color: '#FFFFFF', flex: 1 },
  itemTextReady: { textDecorationLine: 'line-through', color: '#10B981' },
  itemTextServed: { textDecorationLine: 'line-through', color: '#6B7280' },
  itemModifiers: { fontSize: 11, color: '#9CA3AF', marginLeft: 16 },
  itemNotes: { fontSize: 11, color: '#F59E0B', marginLeft: 16, fontStyle: 'italic' },
  ticketActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  actionButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  actionButtonTextSecondary: { color: '#EF4444', fontSize: 13, fontWeight: '600' },
  emptyState: { padding: 60, alignItems: 'center' },
  emptyStateText: { fontSize: 16, color: '#6B7280' },
});
