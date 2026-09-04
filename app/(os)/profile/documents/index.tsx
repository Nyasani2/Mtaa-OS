import { Alert, useState } from 'react';
import React, { useEffect, useState, useCallback } from 'react';
import { Alert, View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Share, Linking, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import * as Clipboard from 'expo-clipboard';

const DOC_TYPES = [
  { type: 'id', label: 'National ID', icon: 'card-outline', color: '#00d4ff' },
  { type: 'passport', label: 'Passport', icon: 'airplane-outline', color: '#ff00ff' },
  { type: 'license', label: 'Driving License', icon: 'car-outline', color: '#ffaa00' },
  { type: 'certificate', label: 'Certificates', icon: 'school-outline', color: '#00ff88' },
  { type: 'contract', label: 'Contracts', icon: 'document-text-outline', color: '#aa66ff' },
  { type: 'land', label: 'Land Documents', icon: 'earth-outline', color: '#44ff44' },
  { type: 'business', label: 'Business License', icon: 'business-outline', color: '#ff6644' },
  { type: 'insurance', label: 'Insurance', icon: 'shield-checkmark-outline', color: '#4488ff' },
];

interface Document {
  id: string;
  name: string;
  type: string;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
  verified: boolean;
  verified_at: string | null;
  uploaded_at: string;
  expiry_date: string | null;
  document_number: string | null;
  notes: string | null;
}

export default function DocumentsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('id, name, type, file_url, file_size, mime_type, verified, verified_at, uploaded_at, expiry_date, document_number, notes')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false });

      if (error) {
        console.error('[Documents] Load error:', error);
        Alert.alert('Error', 'Failed to load documents');
      } else {
        setDocs(data || []);
      }
    } catch (err) {
      console.error('[Documents] Load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDocuments();
  };

  const filteredDocs = selectedType
    ? docs.filter((d: any) => d.type === selectedType)
    : docs;

  const getTypeCount = (type: string) => docs.filter((d: any) => d.type === type).length;

  const handleDocPress = (doc: Document) => {
    const options = [
      { text: 'View', onPress: () => openDocument(doc) },
      { text: 'Share', onPress: () => shareDocument(doc) },
      { text: 'Copy Link', onPress: () => copyDocumentLink(doc) },
      { text: 'Delete', style: 'destructive' as const, onPress: () => confirmDelete(doc) },
      { text: 'Cancel', style: 'cancel' as const },
    ];
    Alert.alert(doc.name, 'Choose an action', options);
  };

  const openDocument = async (doc: Document) => {
    try {
      const supported = await Linking.canOpenURL(doc.file_url);
      if (supported) {
        await Linking.openURL(doc.file_url);
      } else {
        Alert.alert('Error', 'Cannot open this document type');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to open document');
    }
  };

  const shareDocument = async (doc: Document) => {
    try {
      await Share.share({
        title: doc.name,
        message: `Document: ${doc.name}${doc.verified ? ' (Verified)' : ''}`,
        url: doc.file_url,
      });
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  const copyDocumentLink = async (doc: Document) => {
    await Clipboard.setStringAsync(doc.file_url);
    Alert.alert('Copied', 'Document link copied to clipboard');
  };

  const confirmDelete = (doc: Document) => {
    Alert.alert(
      'Delete Document',
      `Are you sure you want to delete "${doc.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteDocument(doc),
        },
      ]
    );
  };

  const deleteDocument = async (doc: Document) => {
    try {
      // Delete from storage first
      const pathParts = doc.file_url.split('/documents/');
      if (pathParts.length > 1) {
        const filePath = pathParts[1];
        await supabase.storage.from('documents').remove([filePath]);
      }

      // Delete from database
      const { error } = await supabase.from('documents').delete().eq('id', doc.id);
      if (error) throw error;

      setDocs(prev => prev.filter((d: any) => d.id !== doc.id));
      Alert.alert('Deleted', 'Document removed successfully');
    } catch (err) {
      Alert.alert('Error', 'Failed to delete document');
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const isExpired = (doc: Document) => {
    if (!doc.expiry_date) return false;
    return new Date(doc.expiry_date) < new Date();
  };

  const isExpiringSoon = (doc: Document) => {
    if (!doc.expiry_date) return false;
    const daysUntil = Math.ceil((new Date(doc.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntil > 0 && daysUntil <= 30;
  };

  if (!user?.id) {
    return (
      <View style={[styles.container, styles.center]}>
        <Ionicons name="document-text-outline" size={64} color="#333" />
        <Text style={styles.emptyTitle}>Sign in to view Documents</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/login' as any)}>
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Documents</Text>
        <TouchableOpacity onPress={() => router.push('/(os)/profile/documents/upload' as any)}>
          <Ionicons name="add-circle" size={26} color="#00d4ff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#00d4ff" />
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00d4ff" />}
        >
          {/* Document Types Grid */}
          <View style={styles.typesGrid}>
            {DOC_TYPES.map((dt) => {
              const count = getTypeCount(dt.type);
              const isSelected = selectedType === dt.type;
              return (
                <TouchableOpacity
                  key={dt.type}
                  style={[
                    styles.typeCard,
                    isSelected && { borderColor: dt.color, borderWidth: 2, backgroundColor: dt.color + '11' }
                  ]}
                  onPress={() => setSelectedType(isSelected ? null : dt.type)}
                >
                  <Ionicons name={dt.icon as any} size={24} color={dt.color} />
                  <Text style={styles.typeLabel}>{dt.label}</Text>
                  <Text style={[styles.typeCount, { color: dt.color }]}>{count} file{count !== 1 ? 's' : ''}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Filter indicator */}
          {selectedType && (
            <View style={styles.filterBar}>
              <Text style={styles.filterText}>
                Showing: {DOC_TYPES.find((t: any) => t.type === selectedType)?.label}
              </Text>
              <TouchableOpacity onPress={() => setSelectedType(null)}>
                <Ionicons name="close-circle" size={18} color="#ff4444" />
              </TouchableOpacity>
            </View>
          )}

          {/* Documents List */}
          <Text style={styles.sectionTitle}>
            {selectedType ? 'Filtered Documents' : 'All Documents'} ({filteredDocs.length})
          </Text>

          {filteredDocs.length === 0 ? (
            <View style={styles.emptyDocs}>
              <Ionicons name="folder-open-outline" size={48} color="#333" />
              <Text style={styles.emptyDocsText}>
                {selectedType ? 'No documents of this type' : 'No documents uploaded yet'}
              </Text>
              <TouchableOpacity
                style={styles.uploadBtn}
                onPress={() => router.push('/(os)/profile/documents/upload' as any)}
              >
                <Text style={styles.uploadBtnText}>Upload Document</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredDocs.map((doc) => (
              <TouchableOpacity
                key={doc.id}
                style={[
                  styles.docRow,
                  isExpired(doc) && styles.docRowExpired,
                  isExpiringSoon(doc) && !isExpired(doc) && styles.docRowExpiring,
                ]}
                onPress={() => handleDocPress(doc)}
                onLongPress={() => handleDocPress(doc)}
              >
                <View style={styles.docIcon}>
                  <Ionicons
                    name={doc.mime_type?.includes('pdf') ? 'document-text-outline' :
                          doc.mime_type?.includes('image') ? 'image-outline' :
                          doc.mime_type?.includes('video') ? 'videocam-outline' :
                          'document-outline'}
                    size={22}
                    color="#00d4ff"
                  />
                </View>
                <View style={styles.docInfo}>
                  <Text style={styles.docName}>{doc.name}</Text>
                  <View style={styles.docMeta}>
                    <Text style={styles.docDate}>{formatDate(doc.uploaded_at)}</Text>
                    {doc.file_size && <Text style={styles.docSize}> · {formatFileSize(doc.file_size)}</Text>}
                    {doc.document_number && <Text style={styles.docNumber}> · #{doc.document_number}</Text>}
                  </View>
                  {doc.expiry_date && (
                    <Text style={[
                      styles.expiryText,
                      isExpired(doc) && styles.expiredText,
                      isExpiringSoon(doc) && !isExpired(doc) && styles.expiringText,
                    ]}>
                      {isExpired(doc) ? '⚠️ Expired' : isExpiringSoon(doc) ? '⏰ Expires soon' : `Expires: ${formatDate(doc.expiry_date)}`}
                    </Text>
                  )}
                </View>
                <View style={styles.docBadges}>
                  {doc.verified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="shield-checkmark" size={12} color="#00ff88" />
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={16} color="#444" />
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  content: { padding: 16 },
  typesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  typeCard: { width: '23%', backgroundColor: '#111', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#1a1a1a' },
  typeLabel: { fontSize: 10, fontWeight: '600', color: '#ccc', marginTop: 6, textAlign: 'center' },
  typeCount: { fontSize: 10, marginTop: 2 },
  filterBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#111', padding: 10, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#1a1a1a' },
  filterText: { color: '#fff', fontSize: 13 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#888', letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' },
  emptyDocs: { backgroundColor: '#111', borderRadius: 12, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#1a1a1a' },
  emptyDocsText: { fontSize: 14, color: '#666', marginTop: 12 },
  uploadBtn: { marginTop: 16, backgroundColor: '#00d4ff', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
  uploadBtnText: { color: '#000', fontSize: 14, fontWeight: '700' },
  docRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#1a1a1a' },
  docRowExpired: { borderColor: '#ff4444', backgroundColor: '#1a0505' },
  docRowExpiring: { borderColor: '#ffaa00', backgroundColor: '#1a1200' },
  docIcon: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' },
  docInfo: { flex: 1, marginLeft: 12 },
  docName: { fontSize: 14, fontWeight: '600', color: '#fff' },
  docMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  docDate: { fontSize: 11, color: '#666' },
  docSize: { fontSize: 11, color: '#666' },
  docNumber: { fontSize: 11, color: '#00d4ff' },
  expiryText: { fontSize: 11, color: '#888', marginTop: 3 },
  expiredText: { color: '#ff4444', fontWeight: '600' },
  expiringText: { color: '#ffaa00', fontWeight: '600' },
  docBadges: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  verifiedBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#002211', justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginTop: 16, marginBottom: 16, textAlign: 'center' },
  button: { backgroundColor: '#00d4ff', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 10 },
  buttonText: { color: '#000', fontSize: 16, fontWeight: '600' },
});
