import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal,
  Alert, ActivityIndicator, RefreshControl, FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useTestBuilder, useTestList } from '@/domains/education/hooks/useTestQuiz';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';

const TYPE_COLORS: Record<string, string> = {
  quiz: '#3b82f6', exam: '#ef4444', midterm: '#f59e0b', final: '#8b5cf6', practice: '#10b981', diagnostic: '#6366f1',
};

const QUESTION_TYPES = [
  { value: 'multiple_choice', label: 'Multiple Choice', icon: 'list' },
  { value: 'true_false', label: 'True / False', icon: 'toggle' },
  { value: 'short_answer', label: 'Short Answer', icon: 'create' },
  { value: 'essay', label: 'Essay', icon: 'document-text' },
];

export default function TestBuilderScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // If no id param, show test list with create option
  const [mode, setMode] = useState<'list' | 'builder'>(id ? 'builder' : 'list');
  const [selectedTestId, setSelectedTestId] = useState<string | null>(id || null);

  // Test list hook
  const { tests, loading: listLoading, error: listError, creating, fetch: fetchTests, add: addTest, publish, activate, close, remove } = useTestList({
    teacher_id: user?.id,
    institution_id: user?.institution_id,
  });

  // Test builder hook
  const { test, questions, loading: builderLoading, error: builderError, saving, deleting, fetch: fetchBuilder, addQuestion, editQuestion, removeQuestion } = useTestBuilder(selectedTestId || undefined);

  // Modals
  const [createModal, setCreateModal] = useState(false);
  const [newTest, setNewTest] = useState({ title: '', description: '', test_type: 'quiz', duration_minutes: 30, max_attempts: 1, passing_score: 50, total_points: 100 });

  const [questionModal, setQuestionModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    question_text: '', question_type: 'multiple_choice', points: 1, order_index: 0,
    options: [{ id: 'a', text: '' }, { id: 'b', text: '' }, { id: 'c', text: '' }, { id: 'd', text: '' }],
    correct_answer: '',
    explanation: '',
  });

  const handleCreateTest = async () => {
    if (!newTest.title.trim()) { Alert.alert('Error', 'Title is required'); return; }
    if (!user?.institution_id) { Alert.alert('Error', 'No institution linked'); return; }
    const { data, error } = await addTest({
      institution_id: user.institution_id,
      teacher_id: user.id,
      title: newTest.title.trim(),
      description: newTest.description.trim() || undefined,
      test_type: newTest.test_type,
      duration_minutes: newTest.duration_minutes,
      max_attempts: newTest.max_attempts,
      passing_score: newTest.passing_score,
      total_points: newTest.total_points,
    });
    if (data) {
      setCreateModal(false);
      setNewTest({ title: '', description: '', test_type: 'quiz', duration_minutes: 30, max_attempts: 1, passing_score: 50, total_points: 100 });
      setSelectedTestId(data.id);
      setMode('builder');
    }
  };

  const handleAddQuestion = async () => {
    if (!selectedTestId || !newQuestion.question_text.trim()) { Alert.alert('Error', 'Question text is required'); return; }
    const { data, error } = await addQuestion({
      test_id: selectedTestId,
      question_text: newQuestion.question_text.trim(),
      question_type: newQuestion.question_type,
      points: newQuestion.points,
      order_index: questions.length,
      options: newQuestion.question_type === 'multiple_choice' ? newQuestion.options.filter((o: any) => o.text.trim()) : undefined,
      correct_answer: newQuestion.correct_answer || null,
      explanation: newQuestion.explanation.trim() || undefined,
    });
    if (data) {
      setQuestionModal(false);
      setNewQuestion({
        question_text: '', question_type: 'multiple_choice', points: 1, order_index: 0,
        options: [{ id: 'a', text: '' }, { id: 'b', text: '' }, { id: 'c', text: '' }, { id: 'd', text: '' }],
        correct_answer: '', explanation: '',
      });
    }
  };

  const updateOption = (index: number, text: string) => {
    setNewQuestion(prev => {
      const opts = [...prev.options];
      opts[index] = { ...opts[index], text };
      return { ...prev, options: opts };
    });
  };

  // ===== LIST MODE =====
  if (mode === 'list') {
    if (listLoading && tests.length === 0) {
      return (
        <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading tests...</Text>
        </View>
      );
    }

    if (listError && tests.length === 0) {
      return (
        <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>{listError}</Text>
          <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={fetchTests}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (tests.length === 0) {
      return (
        <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
          <FontAwesome5 name="clipboard-check" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Tests Yet</Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Create quizzes, exams, and assessments for your students.</Text>
          <TouchableOpacity style={[styles.createBtn, { backgroundColor: colors.primary }]} onPress={() => setCreateModal(true)}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.createBtnText}>Create Test</Text>
          </TouchableOpacity>

          <Modal visible={createModal} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
              <View style={[styles.modal, { backgroundColor: colors.card }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>New Test</Text>
                <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text }]} placeholder="Title *" placeholderTextColor={colors.textSecondary} value={newTest.title} onChangeText={t => setNewTest(p => ({ ...p, title: t }))} />
                <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text }]} placeholder="Description" multiline numberOfLines={2} placeholderTextColor={colors.textSecondary} value={newTest.description} onChangeText={t => setNewTest(p => ({ ...p, description: t }))} />
                <View style={styles.row}>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, flex: 1 }]} placeholder="Duration (min)" keyboardType="number-pad" placeholderTextColor={colors.textSecondary} value={String(newTest.duration_minutes)} onChangeText={t => setNewTest(p => ({ ...p, duration_minutes: parseInt(t) || 30 }))} />
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, flex: 1 }]} placeholder="Max Attempts" keyboardType="number-pad" placeholderTextColor={colors.textSecondary} value={String(newTest.max_attempts)} onChangeText={t => setNewTest(p => ({ ...p, max_attempts: parseInt(t) || 1 }))} />
                </View>
                <View style={styles.row}>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, flex: 1 }]} placeholder="Passing Score %" keyboardType="number-pad" placeholderTextColor={colors.textSecondary} value={String(newTest.passing_score)} onChangeText={t => setNewTest(p => ({ ...p, passing_score: parseInt(t) || 50 }))} />
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, flex: 1 }]} placeholder="Total Points" keyboardType="number-pad" placeholderTextColor={colors.textSecondary} value={String(newTest.total_points)} onChangeText={t => setNewTest(p => ({ ...p, total_points: parseInt(t) || 100 }))} />
                </View>
                <View style={styles.row}>
                  <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={() => setCreateModal(false)}>
                    <Text style={{ color: colors.text }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleCreateTest} disabled={creating}>
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
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Tests & Quizzes</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{tests.length} total</Text>
        </View>

        <FlatList
          data={tests}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={listLoading} onRefresh={fetchTests} />}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => {
            const statusColor = TYPE_COLORS[item.test_type] || '#6b7280';
            return (
              <TouchableOpacity
                style={[styles.testCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => { setSelectedTestId(item.id); setMode('builder'); }}
              >
                <View style={styles.testHeader}>
                  <View style={[styles.typeBadge, { backgroundColor: statusColor + '20' }]}>
                    <Text style={[styles.typeText, { color: statusColor }]}>{item.test_type}</Text>
                  </View>
                  <View style={[styles.statusBadge, {
                    backgroundColor: item.status === 'active' ? '#22c55e20' : item.status === 'published' ? '#3b82f620' : item.status === 'closed' ? '#ef444420' : '#6b728020'
                  }]}>
                    <Text style={[styles.statusText, {
                      color: item.status === 'active' ? '#22c55e' : item.status === 'published' ? '#3b82f6' : item.status === 'closed' ? '#ef4444' : '#6b7280'
                    }]}>{item.status}</Text>
                  </View>
                </View>
                <Text style={[styles.testTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
                <Text style={[styles.testMeta, { color: colors.textSecondary }]}>{item.duration_minutes} min · {item.total_points} pts · {item.max_attempts} attempt{item.max_attempts !== 1 ? 's' : ''}</Text>
                <View style={styles.testActions}>
                  {item.status === 'draft' && (
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#3b82f620' }]} onPress={() => publish(item.id)}>
                      <Text style={[styles.actionText, { color: '#3b82f6' }]}>Publish</Text>
                    </TouchableOpacity>
                  )}
                  {item.status === 'published' && (
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#22c55e20' }]} onPress={() => activate(item.id)}>
                      <Text style={[styles.actionText, { color: '#22c55e' }]}>Activate</Text>
                    </TouchableOpacity>
                  )}
                  {item.status === 'active' && (
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#ef444420' }]} onPress={() => close(item.id)}>
                      <Text style={[styles.actionText, { color: '#ef4444' }]}>Close</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />

        <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => setCreateModal(true)}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  // ===== BUILDER MODE =====
  if (!test) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading test builder...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      {/* Builder Header */}
      <View style={[styles.builderHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => setMode('list')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.builderTitle, { color: colors.text }]} numberOfLines={1}>{test.title}</Text>
          <Text style={[styles.builderSub, { color: colors.textSecondary }]}>{questions.length} questions · {test.total_points} pts · {test.duration_minutes} min</Text>
        </View>
        <TouchableOpacity style={[styles.addQBtn, { backgroundColor: colors.primary }]} onPress={() => setQuestionModal(true)}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addQText}>Add Q</Text>
        </TouchableOpacity>
      </View>

      {/* Questions List */}
      {questions.length === 0 ? (
        <View style={styles.center}>
          <FontAwesome5 name="question-circle" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Questions Yet</Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Add questions to build your test.</Text>
          <TouchableOpacity style={[styles.createBtn, { backgroundColor: colors.primary }]} onPress={() => setQuestionModal(true)}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.createBtnText}>Add First Question</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={questions}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={builderLoading} onRefresh={fetchBuilder} />}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item, index }) => (
            <View style={[styles.questionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.questionHeader}>
                <View style={[styles.qNumBadge, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.qNumText, { color: colors.primary }]}>Q{index + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.questionType, { color: colors.textSecondary }]}>{item.question_type.replace('_', ' ')} · {item.points} pt{item.points !== 1 ? 's' : ''}</Text>
                </View>
                <TouchableOpacity onPress={() => removeQuestion(item.id)} disabled={deleting}>
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.questionText, { color: colors.text }]}>{item.question_text}</Text>
              {item.options && item.options.length > 0 && (
                <View style={styles.optionsList}>
                  {item.options.map((opt, i) => (
                    <View key={i} style={[styles.optionRow, { backgroundColor: colors.inputBg }]}>
                      <Text style={[styles.optionText, { color: colors.textSecondary }]}>{String.fromCharCode(97 + i)}. {opt.text}</Text>
                      {item.correct_answer === opt.id && <Ionicons name="checkmark-circle" size={16} color="#22c55e" />}
                    </View>
                  ))}
                </View>
              )}
              {item.correct_answer && item.question_type !== 'multiple_choice' && (
                <Text style={[styles.correctAnswer, { color: '#22c55e' }]}>Answer: {String(item.correct_answer)}</Text>
              )}
            </View>
          )}
        />
      )}

      {/* Add Question Modal */}
      <Modal visible={questionModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={[styles.modal, { backgroundColor: colors.card, maxHeight: '85%' }]} contentContainerStyle={{ padding: 20 }}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Question</Text>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Question Type</Text>
            <View style={styles.typeSelector}>
              {QUESTION_TYPES.map((t: any) => (
                <TouchableOpacity
                  key={t.value}
                  style={[styles.typeChip, newQuestion.question_type === t.value && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  onPress={() => setNewQuestion(p => ({ ...p, question_type: t.value }))}
                >
                  <Ionicons name={t.icon as any} size={16} color={newQuestion.question_type === t.value ? '#fff' : colors.textSecondary} />
                  <Text style={[styles.typeChipText, { color: newQuestion.question_type === t.value ? '#fff' : colors.textSecondary }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, height: 80 }]}
              placeholder="Question text *"
              multiline
              placeholderTextColor={colors.textSecondary}
              value={newQuestion.question_text}
              onChangeText={t => setNewQuestion(p => ({ ...p, question_text: t }))}
            />

            {newQuestion.question_type === 'multiple_choice' && (
              <>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Options</Text>
                {newQuestion.options.map((opt, i) => (
                  <View key={i} style={styles.optionInputRow}>
                    <Text style={[styles.optionLabel, { color: colors.textSecondary }]}>{String.fromCharCode(97 + i)}.</Text>
                    <TextInput
                      style={[styles.optionInput, { backgroundColor: colors.inputBg, color: colors.text }]}
                      placeholder={`Option ${String.fromCharCode(97 + i)}`}
                      placeholderTextColor={colors.textSecondary}
                      value={opt.text}
                      onChangeText={t => updateOption(i, t)}
                    />
                    <TouchableOpacity
                      style={[styles.correctToggle, newQuestion.correct_answer === opt.id && { backgroundColor: '#22c55e' }]}
                      onPress={() => setNewQuestion(p => ({ ...p, correct_answer: opt.id }))}
                    >
                      <Ionicons name="checkmark" size={14} color={newQuestion.correct_answer === opt.id ? '#fff' : colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            )}

            {(newQuestion.question_type === 'true_false' || newQuestion.question_type === 'short_answer' || newQuestion.question_type === 'essay') && (
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text }]}
                placeholder="Correct answer"
                placeholderTextColor={colors.textSecondary}
                value={String(newQuestion.correct_answer)}
                onChangeText={t => setNewQuestion(p => ({ ...p, correct_answer: t }))}
              />
            )}

            <View style={styles.row}>
              <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, flex: 1 }]} placeholder="Points" keyboardType="number-pad" placeholderTextColor={colors.textSecondary} value={String(newQuestion.points)} onChangeText={t => setNewQuestion(p => ({ ...p, points: parseInt(t) || 1 }))} />
            </View>

            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, height: 60 }]}
              placeholder="Explanation (shown after grading)"
              multiline
              placeholderTextColor={colors.textSecondary}
              value={newQuestion.explanation}
              onChangeText={t => setNewQuestion(p => ({ ...p, explanation: t }))}
            />

            <View style={styles.row}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={() => setQuestionModal(false)}>
                <Text style={{ color: colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleAddQuestion} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Add Question</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
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
  testCard: { borderRadius: 12, padding: 16, borderWidth: 1, marginBottom: 12 },
  testHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  testTitle: { fontSize: 16, fontWeight: '700' },
  testMeta: { fontSize: 12, marginTop: 4 },
  testActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  actionText: { fontSize: 12, fontWeight: '600' },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  builderHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { marginRight: 12 },
  builderTitle: { fontSize: 18, fontWeight: '700' },
  builderSub: { fontSize: 12, marginTop: 2 },
  addQBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 4 },
  addQText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  questionCard: { borderRadius: 12, padding: 16, borderWidth: 1, marginBottom: 12 },
  questionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  qNumBadge: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  qNumText: { fontWeight: '700', fontSize: 12 },
  questionType: { fontSize: 12 },
  questionText: { fontSize: 15, fontWeight: '600', lineHeight: 22 },
  optionsList: { marginTop: 10, gap: 6 },
  optionRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
  optionText: { flex: 1, fontSize: 14 },
  correctAnswer: { marginTop: 8, fontSize: 13, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modal: { width: '100%', maxWidth: 400, borderRadius: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 8, marginTop: 4 },
  typeSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  typeChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', gap: 6 },
  typeChipText: { fontSize: 12, fontWeight: '600' },
  input: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 12 },
  optionInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  optionLabel: { fontSize: 14, fontWeight: '600', width: 20 },
  optionInput: { flex: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14 },
  correctToggle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: '#e5e7eb' },
  row: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  saveBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '600' },
});
