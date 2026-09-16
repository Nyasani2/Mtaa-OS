// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Ionicons } from '@expo/vector-icons';

export default function HousekeepingOS() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, rooms, assignments, supplies
  const [rooms, setRooms] = useState([]);
  const [stats, setStats] = useState({ clean: 0, dirty: 0, cleaning: 0, inspection: 0, isolation: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [cleaningModal, setCleaningModal] = useState(false);
  const [cleaningChecklist, setCleaningChecklist] = useState({});
  const [filterDept, setFilterDept] = useState('all');
  
  // Performance metrics
  const [metrics, setMetrics] = useState({ avgTurnaround: 0, todayCleaned: 0, complianceRate: 0 });

  useEffect(() => { loadRooms(); }, [filterDept]);

  const loadRooms = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('health_beds')
        .select(`
          id,
          room_number,
          bed_number,
          status,
          department,
          room_type,
          cleaning_status,
          last_cleaned_at,
          cleaned_by,
          inspection_status,
          is_isolation
        `)
        .order('department', { ascending: true })
        .order('room_number', { ascending: true });

      const { data, error } = await query;
      if (error) throw error;

      // Calculate stats
      const cleanCount = data.filter(r => r.cleaning_status === 'clean').length;
      const dirtyCount = data.filter(r => r.cleaning_status === 'dirty').length;
      const cleaningCount = data.filter(r => r.cleaning_status === 'cleaning').length;
      const inspectionCount = data.filter(r => r.inspection_status === 'pending').length;
      const isolationCount = data.filter(r => r.is_isolation).length;

      setStats({
        clean: cleanCount,
        dirty: dirtyCount,
        cleaning: cleaningCount,
        inspection: inspectionCount,
        isolation: isolationCount
      });

      // Calculate metrics
      const today = new Date().toISOString().split('T')[0];
      const todayCleaned = data.filter(r => 
        r.last_cleaned_at && new Date(r.last_cleaned_at).toISOString().split('T')[0] === today
      ).length;

      setMetrics({
        avgTurnaround: 25, // Mock - calculate from actual timestamps
        todayCleaned,
        complianceRate: 94 // Mock - calculate from inspection pass rate
      });

      if (filterDept !== 'all') {
        setRooms(data.filter(r => r.department === filterDept));
      } else {
        setRooms(data);
      }
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateRoomStatus = async (roomId, newStatus, checklist = {}) => {
    try {
      const updateData = {
        cleaning_status: newStatus,
        last_cleaned_at: newStatus === 'clean' ? new Date().toISOString() : null,
        cleaned_by: newStatus === 'clean' ? user.id : null,
        inspection_status: newStatus === 'clean' ? 'pending' : null
      };

      const { error } = await supabase
        .from('health_beds')
        .update(updateData)
        .eq('id', roomId);

      if (error) throw error;

      // Log cleaning activity
      if (newStatus === 'clean') {
        await supabase.from('housekeeping_logs').insert({
          room_id: roomId,
          action: 'cleaning_completed',
          performed_by: user.id,
          checklist_data: checklist,
          created_at: new Date().toISOString()
        });
      }

      Alert.alert('Success', `Room status updated to ${newStatus.toUpperCase()}`);
      setCleaningModal(false);
      loadRooms();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const startCleaning = (room) => {
    setSelectedRoom(room);
    setCleaningChecklist({
      floors: false,
      surfaces: false,
      bathroom: false,
      linens: false,
      trash: false,
      restock: false,
      disinfect: false
    });
    setCleaningModal(true);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'clean': return '#10b981';
      case 'dirty': return '#ef4444';
      case 'cleaning': return '#3b82f6';
      case 'inspection': return '#f59e0b';
      default: return '#64748b';
    }
  };

  const getPriorityLevel = (room) => {
    if (room.is_isolation) return { label: 'ISOLATION', color: '#ef4444', priority: 1 };
    if (room.status === 'available' && room.cleaning_status === 'dirty') return { label: 'TURNDOWN', color: '#f59e0b', priority: 2 };
    if (room.status === 'occupied' && room.cleaning_status === 'dirty') return { label: 'OCCUPIED', color: '#3b82f6', priority: 3 };
    return { label: 'ROUTINE', color: '#10b981', priority: 4 };
  };

  const renderRoomCard = ({ item: room }) => {
    const priority = getPriorityLevel(room);
    const timeSinceCleaned = room.last_cleaned_at ? 
      Math.floor((Date.now() - new Date(room.last_cleaned_at).getTime()) / (1000 * 60 * 60)) : null;

    return (
      <TouchableOpacity 
        style={[styles.roomCard, room.is_isolation && styles.isolationCard]}
        onPress={() => room.cleaning_status !== 'cleaning' && startCleaning(room)}
      >
        <View style={styles.roomHeader}>
          <View>
            <Text style={styles.roomNumber}>{room.room_number}{room.bed_number ? `-${room.bed_number}` : ''}</Text>
            <Text style={styles.roomType}>{room.room_type || 'Standard'} • {room.department}</Text>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: priority.color + '20' }]}>
            <Text style={[styles.priorityText, { color: priority.color }]}>{priority.label}</Text>
          </View>
        </View>

        <View style={styles.roomDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="shield-checkmark" size={16} color={room.cleaning_status === 'clean' ? '#10b981' : '#ef4444'} />
            <Text style={[styles.statusText, { color: getStatusColor(room.cleaning_status) }]}>
              {room.cleaning_status?.toUpperCase() || 'UNKNOWN'}
            </Text>
          </View>
          
          {room.is_isolation && (
            <View style={styles.isolationBadge}>
              <Ionicons name="warning" size={14} color="#ef4444" />
              <Text style={styles.isolationText}>ISOLATION PRECAUTIONS</Text>
            </View>
          )}

          {timeSinceCleaned !== null && room.cleaning_status === 'clean' && (
            <Text style={styles.timeText}>
              Cleaned {timeSinceCleaned}h ago
            </Text>
          )}
        </View>

        {room.cleaning_status === 'dirty' && (
          <TouchableOpacity 
            style={styles.cleanBtn}
            onPress={() => startCleaning(room)}
          >
            <Ionicons name="sparkles" size={18} color="#fff" />
            <Text style={styles.cleanBtnText}>Start Cleaning</Text>
          </TouchableOpacity>
        )}

        {room.cleaning_status === 'cleaning' && (
          <View style={styles.inProgressBadge}>
            <ActivityIndicator size="small" color="#3b82f6" />
            <Text style={styles.inProgressText}>Cleaning in Progress...</Text>
          </View>
        )}

        {room.cleaning_status === 'clean' && room.inspection_status === 'pending' && (
          <View style={styles.inspectionBadge}>
            <Ionicons name="eye" size={16} color="#f59e0b" />
            <Text style={styles.inspectionText}>Awaiting Inspection</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderDashboard = () => (
    <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadRooms(); }} />}>
      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { borderColor: '#10b981' }]}>
          <Text style={[styles.statNumber, { color: '#10b981' }]}>{stats.clean}</Text>
          <Text style={styles.statLabel}>Clean & Ready</Text>
        </View>
        <View style={[styles.statCard, { borderColor: '#ef4444' }]}>
          <Text style={[styles.statNumber, { color: '#ef4444' }]}>{stats.dirty}</Text>
          <Text style={styles.statLabel}>Needs Cleaning</Text>
        </View>
        <View style={[styles.statCard, { borderColor: '#3b82f6' }]}>
          <Text style={[styles.statNumber, { color: '#3b82f6' }]}>{stats.cleaning}</Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
        <View style={[styles.statCard, { borderColor: '#f59e0b' }]}>
          <Text style={[styles.statNumber, { color: '#f59e0b' }]}>{stats.inspection}</Text>
          <Text style={styles.statLabel}>Inspection</Text>
        </View>
      </View>

      {/* Performance Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Metrics</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Ionicons name="timer" size={24} color="#3b82f6" />
            <Text style={styles.metricValue}>{metrics.avgTurnaround} min</Text>
            <Text style={styles.metricLabel}>Avg Turnaround</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="checkmark-done" size={24} color="#10b981" />
            <Text style={styles.metricValue}>{metrics.todayCleaned}</Text>
            <Text style={styles.metricLabel}>Cleaned Today</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="star" size={24} color="#f59e0b" />
            <Text style={styles.metricValue}>{metrics.complianceRate}%</Text>
            <Text style={styles.metricLabel}>Quality Score</Text>
          </View>
        </View>
      </View>

      {/* Priority Queue */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Priority Queue</Text>
        {rooms.filter(r => r.cleaning_status === 'dirty').slice(0, 5).map(room => {
          const priority = getPriorityLevel(room);
          return (
            <View key={room.id} style={styles.queueItem}>
              <View style={styles.queueInfo}>
                <Text style={styles.queueRoom}>{room.room_number}</Text>
                <Text style={styles.queueDept}>{room.department}</Text>
              </View>
              <View style={[styles.priorityDot, { backgroundColor: priority.color }]} />
            </View>
          );
        })}
      </View>

      {/* Quick Stats */}
      <View style={styles.section}>
        <View style={styles.quickStatRow}>
          <View style={styles.quickStat}>
            <Ionicons name="shield" size={20} color="#ef4444" />
            <Text style={styles.quickStatValue}>{stats.isolation}</Text>
            <Text style={styles.quickStatLabel}>Isolation Rooms</Text>
          </View>
          <View style={styles.quickStat}>
            <Ionicons name="time" size={20} color="#f59e0b" />
            <Text style={styles.quickStatValue}>{stats.dirty > 0 ? '15m' : '0m'}</Text>
            <Text style={styles.quickStatLabel}>Oldest Dirty</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Housekeeping OS</Text>
          <Text style={styles.headerSubtitle}>Environmental Services Management</Text>
        </View>
        <View style={styles.userBadge}>
          <Ionicons name="sparkles" size={20} color="#10b981" />
          <Text style={styles.userName}>EVS Staff</Text>
        </View>
      </View>

      {/* Navigation */}
      <View style={styles.navTabs}>
        {[
          { id: 'dashboard', label: 'Dashboard', icon: 'stats-chart' },
          { id: 'rooms', label: 'All Rooms', icon: 'grid' },
          { id: 'assignments', label: 'My Tasks', icon: 'list' },
          { id: 'supplies', label: 'Supplies', icon: 'cube' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.navTab, activeTab === tab.id && styles.activeNavTab]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons name={tab.icon} size={18} color={activeTab === tab.id ? '#fff' : '#94a3b8'} />
            <Text style={[styles.navText, activeTab === tab.id && styles.activeNavText]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Department Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.deptFilter}>
        {['all', 'ICU', 'Maternity', 'Pediatrics', 'General Ward', 'Surgery'].map(dept => (
          <TouchableOpacity
            key={dept}
            style={[styles.deptPill, filterDept === dept && styles.activeDeptPill]}
            onPress={() => setFilterDept(dept)}
          >
            <Text style={[styles.deptText, filterDept === dept && styles.activeDeptText]}>
              {dept === 'all' ? 'All Departments' : dept}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>
      ) : (
        <>
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'rooms' && (
            <FlatList
              data={rooms}
              keyExtractor={(item) => item.id}
              renderItem={renderRoomCard}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>No rooms found</Text></View>}
            />
          )}
          {activeTab !== 'dashboard' && activeTab !== 'rooms' && (
            <View style={styles.center}>
              <Ionicons name="construct" size={48} color="#475569" />
              <Text style={styles.emptyText}>Module under development</Text>
            </View>
          )}
        </>
      )}

      {/* Cleaning Checklist Modal */}
      <Modal visible={cleaningModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Cleaning Checklist</Text>
              <Text style={styles.modalRoom}>
                {selectedRoom?.room_number} • {selectedRoom?.department}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setCleaningModal(false)}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedRoom?.is_isolation && (
              <View style={styles.isolationWarning}>
                <Ionicons name="warning" size={24} color="#ef4444" />
                <Text style={styles.isolationWarningText}>ISOLATION PRECAUTIONS REQUIRED</Text>
                <Text style={styles.isolationWarningSub}>Use PPE: Gown, Gloves, Mask, Face Shield</Text>
              </View>
            )}

            <Text style={styles.checklistTitle}>Standard Cleaning Protocol</Text>
            
            {[
              { key: 'disinfect', label: 'Disinfect high-touch surfaces', icon: 'spray' },
              { key: 'floors', label: 'Mop/vacuum floors', icon: 'water' },
              { key: 'surfaces', label: 'Clean all horizontal surfaces', icon: 'square' },
              { key: 'bathroom', label: 'Sanitize bathroom fixtures', icon: 'water' },
              { key: 'linens', label: 'Change bed linens', icon: 'bed' },
              { key: 'trash', label: 'Empty trash bins', icon: 'trash' },
              { key: 'restock', label: 'Restock supplies', icon: 'cube' },
            ].map(item => (
              <TouchableOpacity
                key={item.key}
                style={[styles.checklistItem, cleaningChecklist[item.key] && styles.checklistItemComplete]}
                onPress={() => setCleaningChecklist({
                  ...cleaningChecklist,
                  [item.key]: !cleaningChecklist[item.key]
                })}
              >
                <Ionicons 
                  name={cleaningChecklist[item.key] ? 'checkbox' : 'square-outline'} 
                  size={24} 
                  color={cleaningChecklist[item.key] ? '#10b981' : '#64748b'} 
                />
                <Text style={[styles.checklistText, cleaningChecklist[item.key] && styles.checklistTextComplete]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelBtn}
                onPress={() => setCleaningModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.completeBtn, Object.values(cleaningChecklist).every(v => v) ? styles.completeBtnActive : styles.completeBtnDisabled]}
                onPress={() => updateRoomStatus(selectedRoom.id, 'clean', cleaningChecklist)}
                disabled={!Object.values(cleaningChecklist).every(v => v)}
              >
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.completeBtnText}>Mark Clean</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  headerSubtitle: { color: '#94a3b8', fontSize: 13, marginTop: 4 },
  userBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#10b981' },
  userName: { color: '#10b981', fontSize: 12, fontWeight: '600' },
  navTabs: { flexDirection: 'row', backgroundColor: '#0f172a', borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  navTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, gap: 6 },
  activeNavTab: { borderBottomWidth: 2, borderBottomColor: '#10b981', backgroundColor: '#1e293b' },
  navText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  activeNavText: { color: '#fff' },
  deptFilter: { backgroundColor: '#0f172a', paddingVertical: 12, paddingHorizontal: 16 },
  deptPill: { backgroundColor: '#1e293b', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  activeDeptPill: { backgroundColor: '#10b981' },
  deptText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  activeDeptText: { color: '#fff' },
  content: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#64748b', fontSize: 16 },
  
  // Stats
  statsGrid: { flexDirection: 'row', padding: 16, gap: 12 },
  statCard: { flex: 1, backgroundColor: '#1e293b', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  statNumber: { fontSize: 28, fontWeight: 'bold' },
  statLabel: { color: '#94a3b8', fontSize: 11, marginTop: 4 },
  
  // Section
  section: { backgroundColor: '#0f172a', marginHorizontal: 16, marginTop: 16, borderRadius: 12, padding: 16 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  
  // Metrics
  metricsGrid: { flexDirection: 'row', gap: 12 },
  metricCard: { flex: 1, backgroundColor: '#1e293b', borderRadius: 10, padding: 12, alignItems: 'center' },
  metricValue: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 4 },
  metricLabel: { color: '#94a3b8', fontSize: 11, marginTop: 2, textAlign: 'center' },
  
  // Queue
  queueItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b', padding: 12, borderRadius: 8, marginBottom: 8 },
  queueInfo: { flex: 1 },
  queueRoom: { color: '#fff', fontSize: 15, fontWeight: '600' },
  queueDept: { color: '#94a3b8', fontSize: 12 },
  priorityDot: { width: 12, height: 12, borderRadius: 6 },
  
  // Quick Stats
  quickStatRow: { flexDirection: 'row', gap: 12 },
  quickStat: { flex: 1, backgroundColor: '#1e293b', borderRadius: 10, padding: 12, alignItems: 'center', gap: 6 },
  quickStatValue: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  quickStatLabel: { color: '#94a3b8', fontSize: 11, textAlign: 'center' },
  
  // Room Cards
  listContent: { padding: 16, paddingBottom: 100 },
  roomCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  isolationCard: { borderColor: '#ef4444', borderWidth: 2 },
  roomHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  roomNumber: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  roomType: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  priorityText: { fontSize: 10, fontWeight: 'bold' },
  roomDetails: { marginBottom: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  statusText: { fontSize: 13, fontWeight: '600' },
  isolationBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', gap: 4 },
  isolationText: { color: '#ef4444', fontSize: 10, fontWeight: 'bold' },
  timeText: { color: '#64748b', fontSize: 11 },
  cleanBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#10b981', padding: 12, borderRadius: 8, gap: 8 },
  cleanBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  inProgressBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: 12, borderRadius: 8, gap: 8 },
  inProgressText: { color: '#3b82f6', fontSize: 13, fontWeight: '600' },
  inspectionBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: 10, borderRadius: 8, gap: 6, marginTop: 8 },
  inspectionText: { color: '#f59e0b', fontSize: 12, fontWeight: '600' },
  
  // Modal
  modalContainer: { flex: 1, backgroundColor: '#020617' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#0f172a', borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  modalRoom: { color: '#10b981', fontSize: 16, marginTop: 4 },
  modalContent: { padding: 20 },
  isolationWarning: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444', borderWidth: 2, borderStyle: 'dashed', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 20 },
  isolationWarningText: { color: '#ef4444', fontSize: 14, fontWeight: 'bold', marginTop: 8 },
  isolationWarningSub: { color: '#ef4444', fontSize: 12, marginTop: 4, textAlign: 'center' },
  checklistTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  checklistItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', padding: 14, borderRadius: 10, marginBottom: 8, gap: 12 },
  checklistItemComplete: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: '#10b981', borderWidth: 1 },
  checklistText: { color: '#fff', fontSize: 14, flex: 1 },
  checklistTextComplete: { color: '#10b981', textDecorationLine: 'line-through' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, backgroundColor: '#1e293b', padding: 16, borderRadius: 12, alignItems: 'center' },
  cancelBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  completeBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 12 },
  completeBtnActive: { backgroundColor: '#10b981' },
  completeBtnDisabled: { backgroundColor: '#334155' },
  completeBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
});
