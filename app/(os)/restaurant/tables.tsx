import { Alert, useState } from 'react';
// @ts-nocheck
// ============================================================================
// MTAA Restaurant Module — Table Management Screen
// ============================================================================

import React, { useEffect, useState } from 'react';
import { Alert, View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ScrollView, RefreshControl } from 'react-native';
import { Alert, useTables, useOrders } from '@/lib/restaurant/hooks';

export default function RestaurantTables() {
  const {
    tables, reservations, floorPlan, isLoading, error,
    loadTables, updateStatus, createReservation, loadReservations,
    loadFloorPlan, cancelReservation
  } = useTables();

  const { loadTableOrders } = useOrders();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [showReservation, setShowReservation] = useState(false);
  const [showTableDetail, setShowTableDetail] = useState(false);
  const [reservationData, setReservationData] = useState({
    customer_name: '',
    customer_phone: '',
    party_size: '',
    reservation_date: '',
    reservation_time: '',
    notes: '',
  });

  useEffect(() => {
    loadTables();
    loadReservations();
    loadFloorPlan();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadTables(), loadReservations()]);
    setRefreshing(false);
  };

  const handleTablePress = (table: any) => {
    setSelectedTable(table);
    if (table.status === 'occupied') {
      loadTableOrders(table.id);
    }
    setShowTableDetail(true);
  };

  const handleStatusChange = async (tableId: string, status: any) => {
    try {
      await updateStatus(tableId, status);
      setShowTableDetail(false);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleCreateReservation = async () => {
    if (!selectedTable) return;
    try {
      await createReservation({
        table_id: selectedTable.id,
        customer_name: reservationData.customer_name,
        customer_phone: reservationData.customer_phone,
        party_size: parseInt(reservationData.party_size) || 2,
        reservation_date: reservationData.reservation_date,
        reservation_time: reservationData.reservation_time,
        notes: reservationData.notes,
        status: 'confirmed',
      });
      setShowReservation(false);
      setReservationData({ customer_name: '', customer_phone: '', party_size: '', reservation_date: '', reservation_time: '', notes: '' });
      loadReservations();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return '#10B981';
      case 'occupied': return '#EF4444';
      case 'reserved': return '#F59E0B';
      case 'cleaning': return '#3B82F6';
      case 'out_of_order': return '#6B7280';
      default: return '#9CA3AF';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return '✅';
      case 'occupied': return '🔴';
      case 'reserved': return '📅';
      case 'cleaning': return '🧹';
      case 'out_of_order': return '🔧';
      default: return '⚪';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Table Management</Text>
        <View style={styles.headerStats}>
          <Text style={styles.headerStat}>🪑 {tables.filter((t: any) => t.status === 'available').length} free</Text>
          <Text style={styles.headerStat}>🔴 {tables.filter((t: any) => t.status === 'occupied').length} busy</Text>
          <Text style={styles.headerStat}>📅 {reservations.filter((r: any) => r.status === 'confirmed').length} reserved</Text>
        </View>
      </View>

      {/* Floor Plan / Table Grid */}
      <FlatList
        data={tables}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={styles.tableGrid}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.tableCard, { borderColor: getStatusColor(item.status) }]}
            onPress={() => handleTablePress(item)}
          >
            <Text style={styles.tableNumber}>{item.table_number}</Text>
            <Text style={styles.tableIcon}>{getStatusIcon(item.status)}</Text>
            <Text style={[styles.tableStatus, { color: getStatusColor(item.status) }]}>
              {item.status.replace('_', ' ')}
            </Text>
            <Text style={styles.tableCapacity}>{item.capacity} seats</Text>
            {item.current_party_size > 0 && (
              <Text style={styles.tableParty}>{item.current_party_size} guests</Text>
            )}
          </TouchableOpacity>
        )}
      />

      {/* Table Detail Modal */}
      <Modal visible={showTableDetail} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedTable && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Table {selectedTable.table_number}</Text>
                  <TouchableOpacity onPress={() => setShowTableDetail(false)}>
                    <Text style={styles.modalClose}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.tableDetailInfo}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <Text style={[styles.detailValue, { color: getStatusColor(selectedTable.status) }]}>
                    {getStatusIcon(selectedTable.status)} {selectedTable.status.replace('_', ' ')}
                  </Text>

                  <Text style={styles.detailLabel}>Capacity</Text>
                  <Text style={styles.detailValue}>{selectedTable.capacity} people</Text>

                  <Text style={styles.detailLabel}>Section</Text>
                  <Text style={styles.detailValue}>{selectedTable.section || 'Main'}</Text>

                  {selectedTable.current_party_size > 0 && (
                    <>
                      <Text style={styles.detailLabel}>Current Party</Text>
                      <Text style={styles.detailValue}>{selectedTable.current_party_size} guests</Text>
                    </>
                  )}
                </View>

                {/* Status Actions */}
                <Text style={styles.sectionTitle}>Change Status</Text>
                <View style={styles.statusActions}>
                  {(['available', 'occupied', 'cleaning', 'out_of_order'] as const).map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[styles.statusButton, { borderColor: getStatusColor(status) }]}
                      onPress={() => handleStatusChange(selectedTable.id, status)}
                    >
                      <Text style={[styles.statusButtonText, { color: getStatusColor(status) }]}>
                        {getStatusIcon(status)} {status.replace('_', ' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Reservation Button */}
                <TouchableOpacity
                  style={styles.reservationButton}
                  onPress={() => { setShowTableDetail(false); setShowReservation(true); }}
                >
                  <Text style={styles.reservationButtonText}>📅 Make Reservation</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Reservation Modal */}
      <Modal visible={showReservation} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Reservation</Text>
              <TouchableOpacity onPress={() => setShowReservation(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.reservationTable}>Table {selectedTable?.table_number}</Text>

            <TextInput
              style={styles.input}
              placeholder="Customer Name *"
              value={reservationData.customer_name}
              onChangeText={(t) => setReservationData(p => ({ ...p, customer_name: t }))}
              placeholderTextColor="#9CA3AF"
            />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              value={reservationData.customer_phone}
              onChangeText={(t) => setReservationData(p => ({ ...p, customer_phone: t }))}
              keyboardType="phone-pad"
              placeholderTextColor="#9CA3AF"
            />
            <TextInput
              style={styles.input}
              placeholder="Party Size *"
              value={reservationData.party_size}
              onChangeText={(t) => setReservationData(p => ({ ...p, party_size: t }))}
              keyboardType="number-pad"
              placeholderTextColor="#9CA3AF"
            />
            <TextInput
              style={styles.input}
              placeholder="Date (YYYY-MM-DD) *"
              value={reservationData.reservation_date}
              onChangeText={(t) => setReservationData(p => ({ ...p, reservation_date: t }))}
              placeholderTextColor="#9CA3AF"
            />
            <TextInput
              style={styles.input}
              placeholder="Time (HH:MM) *"
              value={reservationData.reservation_time}
              onChangeText={(t) => setReservationData(p => ({ ...p, reservation_time: t }))}
              placeholderTextColor="#9CA3AF"
            />
            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="Notes"
              value={reservationData.notes}
              onChangeText={(t) => setReservationData(p => ({ ...p, notes: t }))}
              multiline
              placeholderTextColor="#9CA3AF"
            />

            <TouchableOpacity style={styles.submitButton} onPress={handleCreateReservation}>
              <Text style={styles.submitButtonText}>Confirm Reservation</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#1F2937',
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF' },
  headerStats: { flexDirection: 'row', gap: 16, marginTop: 8 },
  headerStat: { fontSize: 13, color: '#D1D5DB' },
  tableGrid: { padding: 8, gap: 8 },
  tableCard: {
    flex: 1,
    margin: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tableNumber: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
  tableIcon: { fontSize: 28, marginVertical: 4 },
  tableStatus: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', marginTop: 4 },
  tableCapacity: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  tableParty: { fontSize: 12, color: '#3B82F6', fontWeight: '600', marginTop: 2 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  modalClose: { fontSize: 24, color: '#6B7280', padding: 4 },
  tableDetailInfo: { marginBottom: 16 },
  detailLabel: { fontSize: 12, color: '#9CA3AF', textTransform: 'uppercase', marginTop: 12 },
  detailValue: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginTop: 2 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  statusActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    backgroundColor: '#F9FAFB',
  },
  statusButtonText: { fontSize: 13, fontWeight: '600' },
  reservationButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  reservationButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  reservationTable: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
    marginBottom: 10,
  },
  submitButton: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});
