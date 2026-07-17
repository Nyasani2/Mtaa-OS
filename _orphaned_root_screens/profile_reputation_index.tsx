import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

interface RatingData {
  label: string;
  score: number | null;
  icon: string;
  color: string;
  table: string;
  count: number;
}

interface VerificationRecord {
  id: string;
  type: string;
  status: string;
  verified_at: string;
  method: string;
}

interface WarningRecord {
  id: string;
  reason: string;
  severity: string;
  issued_at: string;
  status: string;
  appeal_status: string | null;
}

export default function ReputationScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [trustScore, setTrustScore] = useState(50);
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ratings, setRatings] = useState<RatingData[]>([
    { label: 'Seller Rating', score: null, icon: 'storefront-outline', color: '#00d4ff', table: 'marketplace_trust', count: 0 },
    { label: 'Buyer Rating', score: null, icon: 'cart-outline', color: '#00ff88', table: 'marketplace_trust', count: 0 },
    { label: 'Creator Rating', score: null, icon: 'sparkles-outline', color: '#ff00ff', table: 'streets_posts', count: 0 },
    { label: 'Driver Rating', score: null, icon: 'car-outline', color: '#ffaa00', table: 'mtaxi_ratings', count: 0 },
    { label: 'Employer Rating', score: null, icon: 'business-outline', color: '#aa66ff', table: 'job_contracts', count: 0 },
    { label: 'Worker Rating', score: null, icon: 'hammer-outline', color: '#ff4444', table: 'job_contracts', count: 0 },
  ]);
  const [verificationCount, setVerificationCount] = useState(0);
  const [warningCount, setWarningCount] = useState(0);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      // 1. Load trust score and verified status from profiles
      const { data: profileData } = await supabase
        .from('profiles')
        .select('trust_score, is_verified')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setTrustScore(profileData.trust_score || 50);
        setIsVerified(profileData.is_verified || false);
      }

      // 2. Load marketplace trust ratings (seller/buyer)
      const { data: trustData } = await supabase
        .from('marketplace_trust')
        .select('role, rating, review_count')
        .eq('user_id', user.id);

      const updatedRatings = [...ratings];
      if (trustData) {
        trustData.forEach((t: any) => {
          const idx = updatedRatings.findIndex(r => 
            (t.role === 'seller' && r.label === 'Seller Rating') ||
            (t.role === 'buyer' && r.label === 'Buyer Rating')
          );
          if (idx >= 0) {
            updatedRatings[idx].score = t.rating;
            updatedRatings[idx].count = t.review_count || 0;
          }
        });
      }

      // 3. Load creator rating from streets_posts engagement
      const { data: creatorData } = await supabase
        .from('streets_posts')
        .select('id, likes_count, views_count')
        .eq('creator_id', user.id);

      if (creatorData && creatorData.length > 0) {
        const totalLikes = creatorData.reduce((sum: number, p: any) => sum + (p.likes_count || 0), 0);
        const totalViews = creatorData.reduce((sum: number, p: any) => sum + (p.views_count || 0), 0);
        const creatorScore = totalViews > 0 ? Math.min(5, (totalLikes / Math.max(totalViews, 1)) * 25) : null;
        const creatorIdx = updatedRatings.findIndex(r => r.label === 'Creator Rating');
        if (creatorIdx >= 0) {
          updatedRatings[creatorIdx].score = creatorScore;
          updatedRatings[creatorIdx].count = creatorData.length;
        }
      }

      // 4. Load driver rating from mtaxi_ratings
      const { data: driverData } = await supabase
        .from('mtaxi_ratings')
        .select('rating')
        .eq('driver_id', user.id);

      if (driverData && driverData.length > 0) {
        const avg = driverData.reduce((sum: number, r: any) => sum + r.rating, 0) / driverData.length;
        const driverIdx = updatedRatings.findIndex(r => r.label === 'Driver Rating');
        if (driverIdx >= 0) {
          updatedRatings[driverIdx].score = avg;
          updatedRatings[driverIdx].count = driverData.length;
        }
      }

      // 5. Load employer/worker ratings from job_contracts
      const { data: jobData } = await supabase
        .from('job_contracts')
        .select('employer_rating, worker_rating, employer_id, worker_id')
        .or(`employer_id.eq.${user.id},worker_id.eq.${user.id}`);

      if (jobData) {
        const employerRatings = jobData.filter((j: any) => j.employer_id === user.id && j.employer_rating).map((j: any) => j.employer_rating);
        const workerRatings = jobData.filter((j: any) => j.worker_id === user.id && j.worker_rating).map((j: any) => j.worker_rating);

        const empIdx = updatedRatings.findIndex(r => r.label === 'Employer Rating');
        if (empIdx >= 0 && employerRatings.length > 0) {
          updatedRatings[empIdx].score = employerRatings.reduce((a: number, b: number) => a + b, 0) / employerRatings.length;
          updatedRatings[empIdx].count = employerRatings.length;
        }

        const workIdx = updatedRatings.findIndex(r => r.label === 'Worker Rating');
        if (workIdx >= 0 && workerRatings.length > 0) {
          updatedRatings[workIdx].score = workerRatings.reduce((a: number, b: number) => a + b, 0) / workerRatings.length;
          updatedRatings[workIdx].count = workerRatings.length;
        }
      }

      setRatings(updatedRatings);

      // 6. Count verification history
      const { count: vCount } = await supabase
        .from('profile_verifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      setVerificationCount(vCount || 0);

      // 7. Count warnings/appeals
      const { count: wCount } = await supabase
        .from('profile_reports')
        .select('*', { count: 'exact', head: true })
        .eq('reported_user_id', user.id)
        .eq('status', 'resolved');
      setWarningCount(wCount || 0);

    } catch (err) {
      console.error('Reputation load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getTrustColor = () => {
    if (trustScore >= 80) return '#00ff88';
    if (trustScore >= 50) return '#ffaa00';
    return '#ff4444';
  };

  const getTrustLabel = () => {
    if (trustScore >= 90) return 'Elite Reputation';
    if (trustScore >= 80) return 'Excellent Reputation';
    if (trustScore >= 60) return 'Good Standing';
    if (trustScore >= 40) return 'Fair Standing';
    return 'Build Your Reputation';
  };

  const getKamosScore = () => {
    // Kamos Theory: 1×1 = 1 + f(growth, replication, interaction, observation)
    // Trust score is a proliferative, adaptive measure
    const base = 1;
    const growth = ratings.filter(r => r.score !== null).length / ratings.length;
    const replication = ratings.reduce((sum, r) => sum + (r.count || 0), 0);
    const interaction = ratings.reduce((sum, r) => sum + (r.score || 0), 0);
    const observation = isVerified ? 1.5 : 1.0;
    return Math.round((base + growth + Math.log10(replication + 1) + interaction / 10) * observation * 10);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#00d4ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reputation</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh" size={22} color="#00d4ff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00d4ff" />}
      >
        {/* Trust Score Card */}
        <View style={styles.trustCard}>
          <View style={[styles.trustCircle, { borderColor: getTrustColor() }]}>
            <Text style={styles.trustScore}>{trustScore}</Text>
            <Text style={styles.trustLabel}>Trust Score</Text>
          </View>
          <View style={styles.trustBarBg}>
            <View style={[styles.trustBarFill, { width: `${Math.min(trustScore, 100)}%`, backgroundColor: getTrustColor() }]} />
          </View>
          <Text style={styles.trustSub}>{getTrustLabel()}</Text>
          {isVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="shield-checkmark" size={14} color="#00ff88" />
              <Text style={styles.verifiedText}>Verified Account</Text>
            </View>
          )}
          {/* Kamos Theory Score */}
          <View style={styles.kamosRow}>
            <Ionicons name="infinite-outline" size={14} color="#888" />
            <Text style={styles.kamosLabel}>Kamos Score: </Text>
            <Text style={styles.kamosValue}>{getKamosScore()}</Text>
          </View>
        </View>

        {/* Ratings by Role */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ratings by Role</Text>
          {ratings.map(r => (
            <View key={r.label} style={styles.ratingRow}>
              <Ionicons name={r.icon as any} size={20} color={r.color} />
              <View style={styles.ratingInfo}>
                <Text style={styles.ratingLabel}>{r.label}</Text>
                <Text style={styles.ratingCount}>{r.count > 0 ? `${r.count} reviews` : 'No reviews yet'}</Text>
              </View>
              <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map(star => (
                  <Ionicons
                    key={star}
                    name={r.score !== null && star <= Math.round(r.score) ? 'star' : 'star-outline'}
                    size={14}
                    color={r.color}
                  />
                ))}
              </View>
              <Text style={[styles.ratingScore, { color: r.color }]}>
                {r.score !== null ? r.score.toFixed(1) : '—'}
              </Text>
            </View>
          ))}
        </View>

        {/* History Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>History</Text>
          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push('/(os)/profile/reputation/verified-history')}
          >
            <Ionicons name="shield-checkmark-outline" size={20} color="#00d4ff" />
            <View style={styles.rowInfo}>
              <Text style={styles.rowText}>Verified History</Text>
              <Text style={styles.rowSub}>{verificationCount} verifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#444" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push('/(os)/profile/reputation/warnings')}
          >
            <Ionicons name="warning-outline" size={20} color="#ff4444" />
            <View style={styles.rowInfo}>
              <Text style={styles.rowText}>Warnings & Appeals</Text>
              <Text style={styles.rowSub}>{warningCount} {warningCount === 1 ? 'warning' : 'warnings'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#444" />
          </TouchableOpacity>
        </View>

        {/* Trust Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How to Improve</Text>
          <View style={styles.tipCard}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#00ff88" />
            <Text style={styles.tipText}>Complete identity verification</Text>
          </View>
          <View style={styles.tipCard}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#00ff88" />
            <Text style={styles.tipText}>Deliver on marketplace orders on time</Text>
          </View>
          <View style={styles.tipCard}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#00ff88" />
            <Text style={styles.tipText}>Maintain high ratings across all roles</Text>
          </View>
          <View style={styles.tipCard}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#00ff88" />
            <Text style={styles.tipText}>Resolve disputes professionally</Text>
          </View>
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
  trustCircle: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  trustScore: { color: '#fff', fontSize: 32, fontWeight: '700' },
  trustLabel: { color: '#888', fontSize: 11, marginTop: 2 },
  trustBarBg: { width: '100%', height: 6, backgroundColor: '#222', borderRadius: 3, overflow: 'hidden', marginTop: 8 },
  trustBarFill: { height: '100%', borderRadius: 3 },
  trustSub: { color: '#888', fontSize: 12, marginTop: 8 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 8, backgroundColor: '#002211', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  verifiedText: { color: '#00ff88', fontSize: 11, marginLeft: 4, fontWeight: '600' },
  kamosRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  kamosLabel: { color: '#888', fontSize: 11 },
  kamosValue: { color: '#00d4ff', fontSize: 11, fontWeight: '700' },
  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 14, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#1a1a1a' },
  ratingInfo: { flex: 1, marginLeft: 12 },
  ratingLabel: { color: '#fff', fontSize: 14 },
  ratingCount: { color: '#666', fontSize: 11, marginTop: 2 },
  stars: { flexDirection: 'row', gap: 2, marginRight: 8 },
  ratingScore: { fontSize: 14, fontWeight: '700', minWidth: 30, textAlign: 'right' },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 14, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#1a1a1a' },
  rowInfo: { flex: 1, marginLeft: 12 },
  rowText: { color: '#fff', fontSize: 14 },
  rowSub: { color: '#666', fontSize: 11, marginTop: 2 },
  tipCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 12, borderRadius: 10, marginBottom: 6, borderWidth: 1, borderColor: '#1a1a1a' },
  tipText: { color: '#ccc', fontSize: 13, marginLeft: 10, flex: 1 },
});
