// @ts-nocheck
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTraditionalHealer } from '@/lib/health/hooks/useTraditionalHealer';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Leaf, Users, Calendar, Star, TrendingUp, Package, MessageSquare, ChevronRight } from 'lucide-react-native';

const QUICK_ACTIONS = [
  { label: 'My Remedies', icon: Package, route: '/(os)/health/traditional-healer/remedies', color: '#10B981' },
  { label: 'Consultations', icon: Calendar, route: '/(os)/health/traditional-healer/consultations', color: '#3B82F6' },
  { label: 'Patients', icon: Users, route: '/(os)/health/traditional-healer/patients', color: '#F59E0B' },
  { label: 'Messages', icon: MessageSquare, route: '/(os)/health/traditional-healer/messages', color: '#8B5CF6' },
];

export default function TraditionalHealerHome() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { profile, stats, isLoading } = useTraditionalHealer();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.avatar}><Leaf size={32} color="#fff" /></View>
          <View style={styles.headerInfo}>
            <Text style={styles.name}>{profile?.full_name || 'Traditional Healer'}</Text>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, profile?.is_verified ? styles.verifiedBadge : styles.pendingBadge]}>
                <Text style={styles.badgeText}>{profile?.is_verified ? 'Verified' : 'Pending'}</Text>
              </View>
              <Text style={styles.practiceType}>{profile?.practice_type?.replace('_', ' ') || 'Herbalist'}</Text>
            </View>
          </View>
        </View>
        <View style={styles.ratingCard}>
          <Star size={18} color="#F59E0B" fill="#F59E0B" />
          <Text style={styles.ratingValue}>{(profile?.rating || 0).toFixed(1)}</Text>
          <Text style={styles.ratingCount}>({profile?.review_count || 0} reviews)</Text>
        </View>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statBox}><Text style={styles.statNumber}>{stats?.consultationsToday || 0}</Text><Text style={styles.statLabel}>Today</Text></View>
        <View style={styles.statBox}><Text style={styles.statNumber}>{stats?.totalConsultations || 0}</Text><Text style={styles.statLabel}>Total</Text></View>
        <View style={styles.statBox}><Text style={styles.statNumber}>${(stats?.earningsToday || 0).toFixed(0)}</Text><Text style={styles.statLabel}>Earnings</Text></View>
        <View style={styles.statBox}><Text style={styles.statNumber}>{stats?.remediesCount || 0}</Text><Text style={styles.statLabel}>Remedies</Text></View>
      </View>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        {QUICK_ACTIONS.map((action: any) => {
          const Icon = action.icon;
          return (
            <TouchableOpacity key={action.label} style={styles.actionCard} onPress={() => router.push(action.route as any)}>
              <View style={[styles.actionIcon, { backgroundColor: action.color + '15' }]}><Icon size={24} color={action.color} /></View>
              <Text style={styles.actionLabel}>{action.label}</Text>
              <ChevronRight size={16} color="#D1D5DB" />
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Earnings</Text>
          <TouchableOpacity><TrendingUp size={18} color="#0A4DA6" /></TouchableOpacity>
        </View>
        <View style={styles.earningsCard}>
          <Text style={styles.earningsTotal}>${(stats?.totalEarnings || 0).toLocaleString()}</Text>
          <Text style={styles.earningsLabel}>Lifetime Earnings</Text>
          <View style={styles.earningsBar}><View style={[styles.earningsFill, { width: '65%' }]} /></View>
          <Text style={styles.earningsSub}>65% of monthly goal reached</Text>
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Consultations</Text>
        {stats?.recentConsultations?.length === 0 ? <Text style={styles.emptyText}>No consultations yet</Text>
         : stats?.recentConsultations?.map((c: any) => (
          <TouchableOpacity key={c.id} style={styles.consultRow} onPress={() => router.push(`/(os)/health/traditional-healer/consultations/${c.id}` as any)}>
            <View style={styles.consultLeft}>
              <Text style={styles.consultPatient}>{c.patient_name || 'Patient'}</Text>
              <Text style={styles.consultType}>{c.consultation_type} · {c.chief_complaint?.slice(0, 30)}...</Text>
            </View>
            <View style={styles.consultRight}>
              <Text style={styles.consultFee}>${c.fee || 0}</Text>
              <Text style={[styles.consultStatus, c.payment_status === 'paid' ? styles.paidStatus : styles.pendingStatus]}>{c.payment_status}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { backgroundColor: '#059669', padding: 20, paddingTop: 50, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerContent: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerInfo: { marginLeft: 14, flex: 1 },
  name: { fontSize: 20, fontWeight: '700', color: '#fff' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  verifiedBadge: { backgroundColor: '#10B981' },
  pendingBadge: { backgroundColor: '#F59E0B' },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  practiceType: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  ratingCard: { flexDirection: 'row', alignItems: 'center', marginTop: 16, backgroundColor: 'rgba(255,255,255,0.1)', padding: 10, borderRadius: 10, alignSelf: 'flex-start' },
  ratingValue: { fontSize: 16, fontWeight: '700', color: '#fff', marginLeft: 6 },
  ratingCount: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginLeft: 4 },
  statsRow: { flexDirection: 'row', padding: 16, gap: 10 },
  statBox: { flex: 1, backgroundColor: '#fff', padding: 14, borderRadius: 12, alignItems: 'center' },
  statNumber: { fontSize: 18, fontWeight: '800', color: '#059669' },
  statLabel: { fontSize: 11, color: '#6B7280', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginHorizontal: 16, marginTop: 16, marginBottom: 10 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 10 },
  actionCard: { width: '47%', backgroundColor: '#fff', padding: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  actionIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: '#374151' },
  section: { backgroundColor: '#fff', margin: 12, padding: 16, borderRadius: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  earningsCard: { alignItems: 'center', padding: 16 },
  earningsTotal: { fontSize: 32, fontWeight: '800', color: '#059669' },
  earningsLabel: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  earningsBar: { width: '100%', height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, marginTop: 16 },
  earningsFill: { height: 8, backgroundColor: '#10B981', borderRadius: 4 },
  earningsSub: { fontSize: 12, color: '#9CA3AF', marginTop: 8 },
  consultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  consultLeft: { flex: 1 },
  consultPatient: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  consultType: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  consultRight: { alignItems: 'flex-end' },
  consultFee: { fontSize: 14, fontWeight: '700', color: '#0A4DA6' },
  consultStatus: { fontSize: 11, fontWeight: '600', marginTop: 2, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  paidStatus: { backgroundColor: '#ECFDF5', color: '#10B981' },
  pendingStatus: { backgroundColor: '#FEF3C7', color: '#F59E0B' },
  emptyText: { color: '#9CA3AF', textAlign: 'center', padding: 16 },
});
