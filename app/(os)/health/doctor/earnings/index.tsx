// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Wallet, TrendingUp, Calendar, DollarSign, Users } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useHealthRole } from '@/lib/health/hooks';

export default function DoctorEarningsScreen() {
  const router = useRouter();
  const { staffRecord } = useHealthRole();
  const [earnings, setEarnings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => { fetchEarnings(); }, [period, staffRecord?.id]);

  const fetchEarnings = async () => {
    if (!staffRecord?.id) { setLoading(false); return; }
    setLoading(true);
    try {
      const now = new Date();
      const startDate = new Date();
      if (period === 'week') startDate.setDate(now.getDate() - 7);
      else if (period === 'month') startDate.setMonth(now.getMonth() - 1);
      else startDate.setFullYear(now.getFullYear() - 1);

      const { data: consultations, error: cErr } = await supabase
        .from('health_billing')
        .select('amount, created_at')
        .eq('doctor_id', staffRecord.id)
        .eq('status', 'paid')
        .gte('created_at', startDate.toISOString());

      const { data: telemedicine, error: tErr } = await supabase
        .from('health_telemedicine_sessions')
        .select('fee, created_at')
        .eq('doctor_id', staffRecord.id)
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString());

      const { count: patientCount } = await supabase
        .from('health_appointments')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', staffRecord.id)
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString());

      const consultTotal = consultations?.reduce((s: number, r: any) => s + (r.amount || 0), 0) || 0;
      const teleTotal = telemedicine?.reduce((s: number, r: any) => s + (r.fee || 0), 0) || 0;
      const total = consultTotal + teleTotal;

      setEarnings({
        total,
        consultations: consultTotal,
        telemedicine: teleTotal,
        patients: patientCount || 0,
        consultationCount: consultations?.length || 0,
        telemedicineCount: telemedicine?.length || 0,
      });
    } catch (err) {
      console.error('Earnings error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Loading earnings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><ArrowLeft size={24} color="#1f2937" /></TouchableOpacity>
        <Text style={styles.headerTitle}>My Earnings</Text>
      </View>

      <View style={styles.periodRow}>
        {(['week', 'month', 'year'] as const).map((p) => (
          <TouchableOpacity key={p} style={[styles.periodChip, period === p && styles.periodChipActive]} onPress={() => setPeriod(p)}>
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>{p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : 'This Year'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.totalCard}>
        <Wallet size={32} color="#10b981" />
        <Text style={styles.totalLabel}>Total Earnings</Text>
        <Text style={styles.totalValue}>KES {(earnings?.total || 0).toLocaleString()}</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: '#eff6ff' }]}>
          <DollarSign size={20} color="#2563eb" />
          <Text style={styles.statValue}>KES {(earnings?.consultations || 0).toLocaleString()}</Text>
          <Text style={styles.statLabel}>Consultations ({earnings?.consultationCount || 0})</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#fdf2f8' }]}>
          <TrendingUp size={20} color="#db2777" />
          <Text style={styles.statValue}>KES {(earnings?.telemedicine || 0).toLocaleString()}</Text>
          <Text style={styles.statLabel}>Telemedicine ({earnings?.telemedicineCount || 0})</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#f0fdf4' }]}>
          <Users size={20} color="#16a34a" />
          <Text style={styles.statValue}>{earnings?.patients || 0}</Text>
          <Text style={styles.statLabel}>Patients Seen</Text>
        </View>
      </View>
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
  periodChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb' },
  periodChipActive: { backgroundColor: '#10b981', borderColor: '#10b981' },
  periodText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  periodTextActive: { color: '#fff' },
  totalCard: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 8, padding: 24, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  totalLabel: { fontSize: 13, color: '#6b7280', marginTop: 8 },
  totalValue: { fontSize: 32, fontWeight: '800', color: '#1f2937', marginTop: 4 },
  statsGrid: { paddingHorizontal: 16, paddingTop: 12, gap: 10 },
  statCard: { padding: 16, borderRadius: 12, alignItems: 'center', gap: 6 },
  statValue: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
  statLabel: { fontSize: 11, color: '#6b7280', fontWeight: '500' },
});
