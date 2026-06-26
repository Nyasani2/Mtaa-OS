import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export default function ReputationScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [trustScore, setTrustScore] = useState(50);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!user?.id) return; supabase.from('profiles').select('trust_score, is_verified').eq('user_id', user.id).single().then(({ data }) => { if (data) setTrustScore(data.trust_score || 50); setLoading(false); }); }, [user?.id]);
  if (loading) return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color="#00d4ff" /></View>;

  const ratings = [
    { label: 'Seller Rating', score: 4.8, icon: 'storefront-outline', color: '#00d4ff' },
    { label: 'Buyer Rating', score: 4.9, icon: 'cart-outline', color: '#00ff88' },
    { label: 'Creator Rating', score: 4.7, icon: 'sparkles-outline', color: '#ff00ff' },
    { label: 'Driver Rating', score: 0, icon: 'car-outline', color: '#ffaa00' },
    { label: 'Employer Rating', score: 0, icon: 'business-outline', color: '#aa66ff' },
    { label: 'Worker Rating', score: 0, icon: 'hammer-outline', color: '#ff4444' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Reputation</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.trustCard}>
          <View style={styles.trustCircle}><Text style={styles.trustScore}>{trustScore}</Text><Text style={styles.trustLabel}>Trust Score</Text></View>
          <View style={styles.trustBarBg}><View style={[styles.trustBarFill, { width: `${trustScore}%`, backgroundColor: trustScore > 70 ? '#00ff88' : trustScore > 40 ? '#ffaa00' : '#ff4444' }]} /></View>
          <Text style={styles.trustSub}>{trustScore > 70 ? 'Excellent reputation' : trustScore > 40 ? 'Good standing' : 'Build your reputation'}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ratings by Role</Text>
          {ratings.map(r => (
            <View key={r.label} style={styles.ratingRow}>
              <Ionicons name={r.icon as any} size={20} color={r.color} />
              <Text style={styles.ratingLabel}>{r.label}</Text>
              <View style={styles.stars}>{[1,2,3,4,5].map(star => <Ionicons key={star} name={star <= Math.round(r.score) ? 'star' : 'star-outline'} size={14} color={r.color} />)}</View>
              <Text style={[styles.ratingScore, { color: r.color }]}>{r.score > 0 ? r.score.toFixed(1) : '—'}</Text>
            </View>
          ))}
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>History</Text>
          <TouchableOpacity style={styles.row} onPress={() => {}}><Ionicons name="shield-checkmark-outline" size={20} color="#00d4ff" /><Text style={styles.rowText}>Verified History</Text><Ionicons name="chevron-forward" size={16} color="#444" /></TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={() => {}}><Ionicons name="warning-outline" size={20} color="#ff4444" /><Text style={styles.rowText}>Warnings & Appeals</Text><Ionicons name="chevron-forward" size={16} color="#444" /></TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  trustCard: { margin: 16, backgroundColor: '#111', borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#1a1a1a' },
  trustCircle: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: '#00d4ff', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  trustScore: { color: '#fff', fontSize: 32, fontWeight: '700' },
  trustLabel: { color: '#888', fontSize: 11, marginTop: 2 },
  trustBarBg: { width: '100%', height: 6, backgroundColor: '#222', borderRadius: 3, overflow: 'hidden', marginTop: 8 },
  trustBarFill: { height: '100%', borderRadius: 3 },
  trustSub: { color: '#888', fontSize: 12, marginTop: 8 },
  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 14, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#1a1a1a' },
  ratingLabel: { color: '#fff', fontSize: 14, flex: 1, marginLeft: 12 },
  stars: { flexDirection: 'row', gap: 2, marginRight: 8 },
  ratingScore: { fontSize: 14, fontWeight: '700', minWidth: 30, textAlign: 'right' },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 14, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#1a1a1a' },
  rowText: { color: '#fff', fontSize: 14, flex: 1, marginLeft: 12 },
});
