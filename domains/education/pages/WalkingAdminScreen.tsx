// domains/education/pages/WalkingAdminScreen.tsx
// Phase C5: Walking Squad Admin — School view

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWalkingSquads, useDutyRoster, useSquadChildren, useWalkingDashboard } from '@/domains/education/hooks/useWalking';
import { useAuth } from '@/hooks/useAuth';

const TABS = ['Dashboard', 'Squads', 'Roster', 'Handoffs', 'Live Track'];

export default function WalkingAdminScreen() {
  const { user } = useAuth();
  const schoolId = user?.school_id;
  const [activeTab, setActiveTab] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => { setRefreshing(true); setTimeout(() => setRefreshing(false), 500); };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Walking Squad</Text>
        <Text style={styles.headerSubtitle}>Parent Duty Roster · QR Handoff · Live Tracking</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
        {TABS.map((tab, i) => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === i && styles.tabActive]} onPress={() => setActiveTab(i)}>
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} style={styles.content}>
        {activeTab === 0 && <DashboardTab schoolId={schoolId} />}
        {activeTab === 1 && <SquadsTab schoolId={schoolId} />}
        {activeTab === 2 && <RosterTab schoolId={schoolId} />}
        {activeTab === 3 && <HandoffsTab />}
        {activeTab === 4 && <LiveTrackTab />}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── DASHBOARD ───
function DashboardTab({ schoolId }: { schoolId?: string }) {
  const { dashboard, loading, error } = useWalkingDashboard(schoolId || '');
  if (loading) return <LoadingState message="Loading dashboard..." />;
  if (error) return <ErrorState message="Failed to load dashboard" />;
  if (!dashboard) return <EmptyState message="No walking squad data" />;

  return (
    <View style={styles.tabContent}>
      <View style={styles.statsRow}>
        <StatCard title="Squads" value={String(dashboard.totalSquads)} color="#3B82F6" />
        <StatCard title="Children" value={String(dashboard.totalChildren)} color="#10B981" />
        <StatCard title="On Duty" value={String(dashboard.activeDuties)} color="#F59E0B" />
        <StatCard title="Anomalies" value={String(dashboard.openAnomalies)} color="#EF4444" />
      </View>
      <SectionTitle title="Active Duty Parents" count={dashboard.todayDuties?.length} />
      {dashboard.todayDuties?.length === 0 ? <EmptyState message="No active duties today" /> : dashboard.todayDuties.map((d: any) => (
        <View key={d.id} style={styles.dutyCard}>
          <Text style={styles.dutyName}>{d.parent?.first_name} {d.parent?.last_name}</Text>
          <Text style={styles.dutySquad}>{d.squad?.squad_name} · {d.squad?.meeting_point_name}</Text>
          <Badge text={d.status} color={d.status === 'on_duty' ? '#10B981' : d.status === 'checked_in' ? '#3B82F6' : '#6B7280'} />
        </View>
      ))}
      {dashboard.openAnomalies > 0 && (
        <View style={styles.anomalyBanner}>
          <Text style={styles.anomalyText}>⚠️ {dashboard.openAnomalies} handoff anomaly(s) require attention</Text>
        </View>
      )}
    </View>
  );
}

// ─── SQUADS ───
function SquadsTab({ schoolId }: { schoolId?: string }) {
  const { squads, loading, error, createSquad, refetch } = useWalkingSquads(schoolId);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ squad_name: '', meeting_point_name: '', meeting_time: '07:30', max_children: '8', route_type: 'walk_to_school' as const, psv_stage_name: '' });

  if (loading) return <LoadingState message="Loading squads..." />;
  if (error) return <ErrorState message="Failed to load squads" />;

  const handleCreate = async () => {
    const result = await createSquad({
      school_id: schoolId,
      squad_name: form.squad_name,
      squad_code: `WS-${Date.now()}`,
      meeting_point_name: form.meeting_point_name,
      meeting_time: form.meeting_time + ':00',
      max_children: parseInt(form.max_children) || 8,
      route_type: form.route_type,
      psv_stage_name: form.psv_stage_name || null,
      is_psv_handoff: form.route_type === 'walk_to_stage'
    });
    if (result.data) { Alert.alert('Success', 'Squad created'); setShowModal(false); setForm({ squad_name: '', meeting_point_name: '', meeting_time: '07:30', max_children: '8', route_type: 'walk_to_school', psv_stage_name: '' }); }
    else Alert.alert('Error', 'Failed to create squad');
  };

  return (
    <View style={styles.tabContent}>
      <TouchableOpacity style={styles.createButton} onPress={() => setShowModal(true)}>
        <Text style={styles.createButtonText}>+ Create Squad</Text>
      </TouchableOpacity>
      {squads.length === 0 ? <EmptyState message="No walking squads yet" /> : squads.map((squad: any) => (
        <View key={squad.id} style={styles.squadCard}>
          <View style={styles.squadHeader}>
            <Text style={styles.squadName}>{squad.squad_name}</Text>
            <Badge text={squad.route_type.replace('_', ' ')} color={squad.route_type === 'walk_to_school' ? '#10B981' : '#F59E0B'} />
          </View>
          <Text style={styles.squadDetail}>📍 {squad.meeting_point_name}</Text>
          <Text style={styles.squadDetail}>⏰ {squad.meeting_time?.slice(0, 5)}</Text>
          <Text style={styles.squadDetail}>👶 {squad.current_children}/{squad.max_children} children</Text>
          {squad.is_psv_handoff && <Text style={styles.squadDetail}>🚌 Stage: {squad.psv_stage_name}</Text>}
        </View>
      ))}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Walking Squad</Text>
            <FormField label="Squad Name" value={form.squad_name} onChangeText={(t: string) => setForm({ ...form, squad_name: t })} />
            <FormField label="Meeting Point (Street Corner)" value={form.meeting_point_name} onChangeText={(t: string) => setForm({ ...form, meeting_point_name: t })} />
            <FormField label="Meeting Time" value={form.meeting_time} onChangeText={(t: string) => setForm({ ...form, meeting_time: t })} />
            <FormField label="Max Children" value={form.max_children} onChangeText={(t: string) => setForm({ ...form, max_children: t })} keyboardType="numeric" />
            <Text style={styles.formLabel}>Route Type</Text>
            <View style={styles.typePicker}>
              {(['walk_to_school', 'walk_to_stage', 'mixed'] as const).map((type: any) => (
                <TouchableOpacity key={type} style={[styles.typeOption, form.route_type === type && styles.typeOptionActive]} onPress={() => setForm({ ...form, route_type: type })}>
                  <Text style={[styles.typeOptionText, form.route_type === type && styles.typeOptionTextActive]}>{type.replace('_', ' ')}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {form.route_type === 'walk_to_stage' && <FormField label="PSV Stage Name" value={form.psv_stage_name} onChangeText={(t: string) => setForm({ ...form, psv_stage_name: t })} />}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowModal(false)}><Text>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleCreate}><Text style={styles.modalConfirmText}>Create</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── ROSTER ───
function RosterTab({ schoolId }: { schoolId?: string }) {
  const [selectedSquad, setSelectedSquad] = useState<string>('');
  const { squads } = useWalkingSquads(schoolId);
  const { duties, loading, error, createDuty } = useDutyRoster(selectedSquad || undefined);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ parent_id: '', duty_date: '', duty_type: 'morning' as const });

  if (loading) return <LoadingState message="Loading roster..." />;
  if (error) return <ErrorState message="Failed to load roster" />;

  const handleCreate = async () => {
    const result = await createDuty({ squad_id: selectedSquad, parent_id: form.parent_id, duty_date: form.duty_date, duty_type: form.duty_type });
    if (result.data) { Alert.alert('Success', 'Duty scheduled'); setShowModal(false); }
    else Alert.alert('Error', 'Failed to schedule duty');
  };

  return (
    <View style={styles.tabContent}>
      <Text style={styles.formLabel}>Select Squad</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.squadPicker}>
        {squads.map((s: any) => (
          <TouchableOpacity key={s.id} style={[styles.squadChip, selectedSquad === s.id && styles.squadChipActive]} onPress={() => setSelectedSquad(s.id)}>
            <Text style={[styles.squadChipText, selectedSquad === s.id && styles.squadChipTextActive]}>{s.squad_name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {selectedSquad && (
        <TouchableOpacity style={styles.createButton} onPress={() => setShowModal(true)}>
          <Text style={styles.createButtonText}>+ Schedule Duty</Text>
        </TouchableOpacity>
      )}
      {duties.length === 0 ? <EmptyState message="No duties scheduled" /> : duties.map((d: any) => (
        <View key={d.id} style={styles.rosterCard}>
          <Text style={styles.rosterParent}>{d.parent?.first_name} {d.parent?.last_name}</Text>
          <Text style={styles.rosterDate}>📅 {d.duty_date} · {d.duty_type}</Text>
          <Text style={styles.rosterSquad}>{d.squad?.squad_name}</Text>
          <Badge text={d.status} color={d.status === 'completed' ? '#10B981' : d.status === 'checked_in' ? '#3B82F6' : '#6B7280'} />
        </View>
      ))}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Schedule Duty</Text>
            <FormField label="Parent ID" value={form.parent_id} onChangeText={(t: string) => setForm({ ...form, parent_id: t })} />
            <FormField label="Duty Date (YYYY-MM-DD)" value={form.duty_date} onChangeText={(t: string) => setForm({ ...form, duty_date: t })} />
            <Text style={styles.formLabel}>Duty Type</Text>
            <View style={styles.typePicker}>
              {['morning', 'evening', 'both', 'backup'].map((type: any) => (
                <TouchableOpacity key={type} style={[styles.typeOption, form.duty_type === type && styles.typeOptionActive]} onPress={() => setForm({ ...form, duty_type: type as any })}>
                  <Text style={[styles.typeOptionText, form.duty_type === type && styles.typeOptionTextActive]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowModal(false)}><Text>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleCreate}><Text style={styles.modalConfirmText}>Schedule</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── HANDOFFS ───
function HandoffsTab() {
  return (
    <View style={styles.tabContent}>
      <EmptyState message="Handoff history view — connect to handoff data" />
    </View>
  );
}

// ─── LIVE TRACK ───
function LiveTrackTab() {
  return (
    <View style={styles.tabContent}>
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapText}>🗺️ Live Map</Text>
        <Text style={styles.mapSub}>Duty parent GPS breadcrumbs</Text>
      </View>
      <EmptyState message="Select a duty parent to track live" />
    </View>
  );
}

// ─── SHARED ───
function StatCard({ title, value, color }: any) {
  return <View style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 4 }]}><Text style={styles.statTitle}>{title}</Text><Text style={styles.statValue}>{value}</Text></View>;
}
function Badge({ text, color }: { text: string; color: string }) {
  return <View style={[styles.badge, { backgroundColor: color + '20' }]}><Text style={[styles.badgeText, { color }]}>{text}</Text></View>;
}
function SectionTitle({ title, count }: { title: string; count?: number }) {
  return <View style={styles.sectionTitleRow}><Text style={styles.sectionTitle}>{title}</Text>{count !== undefined && <Text style={styles.sectionCount}>{count}</Text>}</View>;
}
function FormField({ label, value, onChangeText, multiline, keyboardType }: any) {
  return <View style={styles.formField}><Text style={styles.formLabel}>{label}</Text><TextInput style={[styles.formInput, multiline && styles.formInputMultiline]} value={value} onChangeText={onChangeText} multiline={multiline} keyboardType={keyboardType} /></View>;
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
  tab: { paddingHorizontal: 16, paddingVertical: 12, marginRight: 4 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#3B82F6' },
  tabText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  tabTextActive: { color: '#3B82F6', fontWeight: '600' },
  content: { flex: 1 },
  tabContent: { padding: 16, paddingBottom: 40 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, elevation: 2 },
  statTitle: { fontSize: 12, color: '#6B7280' },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginTop: 4 },
  dutyCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  dutyName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  dutySquad: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  anomalyBanner: { backgroundColor: '#FEE2E2', borderRadius: 12, padding: 14, marginTop: 16 },
  anomalyText: { color: '#EF4444', fontWeight: '600' },
  createButton: { backgroundColor: '#3B82F6', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 16 },
  createButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  squadCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 1 },
  squadHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  squadName: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  squadDetail: { fontSize: 13, color: '#374151', marginBottom: 4 },
  squadPicker: { maxHeight: 44, marginBottom: 12 },
  squadChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', marginRight: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  squadChipActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  squadChipText: { fontSize: 13, color: '#6B7280' },
  squadChipTextActive: { color: '#fff', fontWeight: '500' },
  rosterCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  rosterParent: { fontSize: 15, fontWeight: '600', color: '#111827' },
  rosterDate: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  rosterSquad: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  mapPlaceholder: { height: 200, backgroundColor: '#1F2937', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  mapText: { fontSize: 20, color: '#fff' },
  mapSub: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, alignSelf: 'flex-start', marginTop: 6 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  sectionCount: { fontSize: 13, color: '#6B7280', marginLeft: 8, backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  formField: { marginBottom: 12 },
  formLabel: { fontSize: 13, color: '#374151', fontWeight: '500', marginBottom: 6 },
  formInput: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 10, fontSize: 14, color: '#111827', backgroundColor: '#F9FAFB' },
  formInputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  typePicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  typeOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  typeOptionActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  typeOptionText: { fontSize: 12, color: '#6B7280' },
  typeOptionTextActive: { color: '#fff', fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 20 },
  modalCancel: { paddingHorizontal: 16, paddingVertical: 10 },
  modalConfirm: { backgroundColor: '#3B82F6', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 },
  modalConfirmText: { color: '#fff', fontWeight: '600' },
  centerState: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  centerText: { fontSize: 14, color: '#6B7280', marginTop: 12, textAlign: 'center' },
  errorIcon: { fontSize: 40 },
  emptyIcon: { fontSize: 40 },
});
