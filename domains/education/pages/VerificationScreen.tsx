import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';

interface VerificationDoc {
  id: string;
  doc_type: string;
  doc_url: string;
  status: 'pending' | 'approved' | 'rejected';
  uploaded_at: string;
  reviewed_at?: string;
  review_notes?: string;
}

const DOC_TYPES = [
  { value: 'id_document', label: 'National ID / Passport', icon: 'card' },
  { value: 'teaching_certificate', label: 'Teaching Certificate', icon: 'school' },
  { value: 'degree_certificate', label: 'Degree Certificate', icon: 'document-text' },
  { value: 'background_check', label: 'Background Check', icon: 'shield-checkmark' },
  { value: 'reference_letter', label: 'Reference Letter', icon: 'mail' },
];

export default function VerificationScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [teacherData, setTeacherData] = useState<any>(null);
  const [documents, setDocuments] = useState<VerificationDoc[]>([]);
  const [selectedDocType, setSelectedDocType] = useState('id_document');
  const [docUrl, setDocUrl] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<string>('unverified');

  useEffect(() => {
    fetchTeacherData();
  }, []);

  const fetchTeacherData = async () => {
    try {
      const { data, error } = await supabase
        .from('education_teachers')
        .select('id, verification_status, full_name, institution_id, verification_submitted_at, verification_reviewed_at')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setTeacherData(data);
      setVerificationStatus(data?.verification_status || 'unverified');

      // Fetch uploaded documents
      const { data: docs } = await supabase
        .from('education_teacher_documents')
        .select('id, doc_type, doc_url, status, uploaded_at, reviewed_at, review_notes')
        .eq('teacher_id', data?.id)
        .order('uploaded_at', { ascending: false });

      setDocuments(docs || []);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to load verification data');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocument = async () => {
    if (!docUrl.trim()) {
      Alert.alert('Error', 'Please provide a document URL');
      return;
    }
    if (!teacherData?.id) {
      Alert.alert('Error', 'Teacher profile not found');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('education_teacher_documents').insert({
        teacher_id: teacherData.id,
        doc_type: selectedDocType,
        doc_url: docUrl.trim(),
        status: 'pending',
        uploaded_at: new Date().toISOString(),
      });

      if (error) throw error;

      // Update teacher verification status to pending if not already
      if (verificationStatus === 'unverified') {
        await supabase
          .from('education_teachers')
          .update({
            verification_status: 'pending',
            verification_submitted_at: new Date().toISOString(),
          })
          .eq('id', teacherData.id);
        setVerificationStatus('pending');
      }

      Alert.alert('Success', 'Document uploaded successfully. Awaiting review.');
      setDocUrl('');
      fetchTeacherData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to upload document');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!teacherData?.id) return;
    if (documents.length === 0) {
      Alert.alert('Error', 'Please upload at least one verification document');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('education_teachers')
        .update({
          verification_status: 'pending',
          verification_submitted_at: new Date().toISOString(),
        })
        .eq('id', teacherData.id);

      if (error) throw error;
      setVerificationStatus('pending');
      Alert.alert('Submitted', 'Your verification request has been submitted for review.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return '#059669';
      case 'pending': return '#D97706';
      case 'rejected': return '#DC2626';
      default: return '#9CA3AF';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'verified': return '#ECFDF5';
      case 'pending': return '#FEF3C7';
      case 'rejected': return '#FEE2E2';
      default: return '#F3F4F6';
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
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 40 }}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Teacher Verification</Text>
        <Text style={[styles.headerSub, { color: colors.textSecondary }]}>Complete verification to publish content</Text>
      </View>

      {/* Status Banner */}
      <View style={[styles.statusBanner, { backgroundColor: getStatusBg(verificationStatus) }]}>
        <Ionicons
          name={verificationStatus === 'verified' ? 'checkmark-circle' : verificationStatus === 'pending' ? 'time' : 'alert-circle'}
          size={24}
          color={getStatusColor(verificationStatus)}
        />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.statusTitle, { color: getStatusColor(verificationStatus) }]}>
            Status: {verificationStatus.charAt(0).toUpperCase() + verificationStatus.slice(1)}
          </Text>
          <Text style={[styles.statusDesc, { color: getStatusColor(verificationStatus) }]}>
            {verificationStatus === 'verified'
              ? 'You are verified and can publish educational content.'
              : verificationStatus === 'pending'
              ? 'Your documents are under review. This may take 1-3 business days.'
              : 'Please upload the required documents to verify your teacher account.'}
          </Text>
        </View>
      </View>

      {/* Required Documents */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Required Documents</Text>
        {DOC_TYPES.map(doc => {
          const uploaded = documents.filter(d => d.doc_type === doc.value);
          const hasApproved = uploaded.some(d => d.status === 'approved');
          return (
            <View key={doc.value} style={[styles.docItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.docHeader}>
                <Ionicons name={doc.icon as any} size={20} color={hasApproved ? '#059669' : colors.textSecondary} />
                <Text style={[styles.docLabel, { color: colors.text }]}>{doc.label}</Text>
                {hasApproved && <Ionicons name="checkmark-circle" size={18} color="#059669" />}
                {uploaded.length > 0 && !hasApproved && <Ionicons name="time" size={18} color="#D97706" />}
              </View>
              {uploaded.map(u => (
                <View key={u.id} style={styles.docUpload}>
                  <Text style={[styles.docUrl, { color: colors.textSecondary }]} numberOfLines={1}>{u.doc_url}</Text>
                  <View style={[styles.docStatus, { backgroundColor: getStatusBg(u.status) }]}>
                    <Text style={[styles.docStatusText, { color: getStatusColor(u.status) }]}>{u.status}</Text>
                  </View>
                </View>
              ))}
            </View>
          );
        })}
      </View>

      {/* Upload Section */}
      {verificationStatus !== 'verified' && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Upload Document</Text>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Document Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 12 }}>
            {DOC_TYPES.map(doc => (
              <TouchableOpacity
                key={doc.value}
                style={[styles.typeChip, selectedDocType === doc.value && { backgroundColor: colors.primary }]}
                onPress={() => setSelectedDocType(doc.value)}
              >
                <Text style={[styles.typeChipText, { color: selectedDocType === doc.value ? '#fff' : colors.text }]}>{doc.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.label, { color: colors.textSecondary }]}>Document URL</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
            placeholder="https://..."
            placeholderTextColor={colors.textSecondary}
            value={docUrl}
            onChangeText={setDocUrl}
          />

          <TouchableOpacity
            style={[styles.uploadBtn, { backgroundColor: colors.primary }]}
            onPress={handleUploadDocument}
            disabled={submitting}
          >
            {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.uploadBtnText}>Upload Document</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: documents.length > 0 ? '#059669' : '#9CA3AF' }]}
            onPress={handleSubmitForReview}
            disabled={submitting || documents.length === 0}
          >
            <Text style={styles.submitBtnText}>Submit for Review</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  headerSub: { fontSize: 13, marginTop: 2 },
  statusBanner: { flexDirection: 'row', alignItems: 'center', margin: 16, padding: 16, borderRadius: 16 },
  statusTitle: { fontSize: 15, fontWeight: '700' },
  statusDesc: { fontSize: 12, marginTop: 4, lineHeight: 18 },
  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  docItem: { borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1 },
  docHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  docLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
  docUpload: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  docUrl: { flex: 1, fontSize: 12 },
  docStatus: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  docStatusText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6' },
  typeChipText: { fontSize: 12, fontWeight: '600' },
  input: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, borderWidth: 1, marginBottom: 12 },
  uploadBtn: { paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginBottom: 10 },
  uploadBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  submitBtn: { paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
