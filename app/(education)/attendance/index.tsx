// @ts-nocheck

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEducation } from '@/domains/education/hooks/useEducation';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function MarkAttendance() {
  const router = useRouter();
  const { classId } = useLocalSearchParams();
  const { user } = useAuthStore();
  const { getTeacherByUserId, getClassStudents, getClassLessons, markAttendance } = useEducation();
  const [teacher, setTeacher] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [attendance, setAttendance] = useState<Record<string, string>>({}); // { studentId: 'present'|'absent'|'late' }
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [user?.id, classId]);

  const loadData = async () => {
    if (!user?.id) return;
    const t = await getTeacherByUserId(user.id);
    setTeacher(t);
    if (t && classId) {
      const [s, l] = await Promise.all([
        getClassStudents(classId),
        getClassLessons(classId),
      ]);
      setStudents(s || []);
      setLessons(l || []);
      // Default select today's lesson
      const today = new Date().toISOString().split('T')[0];
      const todayLesson = l?.find((les: any) => les.date === today);
      if (todayLesson) setSelectedLesson(todayLesson);
    }
  };

  const toggleStatus = (studentId, status) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSave = async () => {
    if (!selectedLesson) {
      Alert.alert('Select Lesson', 'Please select a lesson first');
      return;
    }
    setSaving(true);
    try {
      const records = Object.entries(attendance).map(([studentId, status]) => ({
        student_id: studentId,
        lesson_id: selectedLesson.id,
        status,
        marked_by: teacher?.id,
      }));
      await markAttendance(records);
      Alert.alert('Success', 'Attendance saved');
      router.back();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const presentCount = Object.values(attendance).filter((s: any) => s === 'present').length;
  const absentCount = Object.values(attendance).filter((s: any) => s === 'absent').length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mark Attendance</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          <Text style={[styles.saveBtn, saving && styles.saveBtnDisabled]}>{saving ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      {/* Lesson Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.lessonScroll}>
        {lessons.map((lesson: any) => (
          <TouchableOpacity
            key={lesson.id}
            style={[styles.lessonChip, selectedLesson?.id === lesson.id && styles.lessonChipActive]}
            onPress={() => setSelectedLesson(lesson)}
          >
            <Text style={[styles.lessonChipText, selectedLesson?.id === lesson.id && styles.lessonChipTextActive]}>
              {lesson.subject?.name} • {lesson.start_time?.slice(0,5)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryText}>Present: <Text style={{ color: '#059669', fontWeight: '700' }}>{presentCount}</Text></Text>
        <Text style={styles.summaryText}>Absent: <Text style={{ color: '#ef4444', fontWeight: '700' }}>{absentCount}</Text></Text>
        <Text style={styles.summaryText}>Total: <Text style={{ fontWeight: '700' }}>{students.length}</Text></Text>
      </View>

      {/* Student List */}
      <ScrollView style={styles.studentList}>
        {students.map((student: any) => {
          const status = attendance[student.id];
          return (
            <View key={student.id} style={styles.studentRow}>
              <View style={styles.studentInfo}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{student.full_name?.charAt(0)}</Text>
                </View>
                <View>
                  <Text style={styles.studentName}>{student.full_name}</Text>
                  <Text style={styles.studentRoll}>Roll: {student.roll_number || 'N/A'}</Text>
                </View>
              </View>
              <View style={styles.statusButtons}>
                <TouchableOpacity
                  style={[styles.statusBtn, status === 'present' && styles.statusBtnPresent]}
                  onPress={() => toggleStatus(student.id, 'present')}
                >
                  <Ionicons name="checkmark" size={16} color={status === 'present' ? '#fff' : '#059669'} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.statusBtn, status === 'absent' && styles.statusBtnAbsent]}
                  onPress={() => toggleStatus(student.id, 'absent')}
                >
                  <Ionicons name="close" size={16} color={status === 'absent' ? '#fff' : '#ef4444'} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.statusBtn, status === 'late' && styles.statusBtnLate]}
                  onPress={() => toggleStatus(student.id, 'late')}
                >
                  <Ionicons name="time" size={16} color={status === 'late' ? '#fff' : '#f59e0b'} />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  saveBtn: { fontSize: 16, color: '#6366f1', fontWeight: '700' },
  saveBtnDisabled: { color: '#9ca3af' },
  lessonScroll: { maxHeight: 60, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff' },
  lessonChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6', marginRight: 8 },
  lessonChipActive: { backgroundColor: '#6366f1' },
  lessonChipText: { fontSize: 13, color: '#6b7280' },
  lessonChipTextActive: { color: '#fff', fontWeight: '600' },
  summary: { flexDirection: 'row', justifyContent: 'space-around', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  summaryText: { fontSize: 14, color: '#374151' },
  studentList: { flex: 1 },
  studentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  studentInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e0e7ff', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#6366f1' },
  studentName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  studentRoll: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  statusButtons: { flexDirection: 'row', gap: 8 },
  statusBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  statusBtnPresent: { backgroundColor: '#059669', borderColor: '#059669' },
  statusBtnAbsent: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
  statusBtnLate: { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
});

