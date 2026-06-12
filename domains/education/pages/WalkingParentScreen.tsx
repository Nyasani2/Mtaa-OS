// domains/education/pages/WalkingParentScreen.tsx
// Phase C5: Walking Squad Parent View
// Parent sees: their children's squads, duty schedule, handoff chain, live tracking

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useParentWalking, useDutyRoster, useWalkingHandoffs, useWalkingTracking } from '@/domains/education/hooks/useWalking';
import { useAuth } from '@/hooks/useAuth';

const TABS = ['My Children', 'My Duties', 'Handoff Scan', 'Live Track'];

export default function WalkingParentScreen() {
  const { user } = useAuth();
  const parentId = user?.parent_id;
  const [activeTab, setActiveTab] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => { setRefreshing(true); setTimeout(() => setRefreshing(false), 500); };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Walking Squad</Text>
        <Text style={styles.headerSubtitle}>My Children · Duty Roster · QR Handoff</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
        {TABS.map((tab, i) => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === i && styles.tabActive]} onPress={() => setActiveTab(i)}>
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} style={styles.content}>
        {activeTab === 0 && <MyChildrenTab parentId={parentId} />}
        {activeTab === 1 && <MyDutiesTab parentId={parentId} />}
        {activeTab === 2 && <HandoffScanTab parentId={parentId} />}
        {activeTab === 3 && <LiveTrackTab parentId={parentId} />}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── MY CHILDREN ───
function MyChildrenTab({ parentId }: { parentId?: string }) {
  const { data, loading, error } = useParentWalking(parentId || '');
  if (loading) return <LoadingState message="Loading children..." />;
  if (error) return <ErrorState message="Failed to load children" />;
  if (!data || data.myChildren?.length === 0) return <EmptyState message="No children in walking squads" />;

  return (
    <View style={styles.tabContent}>
      {data.myChildren?.map((child: any) => (
        <View key={child.id} style={styles.childCard}>
          <View style={styles.childHeader}>
            <View style={styles.childAvatar}><Text style={styles.childAvatarText}>{child.student?.first_name?.[0]}{child.student?.last_name?.[0]}</Text></View>
            <View style={styles.childInfo}>
              <Text style={styles.childName}>{child.student?.first_name} {child.student?.last_name}</Text>
              <Text style={styles.childGrade}>Grade {child.student?.grade_level}</Text>
            </View>
            <Badge text={child.is_active ? 'Active' : 'Inactive'} color={child.is_active ? '#10B981' : '#6B7280'} />
          </View>
          <Text style={styles.childDetail}>📍 Squad: {child.squad?.squad_name}</Text>
          <Text style={styles.childDetail}>🏠 Meeting: {child.squad?.meeting_point_name}</Text>
          <Text style={styles.childDetail}>⏰ Time: {child.squad?.meeting_time?.slice(0, 5)}</Text>
          <Text style={styles.childDetail}>📏 Distance: {child.distance_to_meeting_point_meters ? (child.distance_to_meeting_point_meters + 'm') : 'Unknown'}</Text>
          {child.special_needs && <Text style={styles.childSpecial}>⚠️ Special needs: {child.special_needs}</Text>}
          {!child.parent_consent_signed && (
            <TouchableOpacity style={styles.consentButton} onPress={() => Alert.alert('Consent', 'Parent consent form would open here')}>
              <Text style={styles.consentButtonText}>✍️ Sign Consent Form</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );
}

// ─── MY DUTIES ───
function MyDutiesTab({ parentId }: { parentId?: string }) {
  const { duties, loading, error, checkIn, checkOut, markHandedOver } = useDutyRoster(undefined, parentId);
  const [scanModal, setScanModal] = useState(false);
  const [selectedDuty, setSelectedDuty] = useState<any>(null);

  if (loading) return <LoadingState message="Loading duties..." />;
  if (error) return <ErrorState message="Failed to load duties" />;

  const handleCheckIn = async (duty: any) => {
    // In real app, get GPS from device
    const gps = { lat: -1.2921, lng: 36.8219 }; // Nairobi placeholder
    const result = await checkIn(duty.id, gps);
    if (result.data) Alert.alert('Checked In', `You are now on duty for ${duty.squad?.squad_name}`);
  };

  const handleCheckOut = async (duty: any) => {
    const gps = { lat: -1.2921, lng: 36.8219 };
    const result = await checkOut(duty.id, gps);
    if (result.data) Alert.alert('Checked Out', 'Duty completed');
  };

  return (
    <View style={styles.tabContent}>
      {duties.length === 0 ? <EmptyState message="No scheduled duties" /> : duties.map((duty: any) => (
        <View key={duty.id} style={styles.dutyCard}>
          <View style={styles.dutyHeader}>
            <Text style={styles.dutySquadName}>{duty.squad?.squad_name}</Text>
            <Badge text={duty.status} color={duty.status === 'on_duty' ? '#10B981' : duty.status === 'checked_in' ? '#3B82F6' : '#6B7280'} />
          </View>
          <Text style={styles.dutyDate}>📅 {duty.duty_date} · {duty.duty_type}</Text>
          <Text style={styles.dutyLocation}>📍 {duty.squad?.meeting_point_name}</Text>
          <Text style={styles.dutyTime}>⏰ {duty.squad?.meeting_time?.slice(0, 5)}</Text>
          <Text style={styles.dutyQR}>🔑 QR: {duty.duty_qr_code}</Text>

          {duty.status === 'confirmed' && (
            <TouchableOpacity style={styles.actionButton} onPress={() => handleCheckIn(duty)}>
              <Text style={styles.actionButtonText}>✅ Check In</Text>
            </TouchableOpacity>
          )}
          {duty.status === 'checked_in' && (
            <>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#10B981' }]} onPress={() => { setSelectedDuty(duty); setScanModal(true); }}>
                <Text style={styles.actionButtonText}>📷 Scan Handoff QR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#8B5CF6' }]} onPress={() => markHandedOver(duty.id)}>
                <Text style={styles.actionButtonText}>✋ Mark All Handed Over</Text>
              </TouchableOpacity>
            </>
          )}
          {duty.status === 'handed_over' && (
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#EF4444' }]} onPress={() => handleCheckOut(duty)}>
              <Text style={styles.actionButtonText}>🏁 Check Out</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      {/* QR Scan Modal */}
      <Modal visible={scanModal} transparent animationType="slide">
        <View style={styles.scanOverlay}>
          <View style={styles.scanContent}>
            <Text style={styles.scanTitle}>Scan Handoff QR</Text>
            <Text style={styles.scanSubtitle}>{selectedDuty?.squad?.squad_name}</Text>
            <View style={styles.scanFrame}>
              <Text style={styles.scanFrameText}>📷 Camera Viewfinder</Text>
              <Text style={styles.scanFrameSub}>Scan parent QR, child QR, or fingerprint</Text>
            </View>
            <View style={styles.scanActions}>
              <TouchableOpacity style={styles.scanButton} onPress={() => { Alert.alert('Scanned', 'QR scan simulated'); setScanModal(false); }}>
                <Text style={styles.scanButtonText}>Simulate Scan</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.scanCancel} onPress={() => setScanModal(false)}>
                <Text>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── HANDOFF SCAN ───
function HandoffScanTab({ parentId }: { parentId?: string }) {
  const { handoffs, loading, error, scanHandoff } = useWalkingHandoffs();
  const [scanMode, setScanMode] = useState<'from_qr' | 'to_qr' | 'child_qr' | null>(null);

  if (loading) return <LoadingState message="Loading handoffs..." />;
  if (error) return <ErrorState message="Failed to load handoffs" />;

  return (
    <View style={styles.tabContent}>
      <Text style={styles.scanIntro}>Select scan type for active handoff:</Text>
      <View style={styles.scanTypeRow}>
        <TouchableOpacity style={[styles.scanTypeButton, scanMode === 'from_qr' && styles.scanTypeActive]} onPress={() => setScanMode('from_qr')}>
          <Text style={styles.scanTypeText}>📤 From QR</Text>
          <Text style={styles.scanTypeSub}>Parent handing over</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.scanTypeButton, scanMode === 'to_qr' && styles.scanTypeActive]} onPress={() => setScanMode('to_qr')}>
          <Text style={styles.scanTypeText}>📥 To QR</Text>
          <Text style={styles.scanTypeSub}>Duty parent receiving</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.scanTypeButton, scanMode === 'child_qr' && styles.scanTypeActive]} onPress={() => setScanMode('child_qr')}>
          <Text style={styles.scanTypeText}>👶 Child QR</Text>
          <Text style={styles.scanTypeSub}>Verify child identity</Text>
        </TouchableOpacity>
      </View>

      <SectionTitle title="Active Handoffs" count={handoffs.filter((h: any) => h.status !== 'complete').length} />
      {handoffs.filter((h: any) => h.status !== 'complete').length === 0 ? <EmptyState message="No active handoffs" /> : handoffs.filter((h: any) => h.status !== 'complete').map((h: any) => (
        <View key={h.id} style={styles.handoffCard}>
          <Text style={styles.handoffType}>{h.handoff_type.replace(/_/g, ' ')}</Text>
          <View style={styles.handoffChecks}>
            <CheckItem label="From QR" checked={h.from_qr_scanned} />
            <CheckItem label="From FP" checked={h.from_fingerprint_verified} />
            <CheckItem label="To QR" checked={h.to_qr_scanned} />
            <CheckItem label="To FP" checked={h.to_fingerprint_verified} />
            <CheckItem label="Child QR" checked={h.child_qr_scanned} />
          </View>
          {scanMode && (
            <TouchableOpacity style={styles.scanActionButton} onPress={() => scanHandoff(h.id, scanMode)}>
              <Text style={styles.scanActionText}>📷 Scan {scanMode.replace('_', ' ').toUpperCase()}</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );
}

function CheckItem({ label, checked }: { label: string; checked: boolean }) {
  return (
    <View style={styles.checkItem}>
      <Text style={[styles.checkDot, checked && styles.checkDotActive]}>{checked ? '✓' : '○'}</Text>
      <Text style={[styles.checkLabel, checked && styles.checkLabelActive]}>{label}</Text>
    </View>
  );
}

// ─── LIVE TRACK ───
function LiveTrackTab({ parentId }: { parentId?: string }) {
  const { data } = useParentWalking(parentId || '');
  const [selectedDuty, setSelectedDuty] = useState<string>('');
  const { trackPoints, isTracking, startTracking, stopTracking } = useWalkingTracking(selectedDuty);

  const activeDuty = data?.todayHandoffs?.[0]?.duty_roster_id;

  return (
    <View style={styles.tabContent}>
      <View style={styles.trackHeader}>
        <Text style={styles.trackTitle}>Live GPS Tracking</Text>
        <TouchableOpacity style={[styles.trackToggle, isTracking && styles.trackToggleActive]} onPress={() => isTracking ? stopTracking() : startTracking()}>
          <Text style={styles.trackToggleText}>{isTracking ? '⏹ Stop Tracking' : '▶ Start Tracking'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapText}>🗺️ Live Map</Text>
        <Text style={styles.mapSub}>{trackPoints.length} GPS points recorded</Text>
        {trackPoints.length > 0 && (
          <Text style={styles.mapLatest}>📍 Latest: {trackPoints[trackPoints.length - 1]?.lat?.toFixed(4)}, {trackPoints[trackPoints.length - 1]?.lng?.toFixed(4)}</Text>
        )}
      </View>
      <SectionTitle title="Tracking History" count={trackPoints.length} />
      {trackPoints.length === 0 ? <EmptyState message="No tracking data yet" /> : trackPoints.slice(-10).map((pt: any, i: number) => (
        <View key={i} style={styles.trackPoint}>
          <Text style={styles.trackTime}>🕐 {new Date(pt.recorded_at).toLocaleTimeString()}</Text>
          <Text style={styles.trackCoords}>{pt.lat?.toFixed(5)}, {pt.lng?.toFixed(5)}</Text>
          <Badge text={pt.tracking_status} color={pt.tracking_status === 'walking' ? '#10B981' : pt.tracking_status === 'emergency' ? '#EF4444' : '#6B7280'} />
        </View>
      ))}
    </View>
  );
}

// ─── SHARED ───
function Badge({ text, color }: { text: string; color: string }) {
  return <View style={[styles.badge, { backgroundColor: color + '20' }]}><Text style={[styles.badgeText, { color }]}>{text}</Text></View>;
}
function SectionTitle({ title, count }: { title: string; count?: number }) {
  return <View style={styles.sectionTitleRow}><Text style={styles.sectionTitle}>{title}</Text>{count !== undefined && <Text style={styles.sectionCount}>{count}</Text>}</View>;
}
function LoadingState({ message }: { message: string }) { return <View style={styles.centerState}><ActivityIndicator size="large" color="#3B82F6" /><Text style={styles.centerText}>{message}</Text></View>; }
function ErrorState({ message }: { message: string }) { return <View style={styles.centerState}><Text style={styles.errorIcon}>⚠️</Text><Text style={styles.centerText}>{message}</Text></View>; }
function EmptyState({ message }: { message: string }) { return <View style={styles.centerState}><Text style={styles.emptyIcon}>📭</Text><Text style={styles.centerText}>{message}</Text></View>; }

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  headerSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  tabBar: { backgroundColor: '#fff', paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', maxHeight: 50 },
  tab: { paddingHorizontal: 14, paddingVertical: 12, marginRight: 4 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#3B82F6' },
  tabText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  tabTextActive: { color: '#3B82F6', fontWeight: '600' },
  content: { flex: 1 },
  tabContent: { padding: 16, paddingBottom: 40 },

  // Child card
  childCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2 },
  childHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  childAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center' },
  childAvatarText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  childInfo: { flex: 1, marginLeft: 12 },
  childName: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  childGrade: { fontSize: 13, color: '#6B7280' },
  childDetail: { fontSize: 13, color: '#374151', marginBottom: 4 },
  childSpecial: { fontSize: 13, color: '#EF4444', fontWeight: '500', marginTop: 6 },
  consentButton: { marginTop: 10, backgroundColor: '#FEF3C7', borderRadius: 8, padding: 10, alignItems: 'center' },
  consentButtonText: { color: '#D97706', fontWeight: '600' },

  // Duty card
  dutyCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2 },
  dutyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  dutySquadName: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  dutyDate: { fontSize: 14, color: '#374151', marginBottom: 4 },
  dutyLocation: { fontSize: 13, color: '#6B7280', marginBottom: 2 },
  dutyTime: { fontSize: 13, color: '#6B7280', marginBottom: 2 },
  dutyQR: { fontSize: 12, color: '#9CA3AF', fontFamily: 'monospace', marginBottom: 10 },
  actionButton: { backgroundColor: '#3B82F6', borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 8 },
  actionButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },

  // Scan modal
  scanOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  scanContent: { width: '90%', backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center' },
  scanTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  scanSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 20 },
  scanFrame: { width: 200, height: 200, borderWidth: 2, borderColor: '#3B82F6', borderRadius: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
  scanFrameText: { fontSize: 40 },
  scanFrameSub: { fontSize: 12, color: '#6B7280', marginTop: 8, textAlign: 'center' },
  scanActions: { marginTop: 20, width: '100%' },
  scanButton: { backgroundColor: '#3B82F6', borderRadius: 10, padding: 12, alignItems: 'center', marginBottom: 8 },
  scanButtonText: { color: '#fff', fontWeight: '600' },
  scanCancel: { alignItems: 'center', padding: 10 },

  // Handoff scan
  scanIntro: { fontSize: 14, color: '#374151', marginBottom: 12 },
  scanTypeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  scanTypeButton: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  scanTypeActive: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
  scanTypeText: { fontSize: 13, fontWeight: '600', color: '#111827' },
  scanTypeSub: { fontSize: 11, color: '#6B7280', marginTop: 4, textAlign: 'center' },
  handoffCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  handoffType: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 8, textTransform: 'capitalize' },
  handoffChecks: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 10 },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  checkDot: { fontSize: 16, color: '#D1D5DB' },
  checkDotActive: { color: '#10B981' },
  checkLabel: { fontSize: 12, color: '#9CA3AF' },
  checkLabelActive: { color: '#10B981', fontWeight: '500' },
  scanActionButton: { backgroundColor: '#111827', borderRadius: 10, padding: 12, alignItems: 'center' },
  scanActionText: { color: '#fff', fontWeight: '600' },

  // Live track
  trackHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  trackTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  trackToggle: { backgroundColor: '#3B82F6', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  trackToggleActive: { backgroundColor: '#EF4444' },
  trackToggleText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  mapPlaceholder: { height: 200, backgroundColor: '#1F2937', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  mapText: { fontSize: 20, color: '#fff' },
  mapSub: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
  mapLatest: { fontSize: 12, color: '#10B981', marginTop: 4, fontFamily: 'monospace' },
  trackPoint: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 6 },
  trackTime: { fontSize: 12, color: '#6B7280' },
  trackCoords: { fontSize: 12, color: '#374151', fontFamily: 'monospace' },

  // Common
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  sectionCount: { fontSize: 13, color: '#6B7280', marginLeft: 8, backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  centerState: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  centerText: { fontSize: 14, color: '#6B7280', marginTop: 12, textAlign: 'center' },
  errorIcon: { fontSize: 40 },
  emptyIcon: { fontSize: 40 },
});
