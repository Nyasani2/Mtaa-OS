import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

interface GradeStudent {
  id: string;
  full_name: string;
  admission_number: string;
  score: string;
  grade: string;
  remarks: string;
}

export default function EnterGradesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [students, setStudents] = useState<GradeStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedExam, setSelectedExam] = useState('');
  const [exams, setExams] = useState<any[]>([]);

  const fetchExams = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('education_exams')
      .select('id, title, subject, exam_type, exam_date')
      .eq('teacher_id', user.id)
      .eq('status', 'published')
      .order('exam_date', { ascending: false });
    setExams(data || []);
    if (data && data.length > 0) setSelectedExam(data[0].id);
  }, [user?.id]);

  const fetchStudents = useCallback(async () => {
    if (!selectedExam) return;
    setLoading(true);

    const { data: exam } = await supabase
      .from('education_exams')
      .select('class_id')
      .eq('id', selectedExam)
      .single();

    if (!exam) { setLoading(false); return; }

    const { data: enrollments } = await supabase
      .from('education_enrollments')
      .select('student_id')
      .eq('class_id', exam.class_id)
      .eq('status', 'active');

    if (!enrollments) { setLoading(false); return; }

    const studentIds = enrollments.map(e => e.student_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', studentIds);

    const { data: existingGrades } = await supabase
      .from('education_grades')
      .select('student_id, score, grade, remarks')
      .eq('exam_id', selectedExam);

    const gradeMap = new Map(existingGrades?.map(g => [g.student_id, g]) || []);

    const merged = (profiles || []).map(p => ({
      id: p.id,
      full_name: p.display_name || 'Student',
      admission_number: p.id.slice(0, 8).toUpperCase(),
      score: gradeMap.get(p.id)?.score?.toString() || '',
      grade: gradeMap.get(p.id)?.grade || '',
      remarks: gradeMap.get(p.id)?.remarks || '',
    }));

    setStudents(merged);
    setLoading(false);
  }, [selectedExam]);

  useEffect(() => { fetchExams(); }, [fetchExams]);
  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const updateStudent = (id: string, field: string, value: string) => {
    setStudents(prev => prev.map(s => {
      if (s.id !== id) return s;
      const updated = { ...s, [field]: value };
      if (field === 'score') {
        const score = parseFloat(value);
        if (!isNaN(score)) {
          updated.grade = calculateGrade(score);
        }
      }
      return updated;
    }));
  };

  const calculateGrade = (score: number): string => {
    if (score >= 80) return 'A';
    if (score >= 75) return 'A-';
    if (score >= 70) return 'B+';
    if (score >= 65) return 'B';
    if (score >= 60) return 'B-';
    if (score >= 55) return 'C+';
    if (score >= 50) return 'C';
    if (score >= 45) return 'C-';
    if (score >= 40) return 'D+';
    if (score >= 35) return 'D';
    if (score >= 30) return 'D-';
    return 'E';
  };

  const saveGrades = async () => {
    if (!user?.id || !selectedExam) return;
    setSaving(true);
    try {
      const records = students
        .filter(s => s.score !== '')
        .map(s => ({
          exam_id: selectedExam,
          student_id: s.id,
          teacher_id: user.id,
          score: parseFloat(s.score) || 0,
          grade: s.grade || calculateGrade(parseFloat(s.score) || 0),
          remarks: s.remarks || null,
          marked_at: new Date().toISOString(),
        }));

      const { error } = await supabase
        .from('education_grades')
        .upsert(records, { onConflict: 'exam_id,student_id' });

      if (error) throw error;
      Alert.alert('Saved', `Grades saved for ${records.length} students`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

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
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Enter Grades</Text>
        <TouchableOpacity onPress={saveGrades} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color="#00d4ff" /> : <Ionicons name="save-outline" size={24} color="#00d4ff" />}
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.examScroll}>
        {exams.map(e => (
          <TouchableOpacity
            key={e.id}
            style={[styles.examChip, selectedExam === e.id && styles.examChipActive]}
            onPress={() => setSelectedExam(e.id)}
          >
            <Text style={[styles.examChipText, selectedExam === e.id && styles.examChipTextActive]}>
              {e.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {students.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="school-outline" size={48} color="#333" />
            <Text style={styles.emptyText}>No students found</Text>
          </View>
        ) : (
          <>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Student</Text>
              <Text style={[styles.tableHeaderText, { width: 60, textAlign: 'center' }]}>Score</Text>
              <Text style={[styles.tableHeaderText, { width: 50, textAlign: 'center' }]}>Grade</Text>
              <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>Remarks</Text>
            </View>
            {students.map((student, i) => (
              <View key={student.id} style={styles.tableRow}>
                <View style={{ flex: 2 }}>
                  <Text style={styles.studentName}>{i + 1}. {student.full_name}</Text>
                  <Text style={styles.studentId}>{student.admission_number}</Text>
                </View>
                <TextInput
                  style={[styles.scoreInput, { width: 60 }]}
                  value={student.score}
                  onChangeText={(v) => updateStudent(student.id, 'score', v)}
                  keyboardType="numeric"
                  maxLength={5}
                  placeholder="0"
                  placeholderTextColor="#444"
                />
                <TextInput
                  style={[styles.scoreInput, { width: 50 }]}
                  value={student.grade}
                  onChangeText={(v) => updateStudent(student.id, 'grade', v)}
                  maxLength={2}
                  placeholder="-"
                  placeholderTextColor="#444"
                />
                <TextInput
                  style={[styles.scoreInput, { flex: 1.5 }]}
                  value={student.remarks}
                  onChangeText={(v) => updateStudent(student.id, 'remarks', v)}
                  placeholder="Remarks"
                  placeholderTextColor="#444"
                />
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  examScroll: { maxHeight: 50, paddingHorizontal: 16, paddingVertical: 10 },
  examChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: '#111', borderWidth: 1, borderColor: '#1a1a1a', marginRight: 8 },
  examChipActive: { backgroundColor: '#00d4ff15', borderColor: '#00d4ff' },
  examChipText: { color: '#888', fontSize: 12 },
  examChipTextActive: { color: '#00d4ff', fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingTop: 8 },
  tableHeader: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#333' },
  tableHeaderText: { color: '#888', fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  studentName: { color: '#fff', fontSize: 13, fontWeight: '500' },
  studentId: { color: '#666', fontSize: 10, marginTop: 1 },
  scoreInput: { backgroundColor: '#111', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, color: '#fff', fontSize: 13, borderWidth: 1, borderColor: '#1a1a1a', textAlign: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: '#666', fontSize: 16, marginTop: 12 },
});
