// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, TrendingUp, Users, BedDouble, Wallet, Activity, Calendar, AlertTriangle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useHealthRole } from '@/lib/health/hooks';

export default function HealthAnalyticsScreen() {
  const router = useRouter();
  const { isSystemAdmin } = useHealthRole();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const since = new Date(Date.now() - days * 86400000).toISOString();

      const [
        { count: patientCount },
        { count: appointmentCount },
        { count: staffCount },
        { data: revenueData },
        { data: topFacilities },
      ] = await Promise.all([
        supabase.from('health_patients').select('*', { count: 'exact', head: true }).gte('created_at', since),
        supabase.from('health_appointments').select('*', { count: 'exact', head: true }).gte('created_at', since),
        supabase.from('health_staff').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('health_billing').select('amount').eq('status', 'paid').gte('created_at', since),
        supabase.from('health_facilities').select('name, bed_capacity, icu_beds').order('created_at', { ascending: false }).limit(5),
      ]);

      const totalRevenue = revenueData?.reduce((sum: number, r: any) => sum + (r.amount || 0), 0) || 0;

      setStats({
        patients: patientCount || 0,
        appointments: appointmentCount || 0,
        staff: staffCount || 0,
        revenue: totalRevenue,
        facilities: topFacilities || [],
      });
    } catch (err) {
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Health Analytics</Text>
      </View>

      <View style={styles.periodRow}>
        {(['7d', '30d', '90d'] as const).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodChip, period === p && styles.periodChipActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
              {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: '#eff6ff' }]}>
          <Users size={24} color="#2563eb" />
          <Text style={styles.statValue}>{stats?.patients || 0}</Text>
          <Text style={styles.statLabel}>New Patients</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#f0fdf4' }]}>
          <Calendar size={24} color="#16a34a" />
          <Text style={styles.statValue}>{stats?.appointments || 0}</Text>
          <Text style={styles.statLabel}>Appointments</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#fefce8' }]}>
          <Wallet size={24} color="#ca8a04" />
          <Text style={styles.statValue}>KES {(stats?.revenue || 0).toLocaleString()}</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#fdf2f8' }]}>
          <Activity size={24} color="#db2777" />
          <Text style={styles.statValue}>{stats?.staff || 0}</Text>
          <Text style={styles.statLabel}>Active Staff</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Top Facilities</Text>
      {stats?.facilities?.map((f: any, i: number) => (
        <View key={i} style={styles.facilityCard}>
          <BedDouble size={20} color="#6b7280" />
          <View style={styles.facilityInfo}>
            <Text style={styles.facilityName}>{f.name}</Text>
            <Text style={styles.facilityMeta}>Beds: {f.bed_capacity} · ICU: {f.icu_beds}</Text>
          </View>
        </View>
      ))}

      {!isSystemAdmin && (
        <View style={styles.warning}>
          <AlertTriangle size={16} color="#ca8a04" />
          <Text style={styles.warningText}>Limited view. Full analytics require System Admin access.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  loadingText: { marginTop: 12, color: '#6b7280', fontSize: 14 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1f2937' },
  periodRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  periodChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb' },
  periodChipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  periodText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  periodTextActive: { color: '#fff' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10 },
  statCard: { width: '47%', padding: 16, borderRadius: 12, alignItems: 'center', gap: 6 },
  statValue: { fontSize: 20, fontWeight: '800', color: '#1f2937' },
  statLabel: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937', marginHorizontal: 16, marginTop: 20, marginBottom: 10 },
  facilityCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', gap: 12 },
  facilityInfo: { flex: 1 },
  facilityName: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  facilityMeta: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  warning: { flexDirection: 'row', alignItems: 'center', margin: 16, padding: 12, backgroundColor: '#fef9c3', borderRadius: 8, gap: 8 },
  warningText: { fontSize: 12, color: '#854d0e', flex: 1 },
});
