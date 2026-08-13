// @ts-nocheck
// ============================================================================
// MTAA Restaurant Module — Staff & Attendance Screen
// ============================================================================

import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, Alert, RefreshControl, ScrollView
} from 'react-native';
import { useAttendance, useIsClockedIn } from '@/lib/restaurant/hooks';

export default function RestaurantStaff() {
  const {
    records, todayRecord, onDuty, isLoading, error,
    clockIn, clockOut, loadToday, loadRecords, loadOnDuty, clearError
  } = useAttendance();

  const [refreshing, setRefreshing] = useState(false);
  const [showClockIn, setShowClockIn] = useState(false);
  const [showClockOut, setShowClockOut] = useState(false);
  const [pin, setPin] = useState('');
  const [staffId, setStaffId] = useState('');
  const [activeTab, setActiveTab] = useState<'on_duty' | 'today' | 'history'>('on_duty');

  useEffect(() => {
    loadOnDuty();
    loadRecords({ limit: 50 });
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadOnDuty(), loadRecords({ limit: 50 })]);
    setRefreshing(false);
  };

  const handleClockIn = async () => {
    try {
      await clockIn({ staff_id: staffId, pin });
      setShowClockIn(false);
      setPin('');
      setStaffId('');
      loadOnDuty();
      Alert.alert('Success', 'Clocked in successfully');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleClockOut = async () => {
    try {
      await clockOut({ staff_id: staffId, pin });
      setShowClockOut(false);
      setPin('');
      setStaffId('');
      loadOnDuty();
      Alert.alert('Success', 'Clocked out successfully');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return '#10B981';
      case 'late': return '#F59E0B';
      case 'absent': return '#EF4444';
      case 'on_leave': return '#6B7280';
      default: return '#9CA3AF';
    }
  };

  const formatDuration = (clockIn: string, clockOut?: string) => {
    const start = new Date(clockIn).getTime();
    const end = clockOut ? new Date(clockOut).getTime() : Date.now();
    const hours = Math.floor((end - start) / 3600000);
    const mins = Math.floor(((end - start) % 3600000) / 60000);
    return `${hours}h ${mins}m`;
  };

  const displayData = activeTab === 'on_duty' ? onDuty :
    activeTab === 'today' ? records.filter((r: any) => {
      const today = new Date().toISOString().split('T')[0];
      return r.date === today;
    }) : records;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Staff & Attendance</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.clockButton} onPress={() => setShowClockIn(true)}>
            <Text style={styles.clockButtonText}>⏱️ Clock In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.clockButton, styles.clockOutButton]} onPress={() => setShowClockOut(true)}>
            <Text style={styles.clockButtonText}>🏁 Clock Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabBar}>
        {(['on_duty', 'today', 'history'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'on_duty' ? `On Duty (${onDuty.length})` :
               tab === 'today' ? 'Today' : 'History'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Records List */}
      <FlatList
        data={displayData}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.recordsList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <View style={styles.recordCard}>
            <View style={styles.recordHeader}>
              <View style={styles.recordAvatar}>
                <Text style={styles.recordAvatarText}>{(item.staff_name || '?').charAt(0)}</Text>
              </View>
              <View style={styles.recordInfo}>
                <Text style={styles.recordName}>{item.staff_name || 'Unknown'}</Text>
                <Text style={styles.recordRole}>{item.staff_role || 'Staff'}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                  {item.status}
                </Text>
              </View>
            </View>

            <View style={styles.recordDetails}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Clock In</Text>
                <Text style={styles.detailValue}>
                  {item.clock_in ? new Date(item.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                </Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Clock Out</Text>
                <Text style={styles.detailValue}>
                  {item.clock_out ? new Date(item.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                </Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Duration</Text>
                <Text style={styles.detailValue}>
                  {item.clock_in ? formatDuration(item.clock_in, item.clock_out) : '—'}
                </Text>
              </View>
            </View>

            {item.location_in && (
              <Text style={styles.locationText}>📍 {item.location_in}</Text>
            )}
            {item.notes && (
              <Text style={styles.notesText}>📝 {item.notes}</Text>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {isLoading ? 'Loading...' : 'No records found'}
            </Text>
          </View>
        }
      />

      {/* Clock In Modal */}
      <Modal visible={showClockIn} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Clock In</Text>
              <TouchableOpacity onPress={() => { setShowClockIn(false); setPin(''); setStaffId(''); }}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Staff ID *"
              value={staffId}
              onChangeText={setStaffId}
              placeholderTextColor="#9CA3AF"
            />
            <TextInput
              style={styles.input}
              placeholder="PIN *"
              value={pin}
              onChangeText={setPin}
              secureTextEntry
              keyboardType="number-pad"
              maxLength={6}
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity style={styles.submitButton} onPress={handleClockIn}>
              <Text style={styles.submitButtonText}>Confirm Clock In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Clock Out Modal */}
      <Modal visible={showClockOut} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Clock Out</Text>
              <TouchableOpacity onPress={() => { setShowClockOut(false); setPin(''); setStaffId(''); }}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Staff ID *"
              value={staffId}
              onChangeText={setStaffId}
              placeholderTextColor="#9CA3AF"
            />
            <TextInput
              style={styles.input}
              placeholder="PIN *"
              value={pin}
              onChangeText={setPin}
              secureTextEntry
              keyboardType="number-pad"
              maxLength={6}
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity style={[styles.submitButton, { backgroundColor: '#EF4444' }]} onPress={handleClockOut}>
              <Text style={styles.submitButtonText}>Confirm Clock Out</Text>
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
    paddingBottom: 12,
    backgroundColor: '#1F2937',
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF' },
  headerActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  clockButton: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  clockOutButton: { backgroundColor: '#EF4444' },
  clockButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabActive: { backgroundColor: '#1F2937' },
  tabText: { fontSize: 13, color: '#6B7280' },
  tabTextActive: { color: '#FFFFFF', fontWeight: '600' },
  recordsList: { padding: 12 },
  recordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  recordHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  recordAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordAvatarText: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
  recordInfo: { flex: 1, marginLeft: 12 },
  recordName: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  recordRole: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  recordDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  detailCol: { alignItems: 'center' },
  detailLabel: { fontSize: 11, color: '#9CA3AF', marginBottom: 4 },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  locationText: { fontSize: 12, color: '#6B7280', marginTop: 8 },
  notesText: { fontSize: 12, color: '#6B7280', marginTop: 4, fontStyle: 'italic' },
  emptyState: { padding: 40, alignItems: 'center' },
  emptyStateText: { fontSize: 15, color: '#9CA3AF' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  modalClose: { fontSize: 24, color: '#6B7280', padding: 4 },
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
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});
