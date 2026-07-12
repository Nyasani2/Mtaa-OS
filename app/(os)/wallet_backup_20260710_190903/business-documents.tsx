import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/useAuthStore';
import { supabase } from '@/lib/supabase';

interface BusinessDoc {
  id: string;
  business_id: string;
  doc_type: string;
  file_name: string;
  file_url: string;
  status: 'pending' | 'verified' | 'rejected';
  uploaded_at: string;
  verified_at: string | null;
  notes: string | null;
}

const DOC_TYPES = [
  { key: 'registration_certificate', label: 'Registration Certificate', icon: 'file-document' },
  { key: 'tax_compliance', label: 'Tax Compliance Certificate', icon: 'file-check' },
  { key: 'business_permit', label: 'Business Permit / License', icon: 'store' },
  { key: 'id_proof', label: 'Owner ID / Passport', icon: 'card-account-details' },
  { key: 'bank_statement', label: 'Bank Statement (3 months)', icon: 'bank' },
  { key: 'utility_bill', label: 'Utility Bill (Proof of Address)', icon: 'lightning-bolt' },
];

export default function BusinessDocumentsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [selectedBiz, setSelectedBiz] = useState<string>('');
  const [documents, setDocuments] = useState<BusinessDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    loadBusinesses();
  }, []);

  useEffect(() => {
    if (selectedBiz) loadDocuments(selectedBiz);
  }, [selectedBiz]);

  const loadBusinesses = async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('business_profiles')
      .select('id, name')
      .eq('owner_id', user.id);
    if (data) {
      setBusinesses(data);
      if (data.length > 0) setSelectedBiz(data[0].id);
    }
    setLoading(false);
  };

  const loadDocuments = async (bizId: string) => {
    const { data } = await supabase
      .from('business_documents')
      .select('*')
      .eq('business_id', bizId)
      .order('uploaded_at', { ascending: false });
    if (data) setDocuments(data);
  };

  const getDocStatus = (docType: string) => {
    const doc = documents.find((d) => d.doc_type === docType);
    if (!doc) return { status: 'missing', color: '#6B7280', label: 'Not Uploaded' };
    if (doc.status === 'verified') return { status: 'verified', color: '#22C55E', label: 'Verified' };
    if (doc.status === 'rejected') return { status: 'rejected', color: '#EF4444', label: 'Rejected' };
    return { status: 'pending', color: '#F59E0B', label: 'Pending Review' };
  };

  const handleUpload = async (docType: string) => {
    Alert.alert(
      'Upload Document',
      `Upload your ${DOC_TYPES.find((d) => d.key === docType)?.label}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Simulate Upload',
          onPress: async () => {
            setUploading(docType);
            // Simulate upload delay
            await new Promise((r) => setTimeout(r, 1500));

            const { error } = await supabase.from('business_documents').insert({
              business_id: selectedBiz,
              doc_type: docType,
              file_name: `${docType}_document.pdf`,
              file_url: `https://storage.mtaa.africa/business_docs/${selectedBiz}/${docType}.pdf`,
              status: 'pending',
              notes: null,
            });

            setUploading(null);
            if (error) {
              Alert.alert('Upload Failed', error.message);
            } else {
              Alert.alert('Uploaded', 'Document submitted for review.');
              loadDocuments(selectedBiz);
            }
          },
        },
      ]
    );
  };

  const getProgress = () => {
    const uploaded = DOC_TYPES.filter((dt) => {
      const doc = documents.find((d) => d.doc_type === dt.key);
      return doc && doc.status !== 'rejected';
    }).length;
    return { uploaded, total: DOC_TYPES.length, pct: Math.round((uploaded / DOC_TYPES.length) * 100) };
  };

  const progress = getProgress();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Business Documents</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Business Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Business</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bizScroll}>
            {businesses.map((biz) => (
              <TouchableOpacity
                key={biz.id}
                style={[styles.bizChip, selectedBiz === biz.id && styles.bizChipActive]}
                onPress={() => setSelectedBiz(biz.id)}
              >
                <Text style={[styles.bizChipText, selectedBiz === biz.id && styles.bizChipTextActive]}>
                  {biz.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Progress */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Document Completion</Text>
            <Text style={styles.progressPct}>{progress.pct}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progress.pct}%` }]} />
          </View>
          <Text style={styles.progressSub}>{progress.uploaded} of {progress.total} documents uploaded</Text>
        </View>

        {/* Document List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Required Documents</Text>
          {DOC_TYPES.map((dt) => {
            const docStatus = getDocStatus(dt.key);
            const isUploading = uploading === dt.key;

            return (
              <View key={dt.key} style={styles.docCard}>
                <View style={styles.docLeft}>
                  <View style={[styles.docIcon, { backgroundColor: docStatus.color + '15' }]}>
                    <MaterialCommunityIcons name={dt.icon as any} size={22} color={docStatus.color} />
                  </View>
                  <View style={styles.docInfo}>
                    <Text style={styles.docName}>{dt.label}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: docStatus.color + '20' }]}>
                      <Text style={[styles.statusText, { color: docStatus.color }]}>{docStatus.label}</Text>
                    </View>
                  </View>
                </View>

                {docStatus.status === 'missing' ? (
                  <TouchableOpacity
                    style={styles.uploadBtn}
                    onPress={() => handleUpload(dt.key)}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <ActivityIndicator size="small" color="#3B82F6" />
                    ) : (
                      <Ionicons name="cloud-upload" size={20} color="#3B82F6" />
                    )}
                  </TouchableOpacity>
                ) : docStatus.status === 'verified' ? (
                  <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
                ) : (
                  <Ionicons name="time" size={24} color="#F59E0B" />
                )}
              </View>
            );
          })}
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#60A5FA" />
          <Text style={styles.infoText}>
            All documents are reviewed within 24-48 hours. Ensure scans are clear and legible. Rejected documents can be re-uploaded.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#CBD5E1', marginBottom: 10 },
  bizScroll: { marginBottom: 4 },
  bizChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  bizChipActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  bizChipText: { fontSize: 13, color: '#CBD5E1' },
  bizChipTextActive: { color: '#fff', fontWeight: '600' },
  progressCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
  progressPct: { fontSize: 18, fontWeight: '800', color: '#3B82F6' },
  progressBarBg: {
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  progressSub: { fontSize: 12, color: '#94A3B8', marginTop: 8 },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  docLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  docIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docInfo: { marginLeft: 12, flex: 1 },
  docName: { fontSize: 13, fontWeight: '600', color: '#fff' },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 4,
  },
  statusText: { fontSize: 10, fontWeight: '600' },
  uploadBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#1E3A5F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
    backgroundColor: '#1E3A5F',
    borderRadius: 10,
    padding: 14,
    gap: 10,
  },
  infoText: { flex: 1, fontSize: 12, color: '#93C5FD', lineHeight: 18 },
});
