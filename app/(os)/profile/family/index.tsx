// app/(os)/profile/family/index.tsx — Family Profile

import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth/useAuth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';

export default function FamilyScreen() {
  const router = useRouter();
  const { user, isAuthenticated, initialize } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { initialize(); }, []);
  useEffect(() => {
    if (isAuthenticated && user?.id) loadFamilyData();
  }, [isAuthenticated, user?.id]);

  async function loadFamilyData() {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('family_profiles')
        .select('*')
        .eq('parent_id', user.id)
        .order('created_at', { ascending: false });
      setChildren(data || []);
    } catch (err) { console.error('[Family] Load error:', err); }
    finally { setLoading(false); }
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Ionicons name="people-outline" size={64} color="#ccc" />
        <Text style={styles.emptyTitle}>Sign in to view Family Profile</Text>
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
        <Text style={styles.headerTitle}>Family</Text>
        <TouchableOpacity onPress={() => router.push('/(os)/profile/family/add')}>
          <Ionicons name="add-circle" size={26} color="#ec4899" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#ec4899" />
      ) : children.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={64} color="#ddd" />
          <Text style={styles.emptyTitle}>No family members yet</Text>
          <Text style={styles.emptySub}>Add children to manage their school, health, and allowance</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.push('/(os)/profile/family/add')}>
            <Text style={styles.buttonText}>Add Family Member</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {children.map((child) => (
            <TouchableOpacity key={child.id} style={styles.childCard} onPress={() => router.push(`/(os)/profile/family/${child.id}` as any)}>
              <View style={styles.childAvatar}>
                <Text style={styles.childAvatarText}>{child.child_name?.charAt(0) || '?'}</Text>
              </View>
              <View style={styles.childInfo}>
                <Text style={styles.childName}>{child.child_name || 'Unnamed'}</Text>
                <Text style={styles.childSub}>{child.school || 'No school'} • {child.grade || 'No grade'}</Text>
                <View style={styles.childBadges}>
                  {child.transport_allowed && (
                    <View style={[styles.badge, { backgroundColor: '#d1fae5' }]}>
                      <Text style={[styles.badgeText, { color: '#059669' }]}>Transport</Text>
                    </View>
                  )}
                  <View style={[styles.badge, { backgroundColor: '#fef3c7' }]}>
                    <Text style={[styles.badgeText, { color: '#d97706' }]}>
                      KSh {child.allowance_balance || 0}
                    </Text>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          ))}
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
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginTop: 16 },
  emptySub: { fontSize: 14, color: '#888', marginTop: 4, marginBottom: 24, textAlign: 'center' },
  button: { backgroundColor: '#ec4899', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  childCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  childAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#fce7f3', justifyContent: 'center', alignItems: 'center' },
  childAvatarText: { fontSize: 20, fontWeight: '700', color: '#ec4899' },
  childInfo: { flex: 1, marginLeft: 12 },
  childName: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  childSub: { fontSize: 13, color: '#888', marginTop: 2 },
  childBadges: { flexDirection: 'row', gap: 6, marginTop: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '600' },
});
