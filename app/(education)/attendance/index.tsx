import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  Alert, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

const { width: SCREEN_W } = Dimensions.get('window');

interface Student {
  id: string;
  user_id: string;
  full_name: string;
  admission_number: string;
  avatar_url: string | null;
  status: 'present' | 'absent' | 'late' | 'excused' | null;
}

export default function AttendanceScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('');
  const [classes, setClasses] = useState<any[]>([]);

  const fetchClasses = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('education_classes')
      .select('id, name, grade_level, subject')
      .eq('teacher_id', user.id)
      .eq('status', 'active');
    setClasses(data || []);
    if (data && data.length > 0) setSelectedClass(data[0].id);
  }, [user?.id]);

  const fetchStudents = useCallback(async () => {
    if (!selectedClass) return;
    setLoading(true);
    const { data: enrollments } = await supabase
      .from('education_enrollments')
      .select('student_id')
      .eq('class_id', selectedClass)
      .eq('status', 'active');

    if (!enrollments || enrollments.length === 0) {
      setStudents([]);
      setLoading(false);
      return;
    }

    const studentIds = enrollments.map(e => e.student_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, user_id, display_name, avatar_url')
      .in('id', studentIds);

    const { data: attendance } = await supabase
      .from('education_attendance')
      .select('student_id, status')
      .eq('class_id', selectedClass)
      .eq('date', selectedDate);

    const attendanceMap = new Map(attendance?.map(a => [a.student_id, a.status]) || []);

    const merged = (profiles || []).map(p => ({
      id: p.id,
      user_id: p.user_id,
      full_name: p.display_name || 'Student',
      admission_number: p.user_id.slice(0, 8).toUpperCase(),
      avatar_url: p.avatar_url,
      status: (attendanceMap.get(p.id) as any) || null,
    }));

    setStudents(merged);
    setLoading(false);
  }, [selectedClass, selectedDate]);

  useEffect(() => { fetchClasses(); }, [fetchClasses]);
  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const markStatus = (studentId: string, status: 'present' | 'absent' | 'late' | 'excused') => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status } : s));
  };

  const saveAttendance = async () => {
    if (!user?.id || !selectedClass) return;
    setSaving(true);
    try {
      const records = students
        .filter(s => s.status !== null)
        .map(s => ({
          class_id: selectedClass,
          student_id: s.id,
          teacher_id: user.id,
          date: selectedDate,
          status: s.status,
          marked_at: new Date().toISOString(),
        }));

      if (records.length === 0) {
        Alert.alert('No Changes', 'No attendance marks to save');
        setSaving(false);
        return;
      }

      // Upsert attendance records
      const { error } = await supabase
        .from('education_attendance')
        .upsert(records, { onConflict: 'class_id,student_id,date' });

      if (error) throw error;
      Alert.alert('Saved', `Attendance saved for ${records.length} students`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const getStats = () => {
    const present = students.filter(s => s.status === 'present').length;
    const absent = students.filter(s => s.status === 'absent').length;
    const late = students.filter(s => s.status === 'late').length;
    const excused = students.filter(s => s.status === 'excused').length;
    const unmarked = students.filter(s => s.status === null).length;
    return { present, absent, late, excused, unmarked, total: students.length };
  };

  const stats = getStats();

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#00d4ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attendance</Text>
        <TouchableOpacity onPress={saveAttendance} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color="#00d4ff" /> : <Ionicons name="save-outline" size={24} color="#00d4ff" />}
        </TouchableOpacity>
      </View>

      {/* Date & Class Selector */}
      <View style={styles.selectorRow}>
        <TextInput
          style={styles.dateInput}
          value={selectedDate}
          onChangeText={setSelectedDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#666"
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.classScroll}>
          {classes.map(c => (
            <TouchableOpacity
              key={c.id}
              style={[styles.classChip, selectedClass === c.id && styles.classChipActive]}
              onPress={() => setSelectedClass(c.id)}
            >
              <Text style={[styles.classChipText, selectedClass === c.id && styles.classChipTextActive]}>
                {c.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { label: 'Present', value: stats.present, color: '#00ff88' },
          { label: 'Absent', value: stats.absent, color: '#ff4444' },
          { label: 'Late', value: stats.late, color: '#ffaa00' },
          { label: 'Excused', value: stats.excused, color: '#00d4ff' },
          { label: 'Unmarked', value: stats.unmarked, color: '#666' },
        ].map(stat => (
          <View key={stat.label} style={styles.statBox}>
            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Student List */}
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {students.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color="#333" />
            <Text style={styles.emptyText}>No students enrolled</Text>
          </View>
        ) : (
          students.map((student, index) => (
            <View key={student.id} style={styles.studentRow}>
              <View style={styles.studentInfo}>
                <Text style={styles.studentNumber}>{index + 1}</Text>
                {student.avatar_url ? (
                  <Image source={{ uri: student.avatar_url }} style={styles.studentAvatar} />
                ) : (
                  <View style={styles.studentAvatarFallback}>
                    <Ionicons name="person" size={16} color="#fff" />
                  </View>
                )}
                <View>
                  <Text style={styles.studentName}>{student.full_name}</Text>
                  <Text style={styles.studentId}>{student.admission_number}</Text>
                </View>
              </View>
              <View style={styles.statusButtons}>
                {(['present', 'absent', 'late', 'excused'] as const).map(status => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusBtn,
                      student.status === status && styles.statusBtnActive,
                      student.status === status && { backgroundColor: getStatusColor(status) + '22', borderColor: getStatusColor(status) },
                    ]}
                    onPress={() => markStatus(student.id, status)}
                  >
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(status) }]} />
                    <Text style={[styles.statusText, student.status === status && { color: getStatusColor(status) }]}>
                      {status.charAt(0).toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    present: '#00ff88',
    absent: '#ff4444',
    late: '#ffaa00',
    excused: '#00d4ff',
  };
  return colors[status] || '#666';
}

// Need to import Image
import { Image, TextInput } from 'react-native';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  selectorRow: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  dateInput: { backgroundColor: '#111', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, color: '#fff', fontSize: 14, borderWidth: 1, borderColor: '#1a1a1a', marginBottom: 10 },
  classScroll: { maxHeight: 40 },
  classChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: '#111', borderWidth: 1, borderColor: '#1a1a1a', marginRight: 8 },
  classChipActive: { backgroundColor: '#00d4ff15', borderColor: '#00d4ff' },
  classChipText: { color: '#888', fontSize: 12 },
  classChipTextActive: { color: '#00d4ff', fontWeight: '600' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  statBox: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700' },
  statLabel: { color: '#888', fontSize: 11, marginTop: 2 },
  list: { paddingHorizontal: 16, paddingTop: 8 },
  studentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  studentInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  studentNumber: { color: '#666', fontSize: 12, width: 24 },
  studentAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  studentAvatarFallback: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#333', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  studentName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  studentId: { color: '#666', fontSize: 11, marginTop: 1 },
  statusButtons: { flexDirection: 'row', gap: 6 },
  statusBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, backgroundColor: '#111', borderWidth: 1, borderColor: '#1a1a1a', gap: 4 },
  statusBtnActive: { borderWidth: 1 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { color: '#888', fontSize: 10, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: '#666', fontSize: 16, marginTop: 12 },
});
