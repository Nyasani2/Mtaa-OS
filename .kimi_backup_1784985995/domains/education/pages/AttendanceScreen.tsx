import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal,
  Alert, ActivityIndicator, RefreshControl, FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useAttendanceSessions, useSessionAttendance } from '@/domains/education/hooks/useAttendance';
import { useClassManager } from '@/domains/education/hooks/useClassManager';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';

const STATUS_COLORS: Record<string, string> = {
  present: '#22c55e', absent: '#ef4444', late: '#f59e0b', excused: '#3b82f6', early_departure: '#8b5cf6', medical: '#06b6d4',
};

const STATUS_LABELS: Record<string, string> = {
  present: 'Present', absent: 'Absent', late: 'Late', excused: 'Excused', early_departure: 'Early Out', medical: 'Medical',
};

export default function AttendanceScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [activeView, setActiveView] = useState<'list' | 'mark'>('list');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  const { sessions, loading: sessLoading, error: sessError, creating, fetch: fetchSessions, add, close, cancel } = useAttendanceSessions({
    institution_id: user?.institution_id,
    teacher_id: user?.id,
  });

  const { classes } = useClassManager(user?.institution_id);

  const { session, records, stats, loading: markLoading, error: markError, marking, bulkMark, updateStatus } = useSessionAttendance(selectedSessionId || undefined);

  const [createModal, setCreateModal] = useState(false);
  const [newSession, setNewSession] = useState({
    class_id: '', topic: '', session_type: 'manual', session_date: new Date().toISOString().split('T')[0],
  });

  const [bulkSelections, setBulkSelections] = useState<Record<string, string>>({});

  const handleCreateSession = async () => {
    if (!newSession.class_id) { Alert.alert('Error', 'Select a class'); return; }
    if (!user?.institution_id) { Alert.alert('Error', 'No institution linked'); return; }
    const { error } = await add({
      institution_id: user.institution_id,
      teacher_id: user.id,
      class_id: newSession.class_id,
      topic: newSession.topic.trim() || undefined,
      session_type: newSession.session_type,
      session_date: newSession.session_date,
    });
    if (!error) {
      setCreateModal(false);
      setNewSession({ class_id: '', topic: '', session_type: 'manual', session_date: new Date().toISOString().split('T')[0] });
    }
  };

  const handleBulkMark = async () => {
    if (!selectedSessionId) return;
    const entries = Object.entries(bulkSelections).filter(([_, status]) => status);
    if (entries.length === 0) { Alert.alert('Error', 'No students selected'); return; }
    const records = entries.map(([student_id, status]) => ({ student_id, status: status as any }));
    await bulkMark(records);
    setBulkSelections({});
  };

  // Loading
  if (sessLoading && sessions.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading attendance sessions...</Text>
      </View>
    );
  }

  // Error
  if (sessError && sessions.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.error }]}>{sessError}</Text>
        <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={fetchSessions}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ===== MARKING VIEW =====
  if (activeView === 'mark' && selectedSessionId && session) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
        {/* Header */}
        <View style={[styles.markHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setActiveView('list')} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.markTitle, { color: colors.text }]} numberOfLines={1}>{session.topic || 'Attendance'}</Text>
            <Text style={[styles.markSub, { color: colors.textSecondary }]}>{session.class?.name} · {session.session_date}</Text>
          </View>
          <View style={[styles.sessionStatus, { backgroundColor: session.status === 'active' ? '#22c55e20' : '#6b728020' }]}>
            <Text style={[styles.sessionStatusText, { color: session.status === 'active' ? '#22c55e' : '#6b7280' }]}>{session.status}</Text>
          </View>
        </View>

        {/* Stats */}
        {stats && (
          <View style={[styles.statsBar, { backgroundColor: colors.card }]}>
            <View style={styles.statPill}>
              <Text style={[styles.statPillValue, { color: '#22c55e' }]}>{stats.present}</Text>
              <Text style={[styles.statPillLabel, { color: colors.textSecondary }]}>Present</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={[styles.statPillValue, { color: '#ef4444' }]}>{stats.absent}</Text>
              <Text style={[styles.statPillLabel, { color: colors.textSecondary }]}>Absent</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={[styles.statPillValue, { color: '#f59e0b' }]}>{stats.late}</Text>
              <Text style={[styles.statPillLabel, { color: colors.textSecondary }]}>Late</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={[styles.statPillValue, { color: colors.primary }]}>{stats.attendance_rate}%</Text>
              <Text style={[styles.statPillLabel, { color: colors.textSecondary }]}>Rate</Text>
            </View>
          </View>
        )}

        {/* Student List for Marking */}
        {records.length === 0 ? (
          <View style={styles.center}>
            <Text style={{ color: colors.textSecondary }}>No students enrolled in this class.</Text>
          </View>
        ) : (
          <FlatList
            data={records}
            keyExtractor={item => item.id}
            refreshControl={<RefreshControl refreshing={markLoading} onRefresh={() => {}} />}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => {
              const currentStatus = bulkSelections[item.student_id] || item.status;
              return (
                <View style={[styles.studentRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.studentName, { color: colors.text }]}>{item.student?.full_name || 'Unknown'}</Text>
                    <Text style={[styles.studentId, { color: colors.textSecondary }]}>{item.student?.student_number || 'No ID'}</Text>
                    {item.check_in_time && (
                      <Text style={[styles.checkInText, { color: colors.textSecondary }]}>
                        Checked in: {new Date(item.check_in_time).toLocaleTimeString()}
                      </Text>
                    )}
                  </View>
                  <View style={styles.statusButtons}>
                    {(['present', 'absent', 'late', 'excused'] as const).map(status => (
                      <TouchableOpacity
                        key={status}
                        style={[styles.statusBtn, {
                          backgroundColor: currentStatus === status ? STATUS_COLORS[status] + '25' : colors.inputBg,
                          borderColor: currentStatus === status ? STATUS_COLORS[status] : colors.border,
                        }]}
                        onPress={() => {
                          setBulkSelections(prev => ({ ...prev, [item.student_id]: status }));
                          updateStatus(item.id, status);
                        }}
                      >
                        <Text style={[styles.statusBtnText, { color: currentStatus === status ? STATUS_COLORS[status] : colors.textSecondary }]}>
                          {STATUS_LABELS[status]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              );
            }}
          />
        )}

        {/* Footer Actions */}
        <View style={[styles.markFooter, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TouchableOpacity style={[styles.footerBtn, { borderColor: colors.border }]} onPress={() => setActiveView('list')}>
            <Text style={{ color: colors.text }}>Back</Text>
          </TouchableOpacity>
          {session.status === 'active' && (
            <TouchableOpacity style={[styles.footerBtn, { backgroundColor: '#ef4444' }]} onPress={() => { close(session.id); setActiveView('list'); }}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>Close Session</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // ===== LIST VIEW =====
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Attendance</Text>
        <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{sessions.length} sessions</Text>
      </View>

      {sessions.length === 0 ? (
        <View style={styles.center}>
          <FontAwesome5 name="clipboard-check" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Sessions Yet</Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Create an attendance session for your class.</Text>
          <TouchableOpacity style={[styles.createBtn, { backgroundColor: colors.primary }]} onPress={() => setCreateModal(true)}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.createBtnText}>New Session</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={sessLoading} onRefresh={fetchSessions} />}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.sessionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => { setSelectedSessionId(item.id); setActiveView('mark'); }}
            >
              <View style={styles.sessionHeader}>
                <View style={[styles.dateBadge, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.dateText, { color: colors.primary }]}>{new Date(item.session_date).getDate()}</Text>
                  <Text style={[styles.monthText, { color: colors.primary }]}>{new Date(item.session_date).toLocaleString('default', { month: 'short' })}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sessionTopic, { color: colors.text }]} numberOfLines={1}>{item.topic || 'Attendance Session'}</Text>
                  <Text style={[styles.sessionMeta, { color: colors.textSecondary }]}>{item.class?.name || 'No class'} · {item.session_type}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? '#22c55e20' : '#6b728020' }]}>
                  <Text style={[styles.statusBadgeText, { color: item.status === 'active' ? '#22c55e' : '#6b7280' }]}>{item.status}</Text>
                </View>
              </View>
              <View style={styles.sessionFooter}>
                <View style={styles.footerItem}>
                  <Ionicons name="time" size={14} color={colors.textSecondary} />
                  <Text style={[styles.footerText, { color: colors.textSecondary }]}>{item.start_time || '--:--'} - {item.end_time || '--:--'}</Text>
                </View>
                <View style={styles.footerItem}>
                  <Ionicons name="person" size={14} color={colors.textSecondary} />
                  <Text style={[styles.footerText, { color: colors.textSecondary }]}>{item.teacher?.full_name || 'No teacher'}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => setCreateModal(true)}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Create Modal */}
      <Modal visible={createModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>New Attendance Session</Text>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Class *</Text>
            <View style={styles.classSelector}>
              {classes.map(cls => (
                <TouchableOpacity
                  key={cls.id}
                  style={[styles.classChip, newSession.class_id === cls.id && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  onPress={() => setNewSession(p => ({ ...p, class_id: cls.id }))}
                >
                  <Text style={[styles.classChipText, { color: newSession.class_id === cls.id ? '#fff' : colors.text }]}>{cls.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text }]} placeholder="Topic (optional)" placeholderTextColor={colors.textSecondary} value={newSession.topic} onChangeText={t => setNewSession(p => ({ ...p, topic: t }))} />
            <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text }]} placeholder="Date (YYYY-MM-DD)" placeholderTextColor={colors.textSecondary} value={newSession.session_date} onChangeText={t => setNewSession(p => ({ ...p, session_date: t }))} />

            <View style={styles.row}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={() => setCreateModal(false)}>
                <Text style={{ color: colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleCreateSession} disabled={creating}>
                {creating ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Create</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, fontSize: 14 },
  errorText: { marginTop: 12, fontSize: 14, textAlign: 'center' },
  retryBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },
  emptyTitle: { marginTop: 16, fontSize: 18, fontWeight: '700' },
  emptySub: { marginTop: 4, fontSize: 14, textAlign: 'center', maxWidth: 280 },
  createBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 20, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, gap: 8 },
  createBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  headerSub: { fontSize: 13, marginTop: 2 },
  sessionCard: { borderRadius: 12, padding: 16, borderWidth: 1, marginBottom: 12 },
  sessionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dateBadge: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  dateText: { fontSize: 18, fontWeight: '800' },
  monthText: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  sessionTopic: { fontSize: 15, fontWeight: '700' },
  sessionMeta: { fontSize: 12, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusBadgeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  sessionFooter: { flexDirection: 'row', gap: 16, marginTop: 12 },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 12 },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modal: { width: '100%', maxWidth: 400, borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  classSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  classChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  classChipText: { fontSize: 13, fontWeight: '600' },
  input: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 12 },
  row: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  saveBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '600' },
  markHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { marginRight: 12 },
  markTitle: { fontSize: 18, fontWeight: '700' },
  markSub: { fontSize: 12, marginTop: 2 },
  sessionStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  sessionStatusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  statsBar: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1 },
  statPill: { flex: 1, alignItems: 'center' },
  statPillValue: { fontSize: 20, fontWeight: '800' },
  statPillLabel: { fontSize: 10, marginTop: 2 },
  studentRow: { borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 10 },
  studentName: { fontSize: 15, fontWeight: '700' },
  studentId: { fontSize: 12, marginTop: 2 },
  checkInText: { fontSize: 11, marginTop: 2 },
  statusButtons: { flexDirection: 'row', gap: 6, marginTop: 10 },
  statusBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  statusBtnText: { fontSize: 11, fontWeight: '600' },
  markFooter: { flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: 1 },
  footerBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
});
