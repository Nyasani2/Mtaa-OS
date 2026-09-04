// @ts-nocheck
import { useState, useEffect } from 'react';
// app/(os)/profile/assets/index.tsx — Assets Registry

import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';

const ASSET_TYPES = [
  { type: 'vehicle', label: 'Vehicles', icon: 'car-outline', apps: ['MTaxi', 'MTruck', 'Boda'] },
  { type: 'property', label: 'Properties', icon: 'home-outline', apps: ['Property'] },
  { type: 'land', label: 'Land Parcels', icon: 'earth-outline', apps: ['Land'] },
  { type: 'equipment', label: 'Equipment', icon: 'construct-outline', apps: [] },
  { type: 'business', label: 'Businesses', icon: 'business-outline', apps: ['Shop', 'Market'] },
];

export default function AssetsScreen() {
  const router = useRouter();
  const { user, isAuthenticated, initialize } = useAuth();
  const [assetsList, setAssetsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { initialize(); }, []);
  useEffect(() => {
    if (isAuthenticated && user?.id) loadAssets();
  }, [isAuthenticated, user?.id]);

  async function loadAssets() {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('assets')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
      setAssetsList(data || []);
    } catch (err) { console.error('[Assets] Load error:', err); }
    finally { setLoading(false); }
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Ionicons name="cube-outline" size={64} color="#ccc" />
        <Text style={styles.emptyTitle}>Sign in to view Assets</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/login' as any)}>
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
        <Text style={styles.headerTitle}>Assets</Text>
        <TouchableOpacity onPress={() => router.push('/(os)/profile/assets/add' as any)}>
          <Ionicons name="add-circle" size={26} color="#84cc16" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#84cc16" />
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Asset Types */}
          {ASSET_TYPES.map((at) => {
            const count = assetsList.filter((a) => a.type === at.type).length;
            return (
              <TouchableOpacity key={at.type} style={styles.typeCard} onPress={() => router.push(`/(os)/profile/assets/${at.type}` as any)}>
                <View style={[styles.typeIcon, { backgroundColor: '#84cc16' + '15' }]}>
                  <Ionicons name={at.icon as any} size={24} color="#84cc16" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.typeLabel}>{at.label}</Text>
                  <Text style={styles.typeCount}>{count} asset{count !== 1 ? 's' : ''}</Text>
                  {at.apps.length > 0 && (
                    <Text style={styles.typeApps}>Used by: {at.apps.join(', ')}</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            );
          })}

          {/* Total Value */}
          <View style={styles.valueCard}>
            <Text style={styles.valueLabel}>Total Portfolio Value</Text>
            <Text style={styles.valueAmount}>
              KSh {assetsList.reduce((sum, a) => sum + (a.value || 0), 0).toLocaleString()}
            </Text>
          </View>
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
  typeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  typeIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  typeLabel: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  typeCount: { fontSize: 13, color: '#888', marginTop: 2 },
  typeApps: { fontSize: 11, color: '#84cc16', marginTop: 2 },
  valueCard: { backgroundColor: '#84cc16', borderRadius: 12, padding: 20, marginTop: 8 },
  valueLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },
  valueAmount: { color: '#fff', fontSize: 28, fontWeight: '700', marginTop: 6 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginTop: 16, marginBottom: 16, textAlign: 'center' },
  button: { backgroundColor: '#84cc16', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
