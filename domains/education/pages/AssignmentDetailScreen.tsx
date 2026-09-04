import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator, RefreshControl, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useAssignmentDetail } from '@/domains/education/hooks/useAssignmentEngine';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';

export default function AssignmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { assignment, submissions, stats, loading, error, grading, returning, fetch, grade, returnSub } = useAssignmentDetail(id);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'overview' | 'submissions' | 'stats'>('overview');
  const [gradeModal, setGradeModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
  const [gradeInput, setGradeInput] = useState({ score: '', feedback: '' });

  // Loading state
  if (loading && !assignment) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading assignment...</Text>
      </View>
    );
  }

  // Error state
  if (error && !assignment) {
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

  // Empty / not found
  if (!assignment) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Ionicons name="document-outline" size={48} color={colors.textSecondary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Assignment Not Found</Text>
        <Text style={[styles.emptySub, { color: colors.textSecondary }]}>The assignment may have been deleted or you don't have access.</Text>
      </View>
    );
  }

  const isOverdue = assignment.due_date ? new Date(assignment.due_date) < new Date() : false;
  const statusColor = assignment.status === 'published' ? '#22c55e' : assignment.status === 'draft' ? '#6b7280' : assignment.status === 'closed' ? '#ef4444' : '#9ca3af';

  const handleGrade = async () => {
    if (!selectedSubmission || !gradeInput.score) return;
    const score = parseInt(gradeInput.score);
    if (isNaN(score) || score < 0 || score > (assignment.max_score || 100)) {
      Alert.alert('Invalid Score', `Score must be between 0 and ${assignment.max_score || 100}`);
      return;
    }
    if (!user?.id) return;
    await grade({
      submission_id: selectedSubmission,
      score,
      feedback: gradeInput.feedback.trim() || undefined,
      graded_by: user.id,
    });
    setGradeModal(false);
    setSelectedSubmission(null);
    setGradeInput({ score: '', feedback: '' });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <View style={[styles.typeBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.typeText, { color: statusColor }]}>{assignment.assignment_type}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{assignment.status}</Text>
          </View>
        </View>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{assignment.title}</Text>
        <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{assignment.class?.name || 'No class'} · {assignment.subject?.name || 'No subject'}</Text>
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {(['overview', 'submissions', 'stats'] as const).map((tab: any) => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, { color: activeTab === tab ? colors.primary : colors.textSecondary }]}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={fetch} />} contentContainerStyle={{ padding: 16 }}>
          <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Details</Text>
            <View style={styles.infoRow}>
              <Ionicons name="create" size={18} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Description</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{assignment.description || 'No description'}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="list" size={18} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Instructions</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{assignment.instructions || 'No instructions'}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="trophy" size={18} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Max Score</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{assignment.max_score} points (Pass: {assignment.passing_score})</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="calendar" size={18} color={isOverdue ? '#ef4444' : colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Due Date</Text>
                <Text style={[styles.infoValue, { color: isOverdue ? '#ef4444' : colors.text }]}>
                  {assignment.due_date ? new Date(assignment.due_date).toLocaleString() : 'No due date'}
                  {isOverdue && ' (Overdue)'}
                </Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="time" size={18} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Late Submissions</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{assignment.allow_late_submission ? `Allowed (-${assignment.late_penalty_percent}%)` : 'Not allowed'}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="person" size={18} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Created By</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{assignment.teacher?.full_name || 'Unknown'}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Submissions Tab */}
      {activeTab === 'submissions' && (
        <View style={{ flex: 1 }}>
          {submissions.length === 0 ? (
            <View style={styles.center}>
              <FontAwesome5 name="inbox" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Submissions Yet</Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Students haven't submitted anything for this assignment.</Text>
            </View>
          ) : (
            <FlatList
              data={submissions}
              keyExtractor={item => item.id}
              refreshControl={<RefreshControl refreshing={loading} onRefresh={fetch} />}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => (
                <View style={[styles.submissionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.submissionHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.submissionName, { color: colors.text }]}>{item.student?.full_name || 'Unknown Student'}</Text>
                      <Text style={[styles.submissionMeta, { color: colors.textSecondary }]}>{item.student?.student_number || 'No ID'} · {new Date(item.submitted_at).toLocaleString()}</Text>
                    </View>
                    <View style={[styles.subStatusBadge, {
                      backgroundColor: item.status === 'graded' ? '#22c55e20' : item.status === 'submitted' ? '#3b82f620' : item.status === 'late' ? '#f59e0b20' : '#6b728020'
                    }]}>
                      <Text style={[styles.subStatusText, {
                        color: item.status === 'graded' ? '#22c55e' : item.status === 'submitted' ? '#3b82f6' : item.status === 'late' ? '#f59e0b' : '#6b7280'
                      }]}>{item.status}</Text>
                    </View>
                  </View>

                  {item.submission_text && (
                    <Text style={[styles.submissionText, { color: colors.textSecondary }]} numberOfLines={3}>{item.submission_text}</Text>
                  )}

                  {item.score !== null && (
                    <View style={styles.scoreRow}>
                      <Text style={[styles.scoreText, { color: colors.primary }]}>Score: {item.score}/{assignment.max_score}</Text>
                      {item.feedback && <Text style={[styles.feedbackText, { color: colors.textSecondary }]}>Feedback: {item.feedback}</Text>}
                    </View>
                  )}

                  <View style={styles.submissionActions}>
                    {item.status !== 'graded' && item.status !== 'returned' && (
                      <TouchableOpacity style={[styles.gradeBtn, { backgroundColor: colors.primary }]} onPress={() => { setSelectedSubmission(item.id); setGradeModal(true); }}>
                        <Ionicons name="checkmark-circle" size={16} color="#fff" />
                        <Text style={styles.gradeBtnText}>Grade</Text>
                      </TouchableOpacity>
                    )}
                    {item.status === 'graded' && (
                      <TouchableOpacity style={[styles.gradeBtn, { backgroundColor: '#22c55e' }]} onPress={() => returnSub(item.id)} disabled={returning}>
                        <Ionicons name="return-down-back" size={16} color="#fff" />
                        <Text style={styles.gradeBtnText}>{returning ? 'Returning...' : 'Return'}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            />
          )}
        </View>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={fetch} />} contentContainerStyle={{ padding: 16 }}>
          <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Submission Stats</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: colors.primary }]}>{stats?.total_submissions || 0}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: '#22c55e' }]}>{stats?.graded || 0}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Graded</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: '#3b82f6' }]}>{stats?.pending || 0}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: '#f59e0b' }]}>{stats?.late || 0}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Late</Text>
              </View>
            </View>
            <View style={styles.scoreStats}>
              <View style={styles.scoreStatRow}>
                <Text style={[styles.scoreStatLabel, { color: colors.textSecondary }]}>Average Score</Text>
                <Text style={[styles.scoreStatValue, { color: colors.text }]}>{stats?.average_score || 0}</Text>
              </View>
              <View style={styles.scoreStatRow}>
                <Text style={[styles.scoreStatLabel, { color: colors.textSecondary }]}>Highest Score</Text>
                <Text style={[styles.scoreStatValue, { color: colors.text }]}>{stats?.highest_score || 0}</Text>
              </View>
              <View style={styles.scoreStatRow}>
                <Text style={[styles.scoreStatLabel, { color: colors.textSecondary }]}>Lowest Score</Text>
                <Text style={[styles.scoreStatValue, { color: colors.text }]}>{stats?.lowest_score || 0}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Grade Modal */}
      <Modal visible={gradeModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Grade Submission</Text>
            <Text style={[styles.modalSub, { color: colors.textSecondary }]}>Max score: {assignment.max_score}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text }]}
              placeholder="Score"
              keyboardType="number-pad"
              placeholderTextColor={colors.textSecondary}
              value={gradeInput.score}
              onChangeText={t => setGradeInput(p => ({ ...p, score: t }))}
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, height: 80 }]}
              placeholder="Feedback (optional)"
              multiline
              placeholderTextColor={colors.textSecondary}
              value={gradeInput.feedback}
              onChangeText={t => setGradeInput(p => ({ ...p, feedback: t }))}
            />
            <View style={styles.row}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={() => { setGradeModal(false); setSelectedSubmission(null); setGradeInput({ score: '', feedback: '' }); }}>
                <Text style={{ color: colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleGrade} disabled={grading}>
                {grading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Submit Grade</Text>}
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
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTop: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  headerSub: { fontSize: 13, marginTop: 2 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabText: { fontSize: 14, fontWeight: '600' },
  infoCard: { borderRadius: 16, padding: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  infoLabel: { fontSize: 12 },
  infoValue: { fontSize: 14, fontWeight: '500', marginTop: 2 },
  submissionCard: { borderRadius: 12, padding: 16, borderWidth: 1, marginBottom: 12 },
  submissionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  submissionName: { fontSize: 15, fontWeight: '700' },
  submissionMeta: { fontSize: 12, marginTop: 2 },
  subStatusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  subStatusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  submissionText: { marginTop: 10, fontSize: 13, lineHeight: 18 },
  scoreRow: { marginTop: 10, padding: 10, backgroundColor: '#f3f4f6', borderRadius: 8 },
  scoreText: { fontSize: 14, fontWeight: '700' },
  feedbackText: { fontSize: 12, marginTop: 4 },
  submissionActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  gradeBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, gap: 6 },
  gradeBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  statsCard: { borderRadius: 16, padding: 16 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  statBox: { alignItems: 'center', flex: 1 },
  statNumber: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, marginTop: 2 },
  scoreStats: { borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 12 },
  scoreStatRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  scoreStatLabel: { fontSize: 14 },
  scoreStatValue: { fontSize: 14, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modal: { width: '100%', maxWidth: 400, borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  modalSub: { fontSize: 12, marginBottom: 16 },
  input: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 12 },
  row: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  saveBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '600' },
});
