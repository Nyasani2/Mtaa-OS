// app/(os)/profile/documents/index.tsx — Documents Vault

import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth/useAuth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';

const DOC_TYPES = [
  { type: 'id', label: 'National ID', icon: 'card-outline' },
  { type: 'passport', label: 'Passport', icon: 'airplane-outline' },
  { type: 'license', label: 'Driving License', icon: 'car-outline' },
  { type: 'certificate', label: 'Certificates', icon: 'school-outline' },
  { type: 'contract', label: 'Contracts', icon: 'document-text-outline' },
  { type: 'land', label: 'Land Documents', icon: 'earth-outline' },
  { type: 'business', label: 'Business License', icon: 'business-outline' },
  { type: 'insurance', label: 'Insurance', icon: 'shield-checkmark-outline' },
];

export default function DocumentsScreen() {
  const router = useRouter();
  const { user, isAuthenticated, initialize } = useAuth();
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { initialize(); }, []);
  useEffect(() => {
    if (isAuthenticated && user?.id) loadDocuments();
  }, [isAuthenticated, user?.id]);

  async function loadDocuments() {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false });
      setDocs(data || []);
    } catch (err) { console.error('[Documents] Load error:', err); }
    finally { setLoading(false); }
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Ionicons name="document-text-outline" size={64} color="#ccc" />
        <Text style={styles.emptyTitle}>Sign in to view Documents</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/auth/sign-in')}>
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Documents</Text>
        <TouchableOpacity onPress={() => router.push('/(os)/profile/documents/upload')}>
          <Ionicons name="add-circle" size={26} color="#64748b" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#64748b" />
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Document Types */}
          <View style={styles.typesGrid}>
            {DOC_TYPES.map((dt) => {
              const count = docs.filter((d) => d.type === dt.type).length;
              return (
                <TouchableOpacity key={dt.type} style={styles.typeCard} onPress={() => {}}>
                  <Ionicons name={dt.icon as any} size={24} color="#64748b" />
                  <Text style={styles.typeLabel}>{dt.label}</Text>
                  <Text style={styles.typeCount}>{count} file{count !== 1 ? 's' : ''}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Recent Documents */}
          <Text style={styles.sectionTitle}>Recent Documents</Text>
          {docs.length === 0 ? (
            <View style={styles.emptyDocs}>
              <Text style={styles.emptyDocsText}>No documents uploaded yet</Text>
            </View>
          ) : (
            docs.map((doc) => (
              <TouchableOpacity key={doc.id} style={styles.docRow} onPress={() => {}}>
                <Ionicons name="document-outline" size={22} color="#64748b" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.docName}>{doc.name || doc.type}</Text>
                  <Text style={styles.docDate}>{new Date(doc.uploaded_at).toLocaleDateString()}</Text>
                </View>
                {doc.verified && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#10b981" />
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  content: { padding: 16 },
  typesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  typeCard: { width: '23%', backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center' },
  typeLabel: { fontSize: 11, fontWeight: '600', color: '#333', marginTop: 6, textAlign: 'center' },
  typeCount: { fontSize: 10, color: '#888', marginTop: 2 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#9ca3af', letterSpacing: 1, marginBottom: 8 },
  emptyDocs: { backgroundColor: '#fff', borderRadius: 12, padding: 24, alignItems: 'center' },
  emptyDocsText: { fontSize: 14, color: '#aaa' },
  docRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8 },
  docName: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  docDate: { fontSize: 12, color: '#888', marginTop: 2 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#d1fae5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  verifiedText: { fontSize: 11, color: '#059669', fontWeight: '600', marginLeft: 4 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginTop: 16, marginBottom: 16, textAlign: 'center' },
  button: { backgroundColor: '#64748b', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
