import { useState } from 'react';
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

interface LoanProduct {
  id: string;
  name: string;
  type: string;
  interest_rate: number;
  max_amount: number;
  min_amount: number;
  duration_months: number;
  status: string;
}

interface CreditScore {
  id: string;
  user_id: string;
  score: number;
  tier: string;
  total_loans: number;
  active_loans: number;
  total_borrowed: number;
  total_repaid: number;
}

export default function CreditRegulatoryView() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loanProducts, setLoanProducts] = useState<LoanProduct[]>([]);
  const [creditScores, setCreditScores] = useState<CreditScore[]>([]);
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    activeLoans: 0,
    totalVolume: 0,
    avgScore: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Get loan products
      const { data: products } = await supabase
        .from('loan_products')
        .select('*');
      if (products) setLoanProducts(products);

      // Get credit scores
      const { data: scores } = await supabase
        .from('credit_scores')
        .select('*')
        .order('score', { ascending: false })
        .limit(20);
      if (scores) setCreditScores(scores);

      // Calculate metrics
      const { count: userCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });

      const { count: loanCount } = await supabase
        .from('loans')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const { data: loans } = await supabase
        .from('loans')
        .select('amount');
      const volume = loans?.reduce((sum, l) => sum + (l.amount || 0), 0) || 0;

      const avg = scores && scores.length > 0
        ? scores.reduce((sum, s) => sum + (s.score || 0), 0) / scores.length
        : 0;

      setMetrics({
        totalUsers: userCount || 0,
        activeLoans: loanCount || 0,
        totalVolume: volume,
        avgScore: Math.round(avg),
      });
    } catch (err) {
      console.error('Credit regulatory error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);
  const onRefresh = () => { setRefreshing(true); loadData(); };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00d4ff" />
        <Text style={styles.loadingText}>Loading Credit & Regulatory...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00d4ff" />}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Credit & Regulatory</Text>
        <Text style={styles.headerSub}>Treasury Oversight & Compliance</Text>
      </View>

      {/* Metrics */}
      <View style={styles.statsRow}>
        <StatBox title="Total Users" value={metrics.totalUsers.toLocaleString()} icon="people-outline" color="#00d4ff" />
        <StatBox title="Active Loans" value={metrics.activeLoans.toLocaleString()} icon="cash-outline" color="#00cc66" />
        <StatBox title="Loan Volume" value={`KES ${(metrics.totalVolume / 1000000).toFixed(1)}M`} icon="trending-up-outline" color="#ffaa00" />
        <StatBox title="Avg Score" value={metrics.avgScore.toString()} icon="star-outline" color="#8855ff" />
      </View>

      {/* Loan Products */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Loan Products</Text>
        {loanProducts.length === 0 ? (
          <Text style={styles.emptyText}>No loan products configured</Text>
        ) : (
          loanProducts.map((product: any) => (
            <View key={product.id} style={styles.productCard}>
              <View style={styles.productHeader}>
                <Ionicons name="cash-outline" size={20} color="#00d4ff" />
                <Text style={styles.productName}>{product.name}</Text>
                <View style={[styles.productStatus, product.status === 'active' ? styles.statusActive : styles.statusInactive]}>
                  <Text style={styles.statusText}>{product.status}</Text>
                </View>
              </View>
              <View style={styles.productDetails}>
                <Detail label="Interest" value={`${product.interest_rate}%`} />
                <Detail label="Min" value={`KES ${(product.min_amount || 0).toLocaleString()}`} />
                <Detail label="Max" value={`KES ${(product.max_amount || 0).toLocaleString()}`} />
                <Detail label="Duration" value={`${product.duration_months} mo`} />
              </View>
            </View>
          ))
        )}
      </View>

      {/* Credit Scores */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Credit Score Distribution</Text>
        {creditScores.length === 0 ? (
          <Text style={styles.emptyText}>No credit data available</Text>
        ) : (
          creditScores.map((score: any) => (
            <View key={score.id} style={styles.scoreCard}>
              <View style={[styles.scoreCircle, { borderColor: getScoreColor(score.score) }]}>
                <Text style={[styles.scoreNumber, { color: getScoreColor(score.score) }]}>{score.score}</Text>
              </View>
              <View style={styles.scoreInfo}>
                <Text style={styles.scoreTier}>{score.tier}</Text>
                <Text style={styles.scoreLoans}>{score.active_loans} active · {score.total_loans} total</Text>
              </View>
              <View style={styles.scoreAmounts}>
                <Text style={styles.scoreBorrowed}>Borrowed: KES {(score.total_borrowed || 0).toLocaleString()}</Text>
                <Text style={styles.scoreRepaid}>Repaid: KES {(score.total_repaid || 0).toLocaleString()}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function StatBox({ title, value, icon, color }: { title: string; value: string; icon: string; color: string }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon as any} size={22} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailBox}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function getScoreColor(score: number): string {
  if (score >= 700) return '#00cc66';
  if (score >= 500) return '#ffaa00';
  return '#ff4444';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  loadingText: { color: '#fff', fontSize: 16, marginTop: 16 },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#111', borderBottomWidth: 1, borderBottomColor: '#222' },
  backBtn: { marginBottom: 12 },
  headerTitle: { color: '#fff', fontSize: 26, fontWeight: 'bold' },
  headerSub: { color: '#888', fontSize: 14, marginTop: 4 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, justifyContent: 'space-between' },
  statCard: { width: '48%', backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 12, alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: 'bold', marginTop: 8 },
  statTitle: { color: '#888', fontSize: 11, marginTop: 4 },
  section: { padding: 16, marginBottom: 8 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 12 },
  emptyText: { color: '#666', fontSize: 14, fontStyle: 'italic' },
  productCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 12 },
  productHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  productName: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 8, flex: 1 },
  productStatus: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusActive: { backgroundColor: '#00cc6622' },
  statusInactive: { backgroundColor: '#ff444422' },
  statusText: { fontSize: 10, fontWeight: '600' },
  productDetails: { flexDirection: 'row', justifyContent: 'space-around' },
  detailBox: { alignItems: 'center' },
  detailLabel: { color: '#888', fontSize: 11 },
  detailValue: { color: '#fff', fontSize: 13, fontWeight: '500', marginTop: 2 },
  scoreCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, marginBottom: 10 },
  scoreCircle: { width: 48, height: 48, borderRadius: 24, borderWidth: 3, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  scoreNumber: { fontSize: 16, fontWeight: 'bold' },
  scoreInfo: { flex: 1 },
  scoreTier: { color: '#fff', fontSize: 14, fontWeight: '500' },
  scoreLoans: { color: '#888', fontSize: 12, marginTop: 2 },
  scoreAmounts: { alignItems: 'flex-end' },
  scoreBorrowed: { color: '#ccc', fontSize: 12 },
  scoreRepaid: { color: '#00cc66', fontSize: 12, marginTop: 2 },
});
