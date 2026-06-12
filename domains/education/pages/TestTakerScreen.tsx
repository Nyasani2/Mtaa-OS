import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal,
  Alert, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useTestTaker, useStudentTestResults } from '@/domains/education/hooks/useTestQuiz';
import { useStudentIdentity } from '@/domains/education/hooks/useStudentIdentity';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';

export default function TestTakerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { identity } = useStudentIdentity(user?.id);
  const router = useRouter();
  const { colors } = useTheme();

  const {
    test, questions, attempt, answers, currentQuestionIndex, timeLeft,
    loading, error, starting, submitting,
    fetchTest, start, answerQuestion, submit, abandon,
    goNext, goPrev,
  } = useTestTaker(id, identity?.student_id);

  const { results } = useStudentTestResults(identity?.student_id);
  const [currentAnswer, setCurrentAnswer] = useState<string>('');
  const [showResults, setShowResults] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [timerActive, setTimerActive] = useState(false);

  // Timer
  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return;
    const interval = setInterval(() => {
      // timeLeft is managed in hook, this is a visual timer
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  useEffect(() => {
    fetchTest();
  }, [fetchTest]);

  // Loading state
  if (loading && !test) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading test...</Text>
      </SafeAreaView>
    );
  }

  // Error state
  if (error && !test) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={fetchTest}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // No identity
  if (!identity?.student_id) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]}>
        <FontAwesome5 name="id-card" size={48} color={colors.textSecondary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Student Identity Required</Text>
        <Text style={[styles.emptySub, { color: colors.textSecondary }]}>You need a student identity to take tests.</Text>
      </SafeAreaView>
    );
  }

  // No test found
  if (!test) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]}>
        <Ionicons name="document-outline" size={48} color={colors.textSecondary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Test Not Found</Text>
        <Text style={[styles.emptySub, { color: colors.textSecondary }]}>The test may have been removed or you don't have access.</Text>
      </SafeAreaView>
    );
  }

  // Not started yet — show intro screen
  if (!attempt) {
    const alreadyAttempted = results.some(r => r.test_id === test.id);
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView contentContainerStyle={{ padding: 24 }}>
          <View style={[styles.introCard, { backgroundColor: colors.card }]}>
            <View style={[styles.typeBadge, { backgroundColor: '#3b82f620' }]}>
              <Text style={[styles.typeText, { color: '#3b82f6' }]}>{test.test_type}</Text>
            </View>
            <Text style={[styles.introTitle, { color: colors.text }]}>{test.title}</Text>
            {test.description && <Text style={[styles.introDesc, { color: colors.textSecondary }]}>{test.description}</Text>}

            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Ionicons name="time" size={20} color={colors.primary} />
                <Text style={[styles.infoValue, { color: colors.text }]}>{test.duration_minutes} min</Text>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Duration</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="trophy" size={20} color={colors.primary} />
                <Text style={[styles.infoValue, { color: colors.text }]}>{test.total_points} pts</Text>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Total Points</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="refresh" size={20} color={colors.primary} />
                <Text style={[styles.infoValue, { color: colors.text }]}>{test.max_attempts}</Text>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Max Attempts</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                <Text style={[styles.infoValue, { color: colors.text }]}>{test.passing_score}%</Text>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Passing</Text>
              </View>
            </View>

            {test.instructions && (
              <View style={[styles.instructionsBox, { backgroundColor: colors.inputBg }]}>
                <Text style={[styles.instructionsTitle, { color: colors.text }]}>Instructions</Text>
                <Text style={[styles.instructionsText, { color: colors.textSecondary }]}>{test.instructions}</Text>
              </View>
            )}

            {alreadyAttempted && (
              <View style={[styles.warningBox, { backgroundColor: '#f59e0b20' }]}>
                <Ionicons name="warning" size={18} color="#f59e0b" />
                <Text style={[styles.warningText, { color: '#f59e0b' }]}>You have already attempted this test. Additional attempts may be limited.</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.startBtn, { backgroundColor: colors.primary }]} 
              onPress={async () => {
                const { data } = await start();
                if (data) setTimerActive(true);
              }}
              disabled={starting}
            >
              {starting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.startBtnText}>Start Test</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Completed / submitted — show results
  if (attempt.status === 'submitted' || attempt.status === 'graded') {
    const percentage = attempt.percentage || 0;
    const passed = percentage >= (test.passing_score || 50);
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView contentContainerStyle={{ padding: 24 }}>
          <View style={[styles.resultCard, { backgroundColor: colors.card }]}>
            <View style={[styles.resultIcon, { backgroundColor: passed ? '#22c55e20' : '#ef444420' }]}>
              <Ionicons name={passed ? 'checkmark-circle' : 'close-circle'} size={48} color={passed ? '#22c55e' : '#ef4444'} />
            </View>
            <Text style={[styles.resultTitle, { color: colors.text }]}>{passed ? 'Test Completed' : 'Test Completed'}</Text>
            <Text style={[styles.resultSub, { color: passed ? '#22c55e' : '#ef4444' }]}>{passed ? 'You passed!' : 'Below passing score'}</Text>

            <View style={styles.scoreCircle}>
              <Text style={[styles.scoreNumber, { color: colors.text }]}>{Math.round(percentage)}%</Text>
              <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>Score</Text>
            </View>

            <View style={styles.resultStats}>
              <View style={styles.resultStat}>
                <Text style={[styles.resultStatValue, { color: colors.text }]}>{attempt.score || 0}</Text>
                <Text style={[styles.resultStatLabel, { color: colors.textSecondary }]}>Points</Text>
              </View>
              <View style={styles.resultStat}>
                <Text style={[styles.resultStatValue, { color: colors.text }]}>{test.total_points}</Text>
                <Text style={[styles.resultStatLabel, { color: colors.textSecondary }]}>Max</Text>
              </View>
              <View style={styles.resultStat}>
                <Text style={[styles.resultStatValue, { color: colors.text }]}>{Math.round((attempt.time_spent_seconds || 0) / 60)}m</Text>
                <Text style={[styles.resultStatLabel, { color: colors.textSecondary }]}>Time</Text>
              </View>
            </View>

            <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
              <Text style={styles.backBtnText}>Back to Tests</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Active test — question view
  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  const answeredCount = Object.keys(answers).length;

  if (!currentQuestion) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary }}>No questions available.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.testHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.testHeaderTop}>
          <Text style={[styles.testHeaderTitle, { color: colors.text }]} numberOfLines={1}>{test.title}</Text>
          <View style={styles.timerBadge}>
            <Ionicons name="time" size={14} color={timeLeft < 300 ? '#ef4444' : colors.primary} />
            <Text style={[styles.timerText, { color: timeLeft < 300 ? '#ef4444' : colors.primary }]}>
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
            </Text>
          </View>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBar, { width: `${progress}%`, backgroundColor: colors.primary }]} />
        </View>
        <Text style={[styles.progressText, { color: colors.textSecondary }]}>Question {currentQuestionIndex + 1} of {questions.length} · {answeredCount} answered</Text>
      </View>

      {/* Question */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        <View style={[styles.questionCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.questionText, { color: colors.text }]}>{currentQuestion.question_text}</Text>
          {currentQuestion.hint && (
            <Text style={[styles.hintText, { color: colors.textSecondary }]}>Hint: {currentQuestion.hint}</Text>
          )}

          {/* Multiple Choice */}
          {currentQuestion.question_type === 'multiple_choice' && currentQuestion.options && (
            <View style={styles.optionsContainer}>
              {currentQuestion.options.map((opt, i) => {
                const isSelected = answers[currentQuestion.id]?.answer === opt.id;
                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.optionBtn, {
                      backgroundColor: isSelected ? colors.primary + '20' : colors.inputBg,
                      borderColor: isSelected ? colors.primary : colors.border,
                    }]}
                    onPress={() => {
                      answerQuestion(currentQuestion.id, opt.id, 0);
                      setCurrentAnswer(opt.id);
                    }}
                  >
                    <View style={[styles.optionLetter, { backgroundColor: isSelected ? colors.primary : colors.textSecondary + '30' }]}>
                      <Text style={[styles.optionLetterText, { color: isSelected ? '#fff' : colors.textSecondary }]}>{String.fromCharCode(97 + i)}</Text>
                    </View>
                    <Text style={[styles.optionBtnText, { color: colors.text }]}>{opt.text}</Text>
                    {isSelected && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* True/False */}
          {currentQuestion.question_type === 'true_false' && (
            <View style={styles.tfContainer}>
              {['true', 'false'].map(val => {
                const isSelected = answers[currentQuestion.id]?.answer === val;
                return (
                  <TouchableOpacity
                    key={val}
                    style={[styles.tfBtn, {
                      backgroundColor: isSelected ? colors.primary + '20' : colors.inputBg,
                      borderColor: isSelected ? colors.primary : colors.border,
                    }]}
                    onPress={() => {
                      answerQuestion(currentQuestion.id, val, 0);
                      setCurrentAnswer(val);
                    }}
                  >
                    <Text style={[styles.tfBtnText, { color: colors.text }]}>{val === 'true' ? 'True' : 'False'}</Text>
                    {isSelected && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Short Answer / Essay */}
          {(currentQuestion.question_type === 'short_answer' || currentQuestion.question_type === 'essay') && (
            <TextInput
              style={[styles.textAnswer, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
              placeholder="Type your answer here..."
              placeholderTextColor={colors.textSecondary}
              multiline={currentQuestion.question_type === 'essay'}
              numberOfLines={currentQuestion.question_type === 'essay' ? 6 : 2}
              value={String(answers[currentQuestion.id]?.answer || '')}
              onChangeText={t => {
                answerQuestion(currentQuestion.id, t, 0);
                setCurrentAnswer(t);
              }}
            />
          )}
        </View>
      </ScrollView>

      {/* Navigation Footer */}
      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.navBtn, { borderColor: colors.border }, currentQuestionIndex === 0 && { opacity: 0.4 }]}
          onPress={goPrev}
          disabled={currentQuestionIndex === 0}
        >
          <Ionicons name="arrow-back" size={18} color={colors.text} />
          <Text style={[styles.navText, { color: colors.text }]}>Previous</Text>
        </TouchableOpacity>

        {currentQuestionIndex < questions.length - 1 ? (
          <TouchableOpacity style={[styles.navBtn, { backgroundColor: colors.primary }]} onPress={goNext}>
            <Text style={[styles.navText, { color: '#fff' }]}>Next</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.navBtn, { backgroundColor: '#22c55e' }]} onPress={() => setConfirmSubmit(true)}>
            <Text style={[styles.navText, { color: '#fff' }]}>Submit</Text>
            <Ionicons name="checkmark" size={18} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Confirm Submit Modal */}
      <Modal visible={confirmSubmit} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.confirmModal, { backgroundColor: colors.card }]}>
            <Ionicons name="help-circle" size={48} color={colors.primary} />
            <Text style={[styles.confirmTitle, { color: colors.text }]}>Submit Test?</Text>
            <Text style={[styles.confirmSub, { color: colors.textSecondary }]}>
              You have answered {answeredCount} of {questions.length} questions. Unanswered questions will be marked as blank.
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity style={[styles.confirmBtn, { borderColor: colors.border }]} onPress={() => setConfirmSubmit(false)}>
                <Text style={{ color: colors.text }}>Continue</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: '#22c55e' }]}
                onPress={async () => {
                  setConfirmSubmit(false);
                  await submit(attempt.time_spent_seconds + Math.floor((Date.now() - new Date(attempt.started_at).getTime()) / 1000));
                  setTimerActive(false);
                }}
                disabled={submitting}
              >
                {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '600' }}>Submit</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
  introCard: { borderRadius: 16, padding: 24 },
  typeBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginBottom: 12 },
  typeText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  introTitle: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  introDesc: { fontSize: 14, lineHeight: 20, marginBottom: 20 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  infoItem: { flex: 1, minWidth: 80, alignItems: 'center', padding: 12, backgroundColor: '#f3f4f6', borderRadius: 12 },
  infoValue: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  infoLabel: { fontSize: 11, marginTop: 2 },
  instructionsBox: { borderRadius: 12, padding: 16, marginBottom: 16 },
  instructionsTitle: { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  instructionsText: { fontSize: 13, lineHeight: 18 },
  warningBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 12, marginBottom: 16 },
  warningText: { flex: 1, fontSize: 13 },
  startBtn: { paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  startBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  resultCard: { borderRadius: 16, padding: 24, alignItems: 'center' },
  resultIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  resultTitle: { fontSize: 22, fontWeight: '800' },
  resultSub: { fontSize: 16, fontWeight: '600', marginTop: 4 },
  scoreCircle: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center', marginVertical: 20 },
  scoreNumber: { fontSize: 32, fontWeight: '800' },
  scoreLabel: { fontSize: 12, marginTop: 2 },
  resultStats: { flexDirection: 'row', gap: 24, marginBottom: 24 },
  resultStat: { alignItems: 'center' },
  resultStatValue: { fontSize: 18, fontWeight: '700' },
  resultStatLabel: { fontSize: 11, marginTop: 2 },
  backBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  backBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  testHeader: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  testHeaderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  testHeaderTitle: { fontSize: 16, fontWeight: '700', flex: 1 },
  timerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#f3f4f6' },
  timerText: { fontSize: 13, fontWeight: '700' },
  progressBarBg: { height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 2 },
  progressText: { fontSize: 11, marginTop: 6 },
  questionCard: { borderRadius: 16, padding: 20 },
  questionText: { fontSize: 17, fontWeight: '600', lineHeight: 24, marginBottom: 16 },
  hintText: { fontSize: 12, fontStyle: 'italic', marginBottom: 12 },
  optionsContainer: { gap: 10 },
  optionBtn: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, gap: 12 },
  optionLetter: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  optionLetterText: { fontSize: 12, fontWeight: '700' },
  optionBtnText: { flex: 1, fontSize: 15 },
  tfContainer: { flexDirection: 'row', gap: 12 },
  tfBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, borderWidth: 1, gap: 8 },
  tfBtnText: { fontSize: 15, fontWeight: '600' },
  textAnswer: { borderRadius: 12, padding: 14, fontSize: 15, borderWidth: 1, textAlignVertical: 'top' },
  footer: { flexDirection: 'row', padding: 16, gap: 12, borderTopWidth: 1 },
  navBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1, gap: 8 },
  navText: { fontSize: 15, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  confirmModal: { width: '100%', maxWidth: 340, borderRadius: 16, padding: 24, alignItems: 'center' },
  confirmTitle: { fontSize: 18, fontWeight: '700', marginTop: 12 },
  confirmSub: { fontSize: 13, textAlign: 'center', marginTop: 8, marginBottom: 20 },
  confirmActions: { flexDirection: 'row', gap: 12, width: '100%' },
  confirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1 },
});
