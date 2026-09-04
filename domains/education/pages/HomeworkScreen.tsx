import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';

interface HomeworkDetail {
  id: string;
  title: string;
  description: string;
  instructions?: string;
  subject_name: string;
  teacher_name: string;
  due_date: string;
  status: 'pending' | 'submitted' | 'graded';
  submission_text?: string;
  submission_url?: string;
  score?: number;
  feedback?: string;
  max_score: number;
  submitted_at?: string;
}

export default function HomeworkScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [homework, setHomework] = useState<HomeworkDetail[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all');
  const [selected, setSelected] = useState<HomeworkDetail | null>(null);
  const [submitModal, setSubmitModal] = useState(false);
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [submissionComment, setSubmissionComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchHomework = useCallback(async () => {
    setLoading(true);
    try {
      const { data: identity } = await supabase
        .from('education_students')
        .select('id, class_id')
        .eq('user_id', user?.id)
        .single();
      if (!identity) throw new Error('Student identity not found');

      const { data: assignments } = await supabase
        .from('education_assignments')
        .select('id, title, description, instructions, due_date, max_score, subject:subject_id(name), teacher:teacher_id(full_name)')
        .eq('class_id', identity.class_id)
        .order('due_date', { ascending: true });

      const assignmentIds = (assignments || []).map((a: any) => a.id);
      const { data: submissions } = await supabase
        .from('education_submissions')
        .select('assignment_id, status, score, feedback, submission_text, submission_url, submitted_at')
        .in('assignment_id', assignmentIds)
        .eq('student_id', identity.id);

      const subMap = new Map(submissions?.map((s: any) => [s.assignment_id, s]));

      const mapped: HomeworkDetail[] = (assignments || []).map((a: any) => {
        const sub = subMap.get(a.id);
        return {
          id: a.id,
          title: a.title,
          description: a.description,
          instructions: a.instructions,
          subject_name: a.subject?.name || 'General',
          teacher_name: a.teacher?.full_name || 'Teacher',
          due_date: a.due_date,
          max_score: a.max_score || 100,
          status: sub?.status === 'graded' ? 'graded' : sub ? 'submitted' : 'pending',
          submission_text: sub?.submission_text,
          submission_url: sub?.submission_url,
          score: sub?.score,
          feedback: sub?.feedback,
          submitted_at: sub?.submitted_at,
        };
      });

      setHomework(mapped);

      // If id param provided, auto-open that homework
      if (id) {
        const target = mapped.find((h: any) => h.id === id);
        if (target) setSelected(target);
      }
    } catch (e: any) {
      console.error('[Homework]', e);
      Alert.alert('Error', e.message || 'Failed to load homework');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, id]);

  useEffect(() => { fetchHomework(); }, [fetchHomework]);

  const onRefresh = () => { setRefreshing(true); fetchHomework(); };

  const handleSubmit = async () => {
    if (!selected || !submissionUrl.trim()) {
      Alert.alert('Error', 'Please provide a submission URL');
      return;
    }
    setSubmitting(true);
    try {
      const { data: identity } = await supabase
        .from('education_students')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      const { error } = await supabase
        .from('education_submissions')
        .upsert({
          assignment_id: selected.id,
          student_id: identity?.id,
          submission_url: submissionUrl.trim(),
          submission_text: submissionComment.trim() || null,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        }, { onConflict: 'assignment_id,student_id' });

      if (error) throw error;

      setSubmitModal(false);
      setSubmissionUrl('');
      setSubmissionComment('');
      fetchHomework();
      Alert.alert('Success', 'Homework submitted successfully');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = filter === 'all' ? homework : homework.filter((h: any) => h.status === filter);
  const counts = {
    pending: homework.filter((h: any) => h.status === 'pending').length,
    submitted: homework.filter((h: any) => h.status === 'submitted').length,
    graded: homework.filter((h: any) => h.status === 'graded').length,
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading homework...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Homework</Text>
        <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{counts.pending} pending · {counts.graded} graded</Text>
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {(['all', 'pending', 'submitted', 'graded'] as const).map((f: any) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, { color: filter === f ? colors.primary : colors.textSecondary }]}>
              {f.charAt(0).toUpperCase() + f.slice(1)} {f !== 'all' && `(${counts[f]})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: 16 }}
      >
        {filtered.map((hw: any) => (
          <TouchableOpacity
            key={hw.id}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setSelected(hw)}
          >
            <View style={styles.cardHeader}>
              <View>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{hw.title}</Text>
                <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>{hw.subject_name} · {hw.teacher_name}</Text>
              </View>
              <View style={[styles.pill, {
                backgroundColor: hw.status === 'pending' ? '#FEE2E2' : hw.status === 'submitted' ? '#DBEAFE' : '#ECFDF5'
              }]}>
                <Text style={[styles.pillText, {
                  color: hw.status === 'pending' ? '#DC2626' : hw.status === 'submitted' ? '#2563EB' : '#059669'
                }]}>{hw.status}</Text>
              </View>
            </View>
            <Text style={[styles.due, {
              color: new Date(hw.due_date) < new Date() && hw.status === 'pending' ? '#EF4444' : colors.textSecondary
            }]}>
              Due: {new Date(hw.due_date).toLocaleDateString()} {new Date(hw.due_date) < new Date() && hw.status === 'pending' && '(Overdue)'}
            </Text>
            {hw.score !== undefined && (
              <Text style={[styles.score, { color: colors.primary }]}>Score: {hw.score}/{hw.max_score}</Text>
            )}
          </TouchableOpacity>
        ))}
        {filtered.length === 0 && <Text style={[styles.empty, { color: colors.textSecondary }]}>No {filter} homework</Text>}
      </ScrollView>

      {/* Detail Modal */}
      <Modal visible={!!selected} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{selected?.title}</Text>
            <Text style={[styles.modalMeta, { color: colors.textSecondary }]}>{selected?.subject_name} · {selected?.teacher_name}</Text>

            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
              <View style={styles.detailBlock}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Instructions</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{selected?.instructions || selected?.description || 'No instructions provided.'}</Text>
              </View>

              <View style={styles.detailBlock}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Due Date</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {selected?.due_date ? new Date(selected.due_date).toLocaleString() : 'No due date'}
                </Text>
              </View>

              {selected?.status === 'graded' && (
                <View style={[styles.gradeBox, { backgroundColor: '#ECFDF5' }]}>
                  <Text style={[styles.gradeScore, { color: '#059669' }]}>{selected.score} / {selected.max_score}</Text>
                  <Text style={[styles.gradeFeedback, { color: colors.text }]}>{selected.feedback || 'Graded'}</Text>
                </View>
              )}

              {selected?.status === 'submitted' && (
                <View style={styles.detailBlock}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Submitted</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{selected.submission_url}</Text>
                  {selected.submission_text && <Text style={[styles.detailValue, { color: colors.text, marginTop: 4 }]}>{selected.submission_text}</Text>}
                </View>
              )}
            </ScrollView>

            {selected?.status === 'pending' && (
              <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primary }]} onPress={() => setSubmitModal(true)}>
                <Text style={styles.submitBtnText}>Submit Homework</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelected(null)}>
              <Text style={[styles.closeText, { color: colors.textSecondary }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Submit Modal */}
      <Modal visible={submitModal} animationType="slide" transparent onRequestClose={() => setSubmitModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Submit Homework</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
              placeholder="Submission URL *"
              placeholderTextColor={colors.textSecondary}
              value={submissionUrl}
              onChangeText={setSubmissionUrl}
            />
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
              placeholder="Comments (optional)"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
              value={submissionComment}
              onChangeText={setSubmissionComment}
            />
            <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primary }]} onPress={handleSubmit} disabled={submitting}>
              {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitBtnText}>Submit</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSubmitModal(false)}>
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
  loadingText: { marginTop: 12, fontSize: 14 },
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  headerSub: { fontSize: 13, marginTop: 2 },
  filterBar: { flexDirection: 'row', borderBottomWidth: 1 },
  filterTab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  filterText: { fontSize: 13, fontWeight: '600' },
  card: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardMeta: { fontSize: 12, marginTop: 2 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  pillText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  due: { fontSize: 12, marginTop: 4 },
  score: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  empty: { textAlign: 'center', paddingVertical: 24, fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modal: { width: '100%', maxWidth: 400, borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalMeta: { fontSize: 12, marginTop: 4, marginBottom: 12 },
  detailBlock: { marginBottom: 14 },
  detailLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' },
  detailValue: { fontSize: 14, lineHeight: 20 },
  gradeBox: { borderRadius: 12, padding: 14, marginBottom: 14, alignItems: 'center' },
  gradeScore: { fontSize: 24, fontWeight: '800' },
  gradeFeedback: { fontSize: 13, marginTop: 4, textAlign: 'center' },
  submitBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 8 },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  closeBtn: { paddingVertical: 10, alignItems: 'center' },
  closeText: { fontSize: 14, fontWeight: '500' },
  input: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, borderWidth: 1, marginBottom: 12 },
  textArea: { height: 80, textAlignVertical: 'top' },
});
