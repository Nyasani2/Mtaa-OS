import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal,
  Alert, ActivityIndicator, RefreshControl, FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useAssignmentList } from '@/domains/education/hooks/useAssignmentEngine';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';

const TYPE_ICONS: Record<string, string> = {
  homework: 'book', quiz: 'help-circle', project: 'folder', essay: 'create',
  lab_report: 'flask', presentation: 'easel', reading: 'glasses', extra_credit: 'star',
};

const TYPE_COLORS: Record<string, string> = {
  homework: '#3b82f6', quiz: '#f59e0b', project: '#8b5cf6', essay: '#10b981',
  lab_report: '#06b6d4', presentation: '#ec4899', reading: '#6366f1', extra_credit: '#f97316',
};

export default function AssignmentListScreen() {
  const { user } = useAuth();
  const { assignments, loading, error, creating, updating, fetch, add, publish, close, remove } = useAssignmentList({
    teacher_id: user?.id,
    institution_id: user?.institution_id,
  });
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: '', description: '', instructions: '', assignment_type: 'homework',
    max_score: 100, passing_score: 50, due_date: '',
  });

  const filtered = filterStatus === 'all' ? assignments : assignments.filter(a => a.status === filterStatus);

  const handleCreate = async () => {
    if (!newAssignment.title.trim()) { Alert.alert('Error', 'Title is required'); return; }
    if (!user?.institution_id) { Alert.alert('Error', 'No institution linked'); return; }
    const { error } = await add({
      institution_id: user.institution_id,
      teacher_id: user.id,
      title: newAssignment.title.trim(),
      description: newAssignment.description.trim() || undefined,
      instructions: newAssignment.instructions.trim() || undefined,
      assignment_type: newAssignment.assignment_type,
      max_score: newAssignment.max_score,
      passing_score: newAssignment.passing_score,
      due_date: newAssignment.due_date || undefined,
    });
    if (!error) {
      setModalVisible(false);
      setNewAssignment({ title: '', description: '', instructions: '', assignment_type: 'homework', max_score: 100, passing_score: 50, due_date: '' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return '#22c55e';
      case 'draft': return '#6b7280';
      case 'closed': return '#ef4444';
      case 'archived': return '#9ca3af';
      default: return '#6b7280';
    }
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  // Loading state
  if (loading && assignments.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading assignments...</Text>
      </View>
    );
  }

  // Error state
  if (error && assignments.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={fetch}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state
  if (assignments.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <FontAwesome5 name="clipboard-list" size={48} color={colors.textSecondary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No Assignments Yet</Text>
        <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Create your first assignment for students.</Text>
        <TouchableOpacity style={[styles.createBtn, { backgroundColor: colors.primary }]} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.createBtnText}>Create Assignment</Text>
        </TouchableOpacity>

        {/* Create Modal */}
        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modal, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>New Assignment</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text }]} placeholder="Title *" placeholderTextColor={colors.textSecondary} value={newAssignment.title} onChangeText={t => setNewAssignment(p => ({ ...p, title: t }))} />
              <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text }]} placeholder="Description" multiline numberOfLines={3} placeholderTextColor={colors.textSecondary} value={newAssignment.description} onChangeText={t => setNewAssignment(p => ({ ...p, description: t }))} />
              <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text }]} placeholder="Instructions" multiline numberOfLines={3} placeholderTextColor={colors.textSecondary} value={newAssignment.instructions} onChangeText={t => setNewAssignment(p => ({ ...p, instructions: t }))} />
              <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text }]} placeholder="Due Date (ISO)" placeholderTextColor={colors.textSecondary} value={newAssignment.due_date} onChangeText={t => setNewAssignment(p => ({ ...p, due_date: t }))} />
              <View style={styles.row}>
                <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, flex: 1 }]} placeholder="Max Score" keyboardType="number-pad" placeholderTextColor={colors.textSecondary} value={String(newAssignment.max_score)} onChangeText={t => setNewAssignment(p => ({ ...p, max_score: parseInt(t) || 100 }))} />
                <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, flex: 1 }]} placeholder="Passing Score" keyboardType="number-pad" placeholderTextColor={colors.textSecondary} value={String(newAssignment.passing_score)} onChangeText={t => setNewAssignment(p => ({ ...p, passing_score: parseInt(t) || 50 }))} />
              </View>
              <View style={styles.row}>
                <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={() => setModalVisible(false)}>
                  <Text style={{ color: colors.text }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleCreate} disabled={creating}>
                  {creating ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Create</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Assignments</Text>
        <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{assignments.length} total</Text>
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {['all', 'draft', 'published', 'closed', 'archived'].map(status => (
          <TouchableOpacity key={status} style={[styles.filterChip, filterStatus === status && { backgroundColor: colors.primary }]} onPress={() => setFilterStatus(status)}>
            <Text style={[styles.filterText, filterStatus === status && { color: '#fff' }]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetch} />}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push(`/(education)/assignment-detail?id=${item.id}`)}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.typeIcon, { backgroundColor: (TYPE_COLORS[item.assignment_type] || '#6b7280') + '20' }]}>
                <Ionicons name={(TYPE_ICONS[item.assignment_type] || 'document') as any} size={18} color={TYPE_COLORS[item.assignment_type] || '#6b7280'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
                <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>{item.class?.name || 'No class'} · {item.subject?.name || 'No subject'}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <Text style={[styles.cardDesc, { color: colors.textSecondary }]} numberOfLines={2}>{item.description || 'No description'}</Text>
            </View>

            <View style={styles.cardFooter}>
              <View style={styles.footerItem}>
                <Ionicons name="trophy" size={14} color={colors.textSecondary} />
                <Text style={[styles.footerText, { color: colors.textSecondary }]}>{item.max_score} pts</Text>
              </View>
              <View style={styles.footerItem}>
                <Ionicons name="calendar" size={14} color={isOverdue(item.due_date) ? '#ef4444' : colors.textSecondary} />
                <Text style={[styles.footerText, { color: isOverdue(item.due_date) ? '#ef4444' : colors.textSecondary }]}>
                  {item.due_date ? new Date(item.due_date).toLocaleDateString() : 'No due date'}
                  {isOverdue(item.due_date) && ' (Overdue)'}
                </Text>
              </View>
              <View style={styles.footerItem}>
                <Ionicons name="people" size={14} color={colors.textSecondary} />
                <Text style={[styles.footerText, { color: colors.textSecondary }]}>{item.submission_count || 0} subs</Text>
              </View>
            </View>

            {/* Quick actions */}
            {item.status === 'draft' && (
              <View style={styles.actionsRow}>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#22c55e20' }]} onPress={() => publish(item.id)} disabled={updating}>
                  <Text style={[styles.actionText, { color: '#22c55e' }]}>Publish</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.error + '20' }]} onPress={() => remove(item.id)}>
                  <Text style={[styles.actionText, { color: colors.error }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}
            {item.status === 'published' && (
              <View style={styles.actionsRow}>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#ef444420' }]} onPress={() => close(item.id)} disabled={updating}>
                  <Text style={[styles.actionText, { color: '#ef4444' }]}>Close</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={{ color: colors.textSecondary }}>No assignments match this filter.</Text>
          </View>
        }
      />

      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Create Modal (same as empty state, shown from FAB) */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>New Assignment</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text }]} placeholder="Title *" placeholderTextColor={colors.textSecondary} value={newAssignment.title} onChangeText={t => setNewAssignment(p => ({ ...p, title: t }))} />
            <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text }]} placeholder="Description" multiline numberOfLines={3} placeholderTextColor={colors.textSecondary} value={newAssignment.description} onChangeText={t => setNewAssignment(p => ({ ...p, description: t }))} />
            <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text }]} placeholder="Instructions" multiline numberOfLines={3} placeholderTextColor={colors.textSecondary} value={newAssignment.instructions} onChangeText={t => setNewAssignment(p => ({ ...p, instructions: t }))} />
            <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text }]} placeholder="Due Date (ISO)" placeholderTextColor={colors.textSecondary} value={newAssignment.due_date} onChangeText={t => setNewAssignment(p => ({ ...p, due_date: t }))} />
            <View style={styles.row}>
              <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, flex: 1 }]} placeholder="Max Score" keyboardType="number-pad" placeholderTextColor={colors.textSecondary} value={String(newAssignment.max_score)} onChangeText={t => setNewAssignment(p => ({ ...p, max_score: parseInt(t) || 100 }))} />
              <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, flex: 1 }]} placeholder="Passing Score" keyboardType="number-pad" placeholderTextColor={colors.textSecondary} value={String(newAssignment.passing_score)} onChangeText={t => setNewAssignment(p => ({ ...p, passing_score: parseInt(t) || 50 }))} />
            </View>
            <View style={styles.row}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={() => setModalVisible(false)}>
                <Text style={{ color: colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleCreate} disabled={creating}>
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
  filterRow: { maxHeight: 48, marginVertical: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: '#e5e7eb', marginRight: 8 },
  filterText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  card: { borderRadius: 12, padding: 16, borderWidth: 1, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  typeIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardMeta: { fontSize: 12, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  cardBody: { marginTop: 10 },
  cardDesc: { fontSize: 13, lineHeight: 18 },
  cardFooter: { flexDirection: 'row', gap: 16, marginTop: 12 },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 12 },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  actionText: { fontSize: 13, fontWeight: '600' },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modal: { width: '100%', maxWidth: 400, borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  input: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 12 },
  row: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  saveBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '600' },
});
