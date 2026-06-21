// app/(os)/profile/business/index.tsx — Business Profile

import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth/useAuth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';

export default function BusinessScreen() {
  const router = useRouter();
  const { user, isAuthenticated, initialize } = useAuth();
  const [bizData, setBizData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { initialize(); }, []);
  useEffect(() => {
    if (isAuthenticated && user?.id) loadBusinessData();
  }, [isAuthenticated, user?.id]);

  async function loadBusinessData() {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('owner_id', user.id)
        .single();
      setBizData(data);
    } catch (err) { console.error('[Business] Load error:', err); }
    finally { setLoading(false); }
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Ionicons name="storefront-outline" size={64} color="#ccc" />
        <Text style={styles.emptyTitle}>Sign in to view your Business Profile</Text>
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
        <Text style={styles.headerTitle}>My Business</Text>
        <TouchableOpacity onPress={() => router.push('/(os)/profile/business/edit')}>
          <Ionicons name="create-outline" size={22} color="#8b5cf6" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#8b5cf6" />
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Business Name</Text>
            <Text style={styles.cardText}>{bizData?.business_name || 'No business registered'}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Description</Text>
            <Text style={styles.cardText}>{bizData?.description || 'No description'}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Category</Text>
            <Text style={styles.cardText}>{bizData?.category || 'Not specified'}</Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{bizData?.products_count || 0}</Text>
              <Text style={styles.statLabel}>Products</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{bizData?.services_count || 0}</Text>
              <Text style={styles.statLabel}>Services</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{bizData?.employees_count || 0}</Text>
              <Text style={styles.statLabel}>Employees</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{bizData?.branches_count || 0}</Text>
              <Text style={styles.statLabel}>Branches</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Rating</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="star" size={18} color="#f59e0b" />
              <Text style={[styles.cardText, { marginLeft: 6 }]}>{bizData?.rating || 0} / 5</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(os)/shop')}>
            <Ionicons name="cart-outline" size={20} color="#8b5cf6" />
            <Text style={styles.actionText}>Go to Shop</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(os)/market')}>
            <Ionicons name="storefront-outline" size={20} color="#8b5cf6" />
            <Text style={styles.actionText}>Go to Market</Text>
          </TouchableOpacity>
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
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 12, fontWeight: '700', color: '#9ca3af', letterSpacing: 1, marginBottom: 8 },
  cardText: { fontSize: 15, color: '#333' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  statBox: { width: '48%', backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: '700', color: '#8b5cf6' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 8 },
  actionText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#333', marginLeft: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginTop: 16, marginBottom: 16, textAlign: 'center' },
  button: { backgroundColor: '#8b5cf6', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
