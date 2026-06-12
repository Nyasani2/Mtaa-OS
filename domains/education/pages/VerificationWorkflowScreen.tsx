import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useInstitutionProfile, useVerificationWorkflow, useInstitutionDocuments } from '@/domains/education/hooks/useInstitutionProfile';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const VERIFICATION_STEPS = [
  { step: 'registration_submitted', label: 'Registration Submitted', icon: 'document-text', description: 'Basic institution details submitted' },
  { step: 'documents_received', label: 'Documents Received', icon: 'folder-open', description: 'Required documents uploaded and received' },
  { step: 'site_inspection_scheduled', label: 'Site Inspection Scheduled', icon: 'calendar', description: 'Physical site visit scheduled by ministry' },
  { step: 'site_inspection_completed', label: 'Site Inspection Completed', icon: 'checkmark-done', description: 'Inspector has visited and filed report' },
  { step: 'ministry_review', label: 'Ministry Review', icon: 'shield', description: 'Final review by ministry officers' },
  { step: 'approved', label: 'Approved', icon: 'checkmark-circle', description: 'Institution verified and approved' },
];

export default function VerificationWorkflowScreen() {
  const { institutionId } = useLocalSearchParams<{ institutionId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { profile, isAdmin } = useInstitutionProfile(institutionId);
  const { logs, currentStep, isComplete, loading, error, submitStep, completeStep, rejectStep, submitting, refresh } = useVerificationWorkflow(institutionId);
  const { documents, uploadDocument } = useInstitutionDocuments(institutionId);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  // ─── LOADING STATE ───
  if (loading && logs.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading verification workflow...</Text>
      </View>
    );
  }

  // ─── ERROR STATE ───
  if (error && logs.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text style={styles.errorTitle}>Failed to Load Workflow</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── HANDLE SUBMIT STEP ───
  const handleSubmitStep = async (stepData: typeof VERIFICATION_STEPS[0]) => {
    try {
      await submitStep({
        step: stepData.step,
        step_number: VERIFICATION_STEPS.findIndex(s => s.step === stepData.step) + 1,
        status: 'pending',
        actor_id: user?.id,
        actor_role: isAdmin ? 'school_admin' : 'it_teacher',
        actor_name: user?.user_metadata?.full_name || 'Unknown',
      });
      Alert.alert('Success', `${stepData.label} submitted successfully`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit step');
    }
  };

  // ─── HANDLE COMPLETE STEP ───
  const handleCompleteStep = async (logId: string) => {
    try {
      await completeStep(logId, {
        actor_id: user?.id,
        actor_role: isAdmin ? 'school_admin' : 'ministry_officer',
        actor_name: user?.user_metadata?.full_name || 'Unknown',
      });
      Alert.alert('Success', 'Step marked as completed');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to complete step');
    }
  };

  // ─── HANDLE REJECT ───
  const handleReject = async () => {
    if (!selectedLogId || !rejectionReason.trim()) {
      Alert.alert('Error', 'Please provide a rejection reason');
      return;
    }
    try {
      await rejectStep(selectedLogId, rejectionReason);
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedLogId(null);
      Alert.alert('Rejected', 'Step has been rejected with reason recorded');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to reject step');
    }
  };

  // ─── GET STEP STATUS ───
  const getStepStatus = (step: string) => {
    const log = logs.find(l => l.step === step);
    if (!log) return 'not_started';
    return log.status;
  };

  // ─── MAIN RENDER ───
  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={false} onRefresh={refresh} colors={['#2563EB']} />
      }
    >
      {/* ─── HEADER ─── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Verification Workflow</Text>
        <Text style={styles.headerSubtitle}>{profile?.institution?.name}</Text>
        <View style={[styles.statusBanner, {
          backgroundColor: isComplete ? '#ECFDF5' : currentStep ? '#FEF3C7' : '#F3F4F6'
        }]}>
          <Ionicons
            name={isComplete ? 'checkmark-circle' : currentStep ? 'time' : 'ellipse'}
            size={20}
            color={isComplete ? '#10B981' : currentStep ? '#D97706' : '#9CA3AF'}
          />
          <Text style={[styles.statusBannerText, {
            color: isComplete ? '#059669' : currentStep ? '#D97706' : '#6B7280'
          }]}>
            {isComplete ? 'Verification Complete' : currentStep ? `Current: ${currentStep.step.replace(/_/g, ' ')}` : 'Not Started'}
          </Text>
        </View>
      </View>

      {/* ─── PROGRESS BAR ─── */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBar, {
            width: `${isComplete ? 100 : ((VERIFICATION_STEPS.findIndex(s => s.step === currentStep?.step) + 1) / VERIFICATION_STEPS.length) * 100}%`
          }]} />
        </View>
        <Text style={styles.progressText}>
          {isComplete ? '6 of 6 steps complete' : `${VERIFICATION_STEPS.findIndex(s => s.step === currentStep?.step) + 1} of 6 steps`}
        </Text>
      </View>

      {/* ─── STEPS TIMELINE ─── */}
      <View style={styles.timelineContainer}>
        {VERIFICATION_STEPS.map((stepData, index) => {
          const status = getStepStatus(stepData.step);
          const log = logs.find(l => l.step === stepData.step);
          const isCurrent = currentStep?.step === stepData.step;

          return (
            <View key={stepData.step} style={styles.timelineItem}>
              {/* Connector line */}
              {index < VERIFICATION_STEPS.length - 1 && (
                <View style={[styles.connector, {
                  backgroundColor: status === 'completed' ? '#10B981' : '#E5E7EB'
                }]} />
              )}

              {/* Step circle */}
              <View style={[styles.stepCircle, {
                backgroundColor: status === 'completed' ? '#10B981' :
                  status === 'failed' ? '#EF4444' :
                  isCurrent ? '#2563EB' : '#E5E7EB',
              }]}>
                <Ionicons
                  name={status === 'completed' ? 'checkmark' :
                    status === 'failed' ? 'close' :
                    stepData.icon as any}
                  size={16}
                  color={status === 'not_started' && !isCurrent ? '#9CA3AF' : '#FFF'}
                />
              </View>

              {/* Step content */}
              <View style={styles.stepContent}>
                <View style={styles.stepHeader}>
                  <Text style={[styles.stepLabel, {
                    color: status === 'completed' ? '#059669' :
                      status === 'failed' ? '#DC2626' :
                      isCurrent ? '#2563EB' : '#374151'
                  }]}>
                    {stepData.label}
                  </Text>
                  <View style={[styles.stepStatusBadge, {
                    backgroundColor: status === 'completed' ? '#ECFDF5' :
                      status === 'failed' ? '#FEE2E2' :
                      isCurrent ? '#DBEAFE' : '#F3F4F6'
                  }]}>
                    <Text style={[styles.stepStatusText, {
                      color: status === 'completed' ? '#059669' :
                        status === 'failed' ? '#DC2626' :
                        isCurrent ? '#2563EB' : '#6B7280'
                    }]}>
                      {status === 'not_started' ? 'Not Started' : status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.stepDescription}>{stepData.description}</Text>

                {/* Log details */}
                {log && (
                  <View style={styles.logDetails}>
                    <Text style={styles.logMeta}>
                      By {log.actor_name || 'Unknown'} • {new Date(log.created_at).toLocaleDateString()}
                    </Text>
                    {log.notes && <Text style={styles.logNotes}>Notes: {log.notes}</Text>}
                    {log.rejection_reason && (
                      <View style={styles.rejectionBox}>
                        <Ionicons name="warning" size={14} color="#DC2626" />
                        <Text style={styles.rejectionText}>{log.rejection_reason}</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Action buttons */}
                {isCurrent && isAdmin && status !== 'completed' && status !== 'failed' && (
                  <View style={styles.stepActions}>
                    <TouchableOpacity
                      style={styles.completeButton}
                      onPress={() => handleCompleteStep(log!.id)}
                      disabled={submitting}
                    >
                      <Ionicons name="checkmark" size={16} color="#FFF" />
                      <Text style={styles.completeButtonText}>Mark Complete</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectButton}
                      onPress={() => { setSelectedLogId(log!.id); setShowRejectModal(true); }}
                      disabled={submitting}
                    >
                      <Ionicons name="close" size={16} color="#DC2626" />
                      <Text style={styles.rejectButtonText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Submit button for next step */}
                {isAdmin && status === 'not_started' && (
                  <TouchableOpacity
                    style={styles.submitStepButton}
                    onPress={() => handleSubmitStep(stepData)}
                    disabled={submitting}
                  >
                    <Ionicons name="arrow-up-circle" size={16} color="#2563EB" />
                    <Text style={styles.submitStepButtonText}>Submit This Step</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* ─── DOCUMENTS SECTION ─── */}
      <View style={styles.documentsSection}>
        <Text style={styles.documentsTitle}>Submitted Documents</Text>
        {documents.length === 0 ? (
          <View style={styles.emptyDocuments}>
            <Ionicons name="document-outline" size={32} color="#9CA3AF" />
            <Text style={styles.emptyDocumentsText}>No documents submitted yet</Text>
          </View>
        ) : (
          documents.map((doc: any, i: number) => (
            <View key={i} style={styles.documentRow}>
              <View style={[styles.documentIcon, {
                backgroundColor: doc.verification_status === 'approved' ? '#ECFDF5' :
                  doc.verification_status === 'rejected' ? '#FEE2E2' : '#FEF3C7'
              }]}>
                <Ionicons
                  name={doc.verification_status === 'approved' ? 'checkmark' :
                    doc.verification_status === 'rejected' ? 'close' : 'time'}
                  size={16}
                  color={doc.verification_status === 'approved' ? '#10B981' :
                    doc.verification_status === 'rejected' ? '#EF4444' : '#D97706'}
                />
              </View>
              <View style={styles.documentInfo}>
                <Text style={styles.documentName}>{doc.document_name}</Text>
                <Text style={styles.documentMeta}>{doc.document_type} • {doc.verification_status}</Text>
              </View>
              <TouchableOpacity onPress={() => Alert.alert('Document', doc.file_url)}>
                <Ionicons name="eye-outline" size={20} color="#2563EB" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* ─── REJECTION MODAL ─── */}
      {showRejectModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reject Step</Text>
            <Text style={styles.modalSubtitle}>Please provide a reason for rejection:</Text>
            <TextInput
              style={styles.modalInput}
              multiline
              numberOfLines={4}
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChangeText={setRejectionReason}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowRejectModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleReject}>
                <Text style={styles.modalConfirmText}>Confirm Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

// ─── STYLES ───

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#F3F4F6' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#6B7280' },
  errorTitle: { marginTop: 16, fontSize: 18, fontWeight: '700', color: '#1F2937' },
  errorText: { marginTop: 8, fontSize: 14, color: '#6B7280', textAlign: 'center' },
  retryButton: { marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#2563EB', borderRadius: 8 },
  retryButtonText: { color: '#FFF', fontWeight: '600', fontSize: 14 },

  header: { padding: 16, backgroundColor: '#FFF', marginBottom: 8 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937' },
  headerSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  statusBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, padding: 10, borderRadius: 8 },
  statusBannerText: { fontSize: 14, fontWeight: '600' },

  progressContainer: { padding: 16, backgroundColor: '#FFF', marginBottom: 8 },
  progressBarBg: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: '#10B981', borderRadius: 4 },
  progressText: { fontSize: 12, color: '#6B7280', marginTop: 8, textAlign: 'right' },

  timelineContainer: { padding: 16 },
  timelineItem: { flexDirection: 'row', marginBottom: 20 },
  connector: { position: 'absolute', left: 15, top: 32, width: 2, height: '100%', zIndex: 0 },
  stepCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 12, zIndex: 1 },
  stepContent: { flex: 1, backgroundColor: '#FFF', borderRadius: 12, padding: 12 },
  stepHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  stepLabel: { fontSize: 14, fontWeight: '700' },
  stepStatusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  stepStatusText: { fontSize: 10, fontWeight: '600' },
  stepDescription: { fontSize: 12, color: '#6B7280', marginBottom: 8 },

  logDetails: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  logMeta: { fontSize: 11, color: '#9CA3AF' },
  logNotes: { fontSize: 12, color: '#4B5563', marginTop: 4 },
  rejectionBox: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, padding: 8, backgroundColor: '#FEE2E2', borderRadius: 6 },
  rejectionText: { flex: 1, fontSize: 12, color: '#DC2626' },

  stepActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  completeButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#10B981', borderRadius: 6 },
  completeButtonText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  rejectButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#FEE2E2', borderRadius: 6 },
  rejectButtonText: { color: '#DC2626', fontSize: 12, fontWeight: '600' },
  submitStepButton: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingVertical: 8 },
  submitStepButtonText: { color: '#2563EB', fontSize: 13, fontWeight: '600' },

  documentsSection: { backgroundColor: '#FFF', margin: 16, padding: 16, borderRadius: 12, marginBottom: 24 },
  documentsTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 12 },
  emptyDocuments: { alignItems: 'center', paddingVertical: 24 },
  emptyDocumentsText: { fontSize: 14, color: '#9CA3AF', marginTop: 8 },
  documentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  documentIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  documentInfo: { flex: 1 },
  documentName: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  documentMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24, zIndex: 100 },
  modalContent: { width: '100%', backgroundColor: '#FFF', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  modalSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 4, marginBottom: 12 },
  modalInput: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, fontSize: 14, color: '#1F2937', minHeight: 80, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  modalCancel: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 8 },
  modalCancelText: { color: '#6B7280', fontWeight: '600' },
  modalConfirm: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: '#EF4444', borderRadius: 8 },
  modalConfirmText: { color: '#FFF', fontWeight: '600' },
});
