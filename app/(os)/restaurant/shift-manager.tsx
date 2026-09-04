// @ts-nocheck
// ============================================================================
// MTAA Restaurant Module — Shift Manager Screen
// Handles: Float management, handover, shift reconciliation, staff clock-in/out
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, FlatList } from 'react-native';
import { Alert, useShifts, useStaff } from '@/lib/restaurant/hooks';

export default function ShiftManager() {
  const {
    currentShift, shifts, isLoading,
    startShift, endShift, loadCurrentShift, loadShifts,
    addFloat, removeFloat, recordSale, recordRefund
  } = useShifts();

  const { staff, loadStaff, clockIn, clockOut } = useStaff();

  const [activeTab, setActiveTab] = useState<'current' | 'history' | 'staff'>('current');
  const [showStartShift, setShowStartShift] = useState(false);
  const [showEndShift, setShowEndShift] = useState(false);
  const [showFloat, setShowFloat] = useState(false);
  const [floatAmount, setFloatAmount] = useState('');
  const [floatNotes, setFloatNotes] = useState('');
  const [floatType, setFloatType] = useState<'add' | 'remove'>('add');
  const [endShiftNotes, setEndShiftNotes] = useState('');
  const [endShiftCash, setEndShiftCash] = useState('');

  useEffect(() => {
    loadCurrentShift();
    loadShifts();
    loadStaff();
  }, []);

  const handleStartShift = async () => {
    try {
      await startShift();
      setShowStartShift(false);
      Alert.alert('Success', 'Shift started successfully');
      loadCurrentShift();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleEndShift = async () => {
    try {
      await endShift({
        closingCash: parseFloat(endShiftCash) || 0,
        notes: endShiftNotes
      });
      setShowEndShift(false);
      setEndShiftCash('');
      setEndShiftNotes('');
      Alert.alert('Success', 'Shift ended successfully');
      loadCurrentShift();
      loadShifts();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleFloat = async () => {
    try {
      const amount = parseFloat(floatAmount);
      if (isNaN(amount) || amount <= 0) {
        Alert.alert('Error', 'Please enter a valid amount');
        return;
      }
      if (floatType === 'add') {
        await addFloat(amount, floatNotes);
      } else {
        await removeFloat(amount, floatNotes);
      }
      setShowFloat(false);
      setFloatAmount('');
      setFloatNotes('');
      Alert.alert('Success', `Float ${floatType === 'add' ? 'added' : 'removed'}: KSh ${amount.toFixed(2)}`);
      loadCurrentShift();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleClockIn = async (staffId: string) => {
    try {
      await clockIn(staffId);
      Alert.alert('Success', 'Clocked in');
      loadStaff();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleClockOut = async (staffId: string) => {
    try {
      await clockOut(staffId);
      Alert.alert('Success', 'Clocked out');
      loadStaff();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shift Manager</Text>
        {currentShift && (
          <View style={styles.shiftBadge}>
            <View style={styles.shiftDot} />
            <Text style={styles.shiftBadgeText}>Active Shift</Text>
          </View>
        )}
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {(['current', 'history', 'staff'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'current' ? 'Current Shift' : tab === 'history' ? 'History' : 'Staff'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Current Shift Tab */}
      {activeTab === 'current' && (
        <ScrollView style={styles.content}>
          {!currentShift ? (
            <View style={styles.emptyShift}>
              <Text style={styles.emptyShiftIcon}>📋</Text>
              <Text style={styles.emptyShiftTitle}>No Active Shift</Text>
              <Text style={styles.emptyShiftText}>Start a new shift to begin operations</Text>
              <TouchableOpacity style={styles.startButton} onPress={() => setShowStartShift(true)}>
                <Text style={styles.startButtonText}>Start Shift</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Shift Summary Card */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Shift Summary</Text>
                  <Text style={styles.cardSubtitle}>{formatDate(currentShift.started_at)}</Text>
                </View>
                <View style={styles.statsRow}>
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>{formatTime(currentShift.started_at)}</Text>
                    <Text style={styles.statLabel}>Started</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>KSh {(currentShift.total_sales || 0).toFixed(2)}</Text>
                    <Text style={styles.statLabel}>Total Sales</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>{currentShift.order_count || 0}</Text>
                    <Text style={styles.statLabel}>Orders</Text>
                  </View>
                </View>
              </View>

              {/* Float Card */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Cash Float</Text>
                  <Text style={styles.floatAmount}>KSh {(currentShift.current_float || 0).toFixed(2)}</Text>
                </View>
                <View style={styles.floatActions}>
                  <TouchableOpacity
                    style={[styles.floatButton, styles.floatButtonAdd]}
                    onPress={() => { setFloatType('add'); setShowFloat(true); }}
                  >
                    <Text style={styles.floatButtonText}>➕ Add Float</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.floatButton, styles.floatButtonRemove]}
                    onPress={() => { setFloatType('remove'); setShowFloat(true); }}
                  >
                    <Text style={styles.floatButtonText}>➖ Remove Float</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Quick Actions */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Actions</Text>
                <TouchableOpacity style={styles.actionRow} onPress={() => setShowEndShift(true)}>
                  <Text style={styles.actionIcon}>🔒</Text>
                  <View style={styles.actionInfo}>
                    <Text style={styles.actionTitle}>End Shift</Text>
                    <Text style={styles.actionSubtitle}>Close shift and reconcile cash</Text>
                  </View>
                  <Text style={styles.actionArrow}>›</Text>
                </TouchableOpacity>
              </View>

              {/* Staff on Shift */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Staff on Shift</Text>
                {(staff || []).filter((s: any) => s.is_clocked_in).length === 0 ? (
                  <Text style={styles.emptyText}>No staff currently clocked in</Text>
                ) : (
                  (staff || []).filter((s: any) => s.is_clocked_in).map((s) => (
                    <View key={s.id} style={styles.staffRow}>
                      <Text style={styles.staffName}>{s.name}</Text>
                      <Text style={styles.staffRole}>{s.role}</Text>
                      <Text style={styles.staffTime}>{formatTime(s.clock_in_time)}</Text>
                    </View>
                  ))
                )}
              </View>
            </>
          )}
        </ScrollView>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <ScrollView style={styles.content}>
          {(shifts || []).length === 0 ? (
            <View style={styles.emptyShift}>
              <Text style={styles.emptyShiftIcon}>📚</Text>
              <Text style={styles.emptyShiftTitle}>No Shift History</Text>
              <Text style={styles.emptyShiftText}>Past shifts will appear here</Text>
            </View>
          ) : (
            (shifts || []).map((shift) => (
              <View key={shift.id} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyDate}>{formatDate(shift.started_at)}</Text>
                  <View style={[styles.statusBadge, shift.ended_at ? styles.statusClosed : styles.statusOpen]}>
                    <Text style={styles.statusText}>{shift.ended_at ? 'Closed' : 'Open'}</Text>
                  </View>
                </View>
                <View style={styles.historyStats}>
                  <View style={styles.historyStat}>
                    <Text style={styles.historyStatValue}>KSh {(shift.total_sales || 0).toFixed(2)}</Text>
                    <Text style={styles.historyStatLabel}>Sales</Text>
                  </View>
                  <View style={styles.historyStat}>
                    <Text style={styles.historyStatValue}>{shift.order_count || 0}</Text>
                    <Text style={styles.historyStatLabel}>Orders</Text>
                  </View>
                  <View style={styles.historyStat}>
                    <Text style={styles.historyStatValue}>KSh {(shift.closing_float || 0).toFixed(2)}</Text>
                    <Text style={styles.historyStatLabel}>Closing Float</Text>
                  </View>
                </View>
                {shift.notes && (
                  <Text style={styles.historyNotes}>📝 {shift.notes}</Text>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Staff Tab */}
      {activeTab === 'staff' && (
        <ScrollView style={styles.content}>
          {(staff || []).length === 0 ? (
            <View style={styles.emptyShift}>
              <Text style={styles.emptyShiftIcon}>👥</Text>
              <Text style={styles.emptyShiftTitle}>No Staff</Text>
              <Text style={styles.emptyShiftText}>Add staff members in the Staff section</Text>
            </View>
          ) : (
            (staff || []).map((s) => (
              <View key={s.id} style={styles.staffCard}>
                <View style={styles.staffHeader}>
                  <View>
                    <Text style={styles.staffCardName}>{s.name}</Text>
                    <Text style={styles.staffCardRole}>{s.role}</Text>
                  </View>
                  <View style={[styles.clockBadge, s.is_clocked_in ? styles.clockIn : styles.clockOut]}>
                    <Text style={styles.clockText}>{s.is_clocked_in ? 'Clocked In' : 'Clocked Out'}</Text>
                  </View>
                </View>
                <View style={styles.staffActions}>
                  {s.is_clocked_in ? (
                    <TouchableOpacity
                      style={[styles.staffActionButton, styles.staffActionOut]}
                      onPress={() => handleClockOut(s.id)}
                    >
                      <Text style={styles.staffActionText}>Clock Out</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.staffActionButton, styles.staffActionIn]}
                      onPress={() => handleClockIn(s.id)}
                    >
                      <Text style={styles.staffActionText}>Clock In</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Start Shift Modal */}
      <Modal visible={showStartShift} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Start New Shift</Text>
            <Text style={styles.modalText}>This will open a new shift and reset the cash float. Are you sure?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowStartShift(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleStartShift}>
                <Text style={styles.modalConfirmText}>Start Shift</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* End Shift Modal */}
      <Modal visible={showEndShift} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>End Shift</Text>
            <Text style={styles.modalLabel}>Closing Cash Amount (KSh)</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={endShiftCash}
              onChangeText={setEndShiftCash}
              placeholder="0.00"
              placeholderTextColor="#9CA3AF"
            />
            <Text style={styles.modalLabel}>Notes</Text>
            <TextInput
              style={[styles.modalInput, { minHeight: 80 }]}
              multiline
              value={endShiftNotes}
              onChangeText={setEndShiftNotes}
              placeholder="Any discrepancies or notes..."
              placeholderTextColor="#9CA3AF"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowEndShift(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleEndShift}>
                <Text style={styles.modalConfirmText}>End Shift</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Float Modal */}
      <Modal visible={showFloat} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {floatType === 'add' ? 'Add Float' : 'Remove Float'}
            </Text>
            <Text style={styles.modalLabel}>Amount (KSh)</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={floatAmount}
              onChangeText={setFloatAmount}
              placeholder="0.00"
              placeholderTextColor="#9CA3AF"
            />
            <Text style={styles.modalLabel}>Notes</Text>
            <TextInput
              style={[styles.modalInput, { minHeight: 60 }]}
              multiline
              value={floatNotes}
              onChangeText={setFloatNotes}
              placeholder="Reason for float adjustment..."
              placeholderTextColor="#9CA3AF"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowFloat(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirm, floatType === 'remove' && styles.modalConfirmDanger]}
                onPress={handleFloat}
              >
                <Text style={styles.modalConfirmText}>
                  {floatType === 'add' ? 'Add Float' : 'Remove Float'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    backgroundColor: '#1F2937',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
  shiftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  shiftDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  shiftBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: { backgroundColor: '#3B82F6' },
  tabText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  tabTextActive: { color: '#FFFFFF', fontWeight: '600' },
  content: { flex: 1, padding: 12 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  cardSubtitle: { fontSize: 13, color: '#6B7280' },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
  },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#3B82F6' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  floatAmount: { fontSize: 18, fontWeight: 'bold', color: '#10B981' },
  floatActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  floatButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  floatButtonAdd: { backgroundColor: '#10B981' },
  floatButtonRemove: { backgroundColor: '#EF4444' },
  floatButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionIcon: { fontSize: 24, marginRight: 12 },
  actionInfo: { flex: 1 },
  actionTitle: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  actionSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  actionArrow: { fontSize: 20, color: '#9CA3AF' },
  staffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  staffName: { fontSize: 14, fontWeight: '600', color: '#1F2937', flex: 1 },
  staffRole: { fontSize: 13, color: '#6B7280', marginRight: 12 },
  staffTime: { fontSize: 13, color: '#3B82F6' },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', paddingVertical: 16 },
  emptyShift: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyShiftIcon: { fontSize: 48, marginBottom: 16 },
  emptyShiftTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 },
  emptyShiftText: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24 },
  startButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 10,
  },
  startButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyDate: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusOpen: { backgroundColor: '#10B981' },
  statusClosed: { backgroundColor: '#6B7280' },
  statusText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  historyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  historyStat: { alignItems: 'center' },
  historyStatValue: { fontSize: 16, fontWeight: 'bold', color: '#3B82F6' },
  historyStatLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  historyNotes: { fontSize: 13, color: '#6B7280', marginTop: 12, fontStyle: 'italic' },
  staffCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  staffHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  staffCardName: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  staffCardRole: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  clockBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  clockIn: { backgroundColor: '#10B981' },
  clockOut: { backgroundColor: '#EF4444' },
  clockText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  staffActions: {
    flexDirection: 'row',
    gap: 8,
  },
  staffActionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  staffActionIn: { backgroundColor: '#10B981' },
  staffActionOut: { backgroundColor: '#EF4444' },
  staffActionText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
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
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 },
  modalText: { fontSize: 14, color: '#6B7280', marginBottom: 20, lineHeight: 20 },
  modalLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginTop: 12, marginBottom: 8 },
  modalInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  modalCancelText: { fontSize: 16, color: '#6B7280', fontWeight: '600' },
  modalConfirm: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  modalConfirmDanger: { backgroundColor: '#EF4444' },
  modalConfirmText: { fontSize: 16, color: '#FFFFFF', fontWeight: '600' },
});
