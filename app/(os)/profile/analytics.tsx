import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

const { width: SCREEN_W } = Dimensions.get('window');

export default function ProfileAnalyticsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    supabase.from('profile_analytics').select('*').eq('profile_id', user.id).order('date', { ascending: false }).limit(30).then(({ data }) => {
      setAnalytics(data);
      setLoading(false);
    });
  }, [user?.id]);

  if (loading) return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color="#00d4ff" /></View>;

  const totals = analytics?.reduce((acc: any, day: any) => ({
    profile_views: (acc.profile_views || 0) + (day.profile_views || 0),
    portfolio_views: (acc.portfolio_views || 0) + (day.portfolio_views || 0),
    business_views: (acc.business_views || 0) + (day.business_views || 0),
    service_views: (acc.service_views || 0) + (day.service_views || 0),
    product_views: (acc.product_views || 0) + (day.product_views || 0),
    new_followers: (acc.new_followers || 0) + (day.new_followers || 0),
    new_connections: (acc.new_connections || 0) + (day.new_connections || 0),
  }), {}) || {};

  const chartData = [
    { label: 'Profile Views', value: totals.profile_views || 0, color: '#00d4ff' },
    { label: 'Portfolio', value: totals.portfolio_views || 0, color: '#00ff88' },
    { label: 'Business', value: totals.business_views || 0, color: '#ffaa00' },
    { label: 'Services', value: totals.service_views || 0, color: '#ff00ff' },
    { label: 'Products', value: totals.product_views || 0, color: '#aa66ff' },
    { label: 'New Followers', value: totals.new_followers || 0, color: '#ff4444' },
  ];

  const maxValue = Math.max(...chartData.map(d => d.value), 1);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Profile Analytics</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.periodSelector}>
          {['7 Days', '30 Days', '90 Days', 'All Time'].map(p => (
            <TouchableOpacity key={p} style={[styles.periodBtn, p === '30 Days' && styles.periodBtnActive]}>
              <Text style={[styles.periodText, p === '30 Days' && styles.periodTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.chartCard}>
          {chartData.map(item => (
            <View key={item.label} style={styles.chartRow}>
              <Text style={styles.chartLabel}>{item.label}</Text>
              <View style={styles.chartBarBg}>
                <View style={[styles.chartBarFill, { width: `${(item.value / maxValue) * 100}%`, backgroundColor: item.color }]} />
              </View>
              <Text style={[styles.chartValue, { color: item.color }]}>{item.value}</Text>
            </View>
          ))}
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Insights</Text>
          <View style={styles.insightCard}>
            <Ionicons name="trending-up-outline" size={24} color="#00ff88" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.insightTitle}>Profile Views +12%</Text>
              <Text style={styles.insightSub}>Compared to last period</Text>
            </View>
          </View>
          <View style={styles.insightCard}>
            <Ionicons name="people-outline" size={24} color="#00d4ff" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.insightTitle}>Follower Growth +5%</Text>
              <Text style={styles.insightSub}>New followers this month</Text>
            </View>
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
  periodSelector: { flexDirection: 'row', padding: 16, gap: 8 },
  periodBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14, backgroundColor: '#111' },
  periodBtnActive: { backgroundColor: '#00d4ff22' },
  periodText: { color: '#888', fontSize: 12 },
  periodTextActive: { color: '#00d4ff', fontWeight: '600' },
  chartCard: { margin: 16, backgroundColor: '#111', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#1a1a1a' },
  chartRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  chartLabel: { color: '#888', fontSize: 11, width: 90 },
  chartBarBg: { flex: 1, height: 8, backgroundColor: '#222', borderRadius: 4, overflow: 'hidden' },
  chartBarFill: { height: '100%', borderRadius: 4 },
  chartValue: { fontSize: 12, fontWeight: '700', width: 40, textAlign: 'right' },
  section: { paddingHorizontal: 16, marginTop: 8 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  insightCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#1a1a1a' },
  insightTitle: { color: '#fff', fontSize: 14, fontWeight: '600' },
  insightSub: { color: '#888', fontSize: 12, marginTop: 2 },
});
