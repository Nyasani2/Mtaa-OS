// app/(os)/profile/reputation/index.tsx — Reputation & Verification

import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth/useAuth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';

const APPS = ['Jobs', 'MTaxi', 'Market', 'Shop', 'Property', 'Streets', 'Pulse'];

export default function ReputationScreen() {
  const router = useRouter();
  const { user, isAuthenticated, initialize } = useAuth();
  const [scores, setScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { initialize(); }, []);
  useEffect(() => {
    if (isAuthenticated && user?.id) loadReputationData();
  }, [isAuthenticated, user?.id]);

  async function loadReputationData() {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('reputation_scores')
        .select('*')
        .eq('user_id', user.id)
        .order('rating', { ascending: false });
      setScores(data || []);
    } catch (err) { console.error('[Reputation] Load error:', err); }
    finally { setLoading(false); }
  }

  const overallRating = scores.length > 0
    ? (scores.reduce((sum, s) => sum + (s.rating || 0), 0) / scores.length).toFixed(1)
    : '0.0';

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Ionicons name="star-outline" size={64} color="#ccc" />
        <Text style={styles.emptyTitle}>Sign in to view Reputation</Text>
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
        <Text style={styles.headerTitle}>Reputation</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#f97316" />
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Overall Score */}
          <View style={styles.overallCard}>
            <Text style={styles.overallScore}>{overallRating}</Text>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Ionicons key={s} name={s <= Math.round(parseFloat(overallRating)) ? "star" : "star-outline"}
                  size={20} color="#f59e0b" />
              ))}
            </View>
            <Text style={styles.overallLabel}>Overall Rating across {scores.length} apps</Text>
          </View>

          {/* Trust Score */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Trust Score</Text>
            <View style={styles.trustBar}>
              <View style={[styles.trustFill, { width: `${Math.min(user?.trust_score || 0, 100)}%` }]} />
            </View>
            <Text style={styles.trustText}>{user?.trust_score || 0} / 100</Text>
          </View>

          {/* KYC Status */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Verification Status</Text>
            <View style={styles.kycRow}>
              <Ionicons name={user?.is_verified ? "shield-checkmark" : "shield-outline"}
                size={24} color={user?.is_verified ? "#10b981" : "#888"} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.kycTitle}>{user?.is_verified ? 'Verified' : 'Unverified'}</Text>
                <Text style={styles.kycSub}>Level {user?.verification_level || 0} • {user?.kyc_status || 'unverified'}</Text>
              </View>
            </View>
          </View>

          {/* Per-App Ratings */}
          <Text style={styles.sectionTitle}>App Ratings</Text>
          {APPS.map((app) => {
            const score = scores.find((s) => s.app === app.toLowerCase());
            return (
              <View key={app} style={styles.appRow}>
                <Text style={styles.appName}>{app}</Text>
                <View style={styles.appRating}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Ionicons key={s} name={s <= Math.round(score?.rating || 0) ? "star" : "star-outline"}
                      size={14} color="#f59e0b" />
                  ))}
                </View>
                <Text style={styles.appCount}>{score?.count || 0} reviews</Text>
              </View>
            );
          })}
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
  overallCard: { backgroundColor: '#fff', borderRadius: 12, padding: 24, alignItems: 'center', marginBottom: 12 },
  overallScore: { fontSize: 48, fontWeight: '700', color: '#f59e0b' },
  stars: { flexDirection: 'row', gap: 4, marginTop: 8 },
  overallLabel: { fontSize: 13, color: '#888', marginTop: 8 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 12, fontWeight: '700', color: '#9ca3af', letterSpacing: 1, marginBottom: 12 },
  trustBar: { height: 8, backgroundColor: '#e2e8f0', borderRadius: 4, overflow: 'hidden' },
  trustFill: { height: '100%', backgroundColor: '#f97316', borderRadius: 4 },
  trustText: { fontSize: 13, color: '#888', marginTop: 6 },
  kycRow: { flexDirection: 'row', alignItems: 'center' },
  kycTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  kycSub: { fontSize: 13, color: '#888', marginTop: 2 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#9ca3af', letterSpacing: 1, marginBottom: 8, marginTop: 4 },
  appRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8 },
  appName: { width: 100, fontSize: 14, fontWeight: '600', color: '#333' },
  appRating: { flexDirection: 'row', gap: 2, flex: 1 },
  appCount: { fontSize: 12, color: '#888' },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginTop: 16, marginBottom: 16, textAlign: 'center' },
  button: { backgroundColor: '#f97316', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
