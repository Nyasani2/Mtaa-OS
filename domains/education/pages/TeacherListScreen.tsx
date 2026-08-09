import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator, RefreshControl,
  ScrollView, Modal, TextInput, StyleSheet, FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTeachers } from '../hooks/useTeachers';
import { TeacherCard } from '../components/TeacherCard';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

function CreateModal({ visible, onClose, institutionId }: { visible: boolean; onClose: () => void; institutionId: string }) {
  const { colors } = useTheme();
  const { createTeacher } = useTeachers(institutionId);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subjects, setSubjects] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name || !email) return;
    setSaving(true);
    try {
      await createTeacher({
        institution_id: institutionId,
        full_name: name,
        email,
        phone: phone || null,
        subjects_taught: subjects.split(',').map(s => s.trim()).filter(Boolean),
        employment_status: 'active',
        verification_status: 'pending',
      });
      onClose();
      setName(''); setEmail(''); setPhone(''); setSubjects('');
    } catch (e) {
      // handled by hook
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Add Teacher</Text>
          <TextInput
            placeholder="Full Name"
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={setName}
            style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
          />
          <TextInput
            placeholder="Email"
            placeholderTextColor={colors.textSecondary}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
          />
          <TextInput
            placeholder="Phone"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
          />
          <TextInput
            placeholder="Subjects (comma separated)"
            placeholderTextColor={colors.textSecondary}
            value={subjects}
            onChangeText={setSubjects}
            style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
          />
          <TouchableOpacity onPress={save} disabled={saving} style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: saving ? 0.6 : 1 }]}>
            <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Add Teacher'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function TeacherListScreen({ institutionId }: { institutionId: string }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const { teachers, loading, error, refresh, loadMore, hasMore } = useTeachers(institutionId, { search: search || undefined });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const renderItem = useCallback(({ item }: { item: any }) => (
    <TeacherCard teacher={item} />
  ), []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Teachers</Text>
        <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
          {teachers.length} educators
        </Text>
      </View>

      <View style={styles.searchRow}>
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            placeholder="Search teachers..."
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={[styles.addBtn, { backgroundColor: colors.primary }]}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading && !teachers.length ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error && !teachers.length ? (
        <View style={styles.center}>
          <Ionicons name="warning" size={40} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity onPress={refresh} style={[styles.retryBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={teachers}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={hasMore ? <ActivityIndicator style={{ marginVertical: 16 }} color={colors.primary} /> : null}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No teachers found</Text>
            </View>
          }
        />
      )}

      <CreateModal visible={modalVisible} onClose={() => setModalVisible(false)} institutionId={institutionId} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  headerSub: { fontSize: 13, marginTop: 2 },
  searchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, gap: 8 },
  searchInput: { flex: 1, fontSize: 14 },
  addBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { marginTop: 12, fontSize: 14, textAlign: 'center' },
  retryBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },
  emptyText: { marginTop: 12, fontSize: 14 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 16 },
  input: { borderRadius: 12, padding: 14, marginBottom: 12, fontSize: 14 },
  saveBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  cancelBtn: { alignItems: 'center', marginTop: 12, paddingVertical: 8 },
  cancelText: { fontSize: 14, fontWeight: '600' },
});
