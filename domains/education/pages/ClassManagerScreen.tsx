import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl, Alert, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';

interface ClassItem {
  id: string;
  name: string;
  grade_level: string;
  subject_name: string;
  student_count: number;
  teacher_name: string;
  room?: string;
  schedule?: string;
}

interface StudentItem {
  id: string;
  full_name: string;
  admission_number: string;
  enrollment_status: string;
  current_level: string;
}

export default function ClassManagerScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newGradeLevel, setNewGradeLevel] = useState('');
  const [newSubjectId, setNewSubjectId] = useState('');
  const [newRoom, setNewRoom] = useState('');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // Check if admin
      const { data: teacherData } = await supabase
        .from('education_teachers')
        .select('id, institution_id, role')
        .eq('user_id', user?.id)
        .single();

      setIsAdmin(['admin', 'principal', 'headteacher'].includes(teacherData?.role));

      const institutionId = teacherData?.institution_id;
      if (!institutionId) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Fetch subjects
      const { data: subData } = await supabase
        .from('education_subjects')
        .select('id, name')
        .eq('institution_id', institutionId);
      setSubjects(subData || []);

      // Fetch classes
      const { data: classData } = await supabase
        .from('education_classes')
        .select(`
          id, name, grade_level, room, schedule,
          subject:subject_id(name),
          teacher:teacher_id(full_name)
        `)
        .eq('institution_id', institutionId);

      // Get student counts
      const classIds = (classData || []).map((c: any) => c.id);
      const { data: enrollments } = await supabase
        .from('education_enrollments')
        .select('class_id')
        .in('class_id', classIds)
        .eq('status', 'active');

      const countMap = new Map();
      (enrollments || []).forEach((e: any) => {
        countMap.set(e.class_id, (countMap.get(e.class_id) || 0) + 1);
      });

      const mapped: ClassItem[] = (classData || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        grade_level: c.grade_level,
        subject_name: c.subject?.name || 'General',
        student_count: countMap.get(c.id) || 0,
        teacher_name: c.teacher?.full_name || 'Unassigned',
        room: c.room,
        schedule: c.schedule,
      }));

      setClasses(mapped);
    } catch (e) {
      console.error('[ClassManager]', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const fetchStudents = async (classId: string) => {
    try {
      const { data } = await supabase
        .from('education_students')
        .select('id, full_name, admission_number, enrollment_status, current_level')
        .eq('class_id', classId);
      setStudents(data || []);
    } catch (e) {
      console.error('[ClassManager] Fetch students:', e);
    }
  };

  const handleCreateClass = async () => {
    if (!newClassName.trim() || !newGradeLevel.trim()) {
      Alert.alert('Error', 'Class name and grade level are required');
      return;
    }

    try {
      const { data: teacherData } = await supabase
        .from('education_teachers')
        .select('institution_id')
        .eq('user_id', user?.id)
        .single();

      const { error } = await supabase.from('education_classes').insert({
        name: newClassName.trim(),
        grade_level: newGradeLevel.trim(),
        institution_id: teacherData?.institution_id,
        teacher_id: teacherData?.id,
        subject_id: newSubjectId || null,
        room: newRoom.trim() || null,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      Alert.alert('Success', 'Class created successfully');
      setShowAddModal(false);
      setNewClassName('');
      setNewGradeLevel('');
      setNewSubjectId('');
      setNewRoom('');
      fetchData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create class');
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Class Manager</Text>
        <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{classes.length} classes</Text>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: 16 }}
      >
        {isAdmin && (
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={() => setShowAddModal(true)}>
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.addBtnText}>Create New Class</Text>
          </TouchableOpacity>
        )}

        {classes.map((c: any) => (
          <TouchableOpacity
            key={c.id}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {
              setSelectedClass(c);
              fetchStudents(c.id);
            }}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="people" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{c.name}</Text>
                <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>
                  Grade {c.grade_level} · {c.subject_name}
                </Text>
              </View>
              <View style={[styles.countBadge, { backgroundColor: colors.primary + '15' }]}>
                <Text style={[styles.countText, { color: colors.primary }]}>{c.student_count}</Text>
              </View>
            </View>
            <View style={styles.cardFooter}>
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                <Ionicons name="person" size={12} color={colors.textSecondary} /> {c.teacher_name}
              </Text>
              {c.room && <Text style={[styles.footerText, { color: colors.textSecondary }]}> · Room {c.room}</Text>}
            </View>
          </TouchableOpacity>
        ))}

        {classes.length === 0 && (
          <View style={styles.center}>
            <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No classes found</Text>
          </View>
        )}
      </ScrollView>

      {/* Student List Modal */}
      <Modal visible={!!selectedClass} animationType="slide" transparent onRequestClose={() => setSelectedClass(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedClass?.name}</Text>
              <TouchableOpacity onPress={() => setSelectedClass(null)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
              {students.length} students enrolled
            </Text>
            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
              {students.map((s: any) => (
                <View key={s.id} style={[styles.studentRow, { borderBottomColor: colors.border }]}>
                  <View style={[styles.studentAvatar, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.studentAvatarText, { color: colors.primary }]}>{s.full_name.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.studentName, { color: colors.text }]}>{s.full_name}</Text>
                    <Text style={[styles.studentMeta, { color: colors.textSecondary }]}>
                      Adm: {s.admission_number} · Grade {s.current_level}
                    </Text>
                  </View>
                  <View style={[styles.statusPill, {
                    backgroundColor: s.enrollment_status === 'active' ? '#ECFDF5' : '#FEE2E2'
                  }]}>
                    <Text style={[styles.statusText, {
                      color: s.enrollment_status === 'active' ? '#059669' : '#DC2626'
                    }]}>{s.enrollment_status}</Text>
                  </View>
                </View>
              ))}
              {students.length === 0 && (
                <Text style={[styles.emptyText, { color: colors.textSecondary, textAlign: 'center', paddingVertical: 24 }]}>
                  No students enrolled
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Class Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Create New Class</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
              placeholder="Class Name *"
              placeholderTextColor={colors.textSecondary}
              value={newClassName}
              onChangeText={setNewClassName}
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
              placeholder="Grade Level *"
              placeholderTextColor={colors.textSecondary}
              value={newGradeLevel}
              onChangeText={setNewGradeLevel}
            />
            <Text style={[styles.label, { color: colors.textSecondary }]}>Subject (optional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 12 }}>
              <TouchableOpacity
                style={[styles.subjectChip, !newSubjectId && { backgroundColor: colors.primary }]}
                onPress={() => setNewSubjectId('')}
              >
                <Text style={[styles.subjectChipText, { color: !newSubjectId ? '#fff' : colors.text }]}>General</Text>
              </TouchableOpacity>
              {subjects.map((s: any) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.subjectChip, newSubjectId === s.id && { backgroundColor: colors.primary }]}
                  onPress={() => setNewSubjectId(s.id)}
                >
                  <Text style={[styles.subjectChipText, { color: newSubjectId === s.id ? '#fff' : colors.text }]}>{s.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
              placeholder="Room (optional)"
              placeholderTextColor={colors.textSecondary}
              value={newRoom}
              onChangeText={setNewRoom}
            />
            <TouchableOpacity style={[styles.createBtn, { backgroundColor: colors.primary }]} onPress={handleCreateClass}>
              <Text style={styles.createBtnText}>Create Class</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowAddModal(false)}>
              <Text style={[styles.closeText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  headerSub: { fontSize: 13, marginTop: 2 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, marginBottom: 12 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  card: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardMeta: { fontSize: 13, marginTop: 2 },
  countBadge: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  countText: { fontSize: 14, fontWeight: '700' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  footerText: { fontSize: 12 },
  emptyText: { marginTop: 12, fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modal: { width: '100%', maxWidth: 400, borderRadius: 16, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalSub: { fontSize: 13, marginBottom: 12 },
  studentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  studentAvatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  studentAvatarText: { fontSize: 14, fontWeight: '700' },
  studentName: { fontSize: 14, fontWeight: '600' },
  studentMeta: { fontSize: 12, marginTop: 2 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  input: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, borderWidth: 1, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  subjectChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6' },
  subjectChipText: { fontSize: 12, fontWeight: '600' },
  createBtn: { paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginBottom: 8 },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  closeBtn: { paddingVertical: 10, alignItems: 'center' },
  closeText: { fontSize: 14, fontWeight: '500' },
});
